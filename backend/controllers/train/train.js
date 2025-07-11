import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import axios from 'axios';
import { spawn } from 'child_process';
import csv from 'csv-parser';
import { YoloServices } from './Services/yolo.js';

async function runPythonTrain(scriptPath, args, logger, socket) {
    return await new Promise((resolve, reject) => {
        const python = spawn('python', [scriptPath, ...args]);

        python.stdout.on('data', (data) => {
            const msg = data.toString();
            logger.push(`[STDOUT] ${msg}`);
            console.log(`[STDOUT] ${msg}`);
            // Divide en líneas y procesa cada una
            const lines = msg.split(/\r?\n/);
            for (const line of lines) {
                // Busca el patrón de epoch en cualquier parte de la línea
                const match = line.match(/(\d+)\s*\/\s*(\d+)/);
                if (socket && match) {
                    const currentEpoch = parseInt(match[1], 10);
                    const totalEpochs = parseInt(match[2], 10);
                    const scaledProgress = 6 + Math.floor((currentEpoch / totalEpochs) * (9 - 6));
                    console.log(`Scaled Progress: ${scaledProgress}`);
                    console.log(`Current Epoch: ${currentEpoch}, Total Epochs: ${totalEpochs}`);
                    socket.emit('train:progress', {
                        current: scaledProgress,
                        total: 10,
                        message: `Entrenando... (${currentEpoch}/${totalEpochs})`
                    });
                }
            }

        });

        python.stderr.on('data', (data) => {
            const msg = data.toString();
            logger.push(`[STDERR] ${msg}`);
        });

        python.on('close', (code) => {
            if (code === 0) {
                if (socket) {
                    socket.emit('train:progress', {
                        current: 9,
                        total: 10,
                        message: 'Entrenamiento completado...'
                    });
                }
                resolve(true);
            } else {
                if (socket) {
                    socket.emit('train:error', `❌ Entrenamiento fallido (código ${code})`);
                }
                resolve(false);
            }
        });

        python.on('error', (err) => {
            logger.push(`[PROCESS ERROR] ${err.message}`);
            if (socket) socket.emit('train:error', `❌ Error en el proceso de entrenamiento`);
            reject(err);
        });
    });
}

async function LocalTrain(imageModel, labelModel, s3Model, YoloModel, socket, userId, projectId, name, modeloSeleccionado, descripcion, imagenes) {
    let logger = [];

    logger.push(`Iniciando entrenamiento local...`);

    socket.emit('train:progress', {
        current: 1,
        total: 10,
        message: 'Archivos de entrenamiento recibidos, iniciando proceso...'
    });

    // 1. Crear la estructura de carpetas para el proyecto y limpiar si ya existe
    const rutas = YoloServices.generarEstructuraProyecto(projectId);

    // 2. Preparar la carpeta de resultados YOLO (runs/train/projectId)
    const resultadosPath = YoloServices.prepararResultadosYolo(projectId);

    socket.emit('train:progress', {
        current: 2,
        total: 10,
        message: '📦 Preparando archivos de entrenamiento...'
    });

    try {
        // 3. Obtener imágenes y etiquetas (solo las que tienen labels)
        const [imagenDoc, labelDocs] = await YoloServices.getImagesLabels(imageModel, labelModel, imagenes);

        if (!imagenDoc || !imagenDoc.length) {
            socket.emit('train:error', '❌ No se encontraron imágenes válidas para el entrenamiento');
            return { error: 'No se encontraron imágenes válidas para el entrenamiento' };
        }

        // 4. Generar class map y etiquetas por imagen
        const nombresDeClase = Array.from(new Set(labelDocs.map(label => label.name)));
        const classMap = Object.fromEntries(nombresDeClase.map((name, index) => [name, index]));
        const etiquetasPorImagen = labelDocs.reduce((acc, label) => {
            const id = label.imageId.toString();
            if (!acc[id]) acc[id] = [];
            acc[id].push(label);
            return acc;
        }, {});

        socket.emit('train:progress', {
            current: 3,
            total: 10,
            message: '📦 Guardando imágenes y etiquetas...'
        });

        // 5. Barajar, distribuir y guardar imágenes y etiquetas
        const result = await YoloServices.distribuirYGuardarImagenesYLabels(imagenDoc, rutas, etiquetasPorImagen, classMap);

        if (!result.success) {
            socket.emit('train:error', result.error);
            return { error: result.error };
        }

        socket.emit('train:progress', {
            current: 4,
            total: 10,
            message: '📝 Generando archivo YAML...'
        });

        // 6. Crear data.yaml
        fs.writeFileSync(
            path.join(rutas.baseDir, 'data.yaml'),
            [
                `path: ./datasets/${projectId}`,
                `train: images/train`,
                `val: images/val`,
                `nc: ${nombresDeClase.length}`,
                `names: [${nombresDeClase.map(name => `"${name}"`).join(', ')}]`
            ].join('\n')
        );

        socket.emit('train:progress', {
            current: 5,
            total: 10,
            message: '🚦 Lanzando entrenamiento Python ...'
        });

        // 7. Llama al script de entrenamiento de Python
        try {
            const scriptPath = './controllers/train/python/train_yolo.py';
            const dataYamlPath = path.join(rutas.baseDir, 'data.yaml');
            const nombreModelo = 'best_model';

            const args = [
                '--project', projectId,
                '--model', modeloSeleccionado,
                '--data_path', dataYamlPath,
                '--project_path', resultadosPath,
                '--name', nombreModelo,
                '--imgsz', 640,
                '--epochs', 10
            ];

            const success = await runPythonTrain(scriptPath, args, logger, socket);

            if (success) {
                // 1. Subir modelo entrenado a S3 
                const weightsPath = path.join('runs/train', projectId, nombreModelo, 'weights', 'best.pt');
                const modelUrl = await s3Model.uploadFileFromPath(weightsPath, `${projectId}/${name}/best.pt`);

                // 2. Subir logs a S3
                const logsKey = `logs/${projectId}_train_log.txt`;
                const logUrl = await s3Model.uploadLogBufferToS3(logger.join('\n'), logsKey, 'text/plain');

                // 3. Extraer métricas (opcional)
                let metricas = {};
                try {
                    metricas = await YoloServices.extraerMetricas(projectId, nombreModelo);
                } catch (e) {
                    metricas = {};
                }

                // 4. Guardar en base de datos
                const input = {
                    projectId,
                    userId,
                    name,
                    url: modelUrl,           // Modelo S3
                    logs: logUrl,            // Logs S3
                    descripcion,
                    model: modeloSeleccionado,
                    metadata: metricas
                };
                console.log('Guardando modelo en la base de datos:', input);

                const save_result = await YoloModel.createYolo({ input });
                if (save_result.result !== 'success') {
                    socket.emit('train:error', '❌ Error al guardar el modelo en la base de datos');
                    return false;
                }

                // 5. Notifica por socket
                socket.emit('train:progress', {
                    current: 10,
                    total: 10,
                    message: '✅ Modelo y logs subidos y guardados correctamente'
                });

                return true;
            } else {
                // Manejo de error si el entrenamiento falló
                socket.emit('train:error', '❌ El entrenamiento falló. No se guardó ningún modelo.');
                return false;
            }


        } catch (error) {
            console.error('Error al iniciar el script de Python:', error);
            socket.emit('train:error', '❌ Error al iniciar el script de Python');
            return false;
        }

    } catch (error) {
        console.error('Error al procesar las imágenes y etiquetas:', error);
        socket.emit('train:error', '❌ Error al procesar las imágenes y etiquetas');
        return false;
    }
}


export class TrainController {
    constructor({ imageModel, labelModel, S3Model, YoloModel }) {
        this.imageModel = imageModel;
        this.labelModel = labelModel;
        this.S3Model = S3Model;
        this.YoloModel = YoloModel;
    }

    TrainYoloLocal = async (socket, req, res) => {
        const { userId, projectId, name, imagenes, model: modeloSeleccionado, descripcion } = req.body;

        if (!userId || !projectId || !imagenes || !imagenes.length || !modeloSeleccionado) {
            return res.status(400).json({ error: 'Faltan parámetros requeridos' });
        }
        const check_name = await this.YoloModel.existsByName({ name });
        if (check_name) {
            return res.status(400).json({ error: 'Ya existe un modelo con ese nombre' });
        }

        try {
            const success = await LocalTrain(this.imageModel, this.labelModel, this.S3Model, this.YoloModel, socket, userId, projectId, name, modeloSeleccionado, descripcion, imagenes);
            if (success) {
                return res.status(200).json({ status: 'ok', mensaje: 'Entrenamiento completado' });
            } else {
                return res.status(503).json({ error: 'Error en el entrenamiento local' });
            }
        } catch (error) {
            console.error('Error en el entrenamiento local:', error);
            socket.emit('train:error', '❌ Error en el entrenamiento local');
            return res.status(501).json({ error: 'Error en el entrenamiento local' });
        }

    }
}


