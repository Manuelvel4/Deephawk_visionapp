import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import csv from 'csv-parser';

/**
 * Clase utilitaria para la gestión de carpetas, datasets y procesamiento de resultados
 * de proyectos de entrenamiento y validación de imágenes YOLO.
 */
export class YoloServices {
    /**
     * Genera la estructura de carpetas necesaria para un proyecto de entrenamiento y validación de imágenes.
     * Elimina la carpeta si ya existe, evitando acumulación de datos antiguos.
     */
    static generarEstructuraProyecto(nombreProyecto) {
        const datasetsPath = 'datasets';
        const baseDir = path.join(datasetsPath, nombreProyecto);
        const ruta_img_train = path.join(baseDir, 'images/train');
        const ruta_lbl_train = path.join(baseDir, 'labels/train');
        const ruta_img_val = path.join(baseDir, 'images/val');
        const ruta_lbl_val = path.join(baseDir, 'labels/val');

        if (fs.existsSync(baseDir)) {
            fs.rmSync(baseDir, { recursive: true, force: true });
        }

        fs.mkdirSync(ruta_img_train, { recursive: true });
        fs.mkdirSync(ruta_lbl_train, { recursive: true });
        fs.mkdirSync(ruta_img_val, { recursive: true });
        fs.mkdirSync(ruta_lbl_val, { recursive: true });

        return {
            imgTrain: ruta_img_train,
            lblTrain: ruta_lbl_train,
            imgVal: ruta_img_val,
            lblVal: ruta_lbl_val,
            baseDir
        };
    }

    /**
     * Borra la carpeta de resultados de entrenamiento de YOLO si ya existe,
     * para evitar acumular ejecuciones antiguas y ahorrar espacio.
     */
    static prepararResultadosYolo(projectId) {
        const resultadosPath = path.join('runs', 'train', projectId);
        if (fs.existsSync(resultadosPath)) {
            fs.rmSync(resultadosPath, { recursive: true, force: true });
        }
        return resultadosPath;
    }

    /**
     * Baraja un array usando Fisher-Yates. No modifica el array original.
     * @param {Array} array 
     * @returns {Array} Nuevo array barajado
     */
    static barajarArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * Distribuye imágenes aleatoriamente en train/val, y guarda tanto imágenes como labels en sus carpetas destino.
     * @param {Array} imagenDoc - Array de documentos de imagen.
     * @param {Object} rutas - Rutas de carpetas destino (como las devueltas por generarEstructuraProyecto).
     * @param {Object} etiquetasPorImagen - Diccionario {idImagen: [labels]}.
     * @param {Object} classMap - Diccionario {nombreClase: indice}.
     * @returns {Object} Métricas y estado del guardado.
     */
    static async distribuirYGuardarImagenesYLabels(imagenDoc, rutas, etiquetasPorImagen, classMap) {
        let trainIdx = [], valIdx = [];
        const total = imagenDoc.length;

        // Baraja las imágenes antes de repartir
        const imagenesBarajadas = YoloServices.barajarArray(imagenDoc);

        if (total > 10) {
            const numTrain = Math.round(total * 0.7);
            trainIdx = imagenesBarajadas.slice(0, numTrain);
            valIdx = imagenesBarajadas.slice(numTrain);
        } else if (total > 1) {
            trainIdx = imagenesBarajadas.slice(0, total - 1);
            valIdx = imagenesBarajadas.slice(total - 1);
        } else if (total === 1) {
            trainIdx = [imagenesBarajadas[0]];
            valIdx = [];
        }

        // Helper para guardar imagen y label en el path correcto
        async function guardarImagenYLabel(img, imgDir, lblDir) {
            const imageResponse = await axios.get(img.url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imageResponse.data);
            const outputPath = path.join(imgDir, `${img._id}.jpg`);
            await sharp(buffer).jpeg({ quality: 90 }).toFile(outputPath);

            const etiquetas = etiquetasPorImagen[img._id.toString()] || [];
            const contenidoYOLO = etiquetas
                .map((label) => `${classMap[label.name]} ${label.coordinates.join(' ')}`)
                .join('\n');
            const labelPath = path.join(lblDir, `${img._id}.txt`);
            fs.writeFileSync(labelPath, contenidoYOLO);
        }

        try {
            // Procesar train y val
            await Promise.all(trainIdx.map(img => guardarImagenYLabel(img, rutas.imgTrain, rutas.lblTrain)));
            await Promise.all(valIdx.map(img => guardarImagenYLabel(img, rutas.imgVal, rutas.lblVal)));

            return {
                trainCount: trainIdx.length,
                valCount: valIdx.length,
                error: null,
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: `Error al guardar imágenes y etiquetas: ${error.message}`
            };
        }
    }

    /**
     * Obtiene documentos de imagen y etiquetas, solo para imágenes que tengan etiquetas asociadas.
     * @param {*} imageModel Modelo de imágenes
     * @param {*} labelModel Modelo de etiquetas
     * @param {Array} imagenes Array de IDs de imagen
     * @returns {[Array, Array]} [imagenDoc, labelDocs]
     */
    static async getImagesLabels(imageModel, labelModel, imagenes) {
        const imagenDoc = [];
        const labelDocs = [];

        for (const id of imagenes) {
            const etiquetas = await labelModel.getAllByImage({ imageId: id });
            if (etiquetas && etiquetas.length > 0) {
                const image = await imageModel.getByImageId({ imageId: id });
                if (image) imagenDoc.push(image);
                labelDocs.push(...etiquetas);
            }
        }
        return [imagenDoc, labelDocs];
    }

    /**
     * Extrae métricas del csv de resultados YOLO (por ejemplo: epoch, loss, mAP, etc).
     * @param {string} projectId 
     * @returns {Promise<Object>} Métricas de la última epoch
     */
    static async extraerMetricas(projectId, name) {
        const resultsPath = path.join('runs/train', projectId, name, 'results.csv');
        return new Promise((resolve, reject) => {
            const rows = [];
            fs.createReadStream(resultsPath)
                .pipe(csv())
                .on('data', (data) => rows.push(data))
                .on('end', () => {
                    const ultima = rows[rows.length - 1];
                    resolve({
                        epoch: parseInt(ultima.epoch),
                        train_box_loss: parseFloat(ultima['train/box_loss']),
                        val_box_loss: parseFloat(ultima['val/box_loss']),
                        map_50: parseFloat(ultima['metrics/mAP_0.5']),
                        map_50_95: parseFloat(ultima['metrics/mAP_0.5:0.95']),
                    });
                })
                .on('error', reject);
        });
    }
}
