import React, { useState, useEffect, useContext } from 'react';
import { Card, message, Alert, Spin, Typography, Switch } from 'antd';
import axios from 'axios';
import { Button, Input, Select } from 'antd';
import './CameraSelector.css';
import { AuthContext } from '../../../components/auth/auth-context';
import JSZip from 'jszip';
import { io, Socket } from "socket.io-client";
import { useRef } from 'react';


const { Option } = Select;
const { Title } = Typography;

export default function TestModelPage() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<'realsense' | 'ip'>('realsense');
    const [ipUrl, setIpUrl] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [statusModel, setStatusModel] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [messageText, setMessage] = useState('');
    const [messageTextModel, setMessageModel] = useState('');
    const [proyectos, setProyectos] = useState<any[]>([]);
    const [modeloSeleccionado, setModeloSeleccionado] = useState<string | undefined>();
    const [proyectoSeleccionado, setProyectoSeleccionado] = useState<string | undefined>();
    const [modelosEntrenados, setModelosEntrenados] = useState<any[]>([]);
    const { user, setProjects } = useContext(AuthContext);
    const [bloquearModelo, setBloquearModelo] = useState(false);
    const [proyectoGuardar, setProyectoGuardar] = useState<string | undefined>();
    const [modoCaptura, setModoCaptura] = useState<'foto' | 'streaming'>('foto');
    const [capturando, setCapturando] = useState(false);
    const [imageCorte, setImageCorte] = useState<string | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [socketId, setSocketId] = useState<string | null>(null);
    const isProcessingFrame = useRef(false);

    useEffect(() => {
        if (!socket) return;

        socket.on('imagenes', (data) => {
            if (isProcessingFrame.current) return;

            isProcessingFrame.current = true;

            setImageUrl(`data:image/jpeg;base64,${data.imagen1}`);
            setImageCorte(`data:image/jpeg;base64,${data.imagen2}`);

            requestAnimationFrame(() => {
                isProcessingFrame.current = false;
            });
        });

        return () => {
            socket.off('imagenes');
        };
    }, [socket]);


    useEffect(() => {
        if (modelosEntrenados.length === 0) {
            setModeloSeleccionado(null);
            setStatusModel('idle');
        }
        if (statusModel !== 'idle') {
            setStatusModel('idle');
            setMessageModel('');
        }
    }, [modelosEntrenados, modeloSeleccionado]);

    useEffect(() => {
        const fetchProyectos = async () => {
            if (!user?.id) return;
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/project/user/${user.id}`, { withCredentials: true });
                setProyectos(res.data);
            } catch (err) {
                console.error('Error al obtener proyectos:', err);
            }
        };

        const fetchModelos = async () => {
            try {
                console.log('Proyecto seleccionado:', proyectoSeleccionado);
                if (!proyectoSeleccionado) return;
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/yolo/project/${proyectoSeleccionado}`, { withCredentials: true });
                if (res.data.length === 0) {
                    setModelosEntrenados([]);
                    setModeloSeleccionado(undefined);
                    setStatusModel('idle');
                    setMessageModel('❌ No hay modelos entrenados para este proyecto');
                }
                else {
                    setMessageModel('');
                    setModelosEntrenados(res.data);
                }

            } catch (err) {
                console.error('Error al obtener modelos:', err);
            }
        };

        fetchProyectos();
        fetchModelos();
    }, [proyectoSeleccionado]);


    const handleConnect = async () => {
        setStatus('loading');
        setMessage('');
        try {
            const payload = type === 'ip' ? { type, ip_url: ipUrl } : { type };
            const res = await axios.post(`${import.meta.env.VITE_FLASK_URL}/camera/connect`, payload);

            if (res.data.success) {
                setStatus('success');
                setBloquearModelo(true);
                setMessage('✅ Conectado correctamente');
            } else {
                setStatus('error');
                setMessage('❌ No se pudo conectar');
            }
        } catch (err) {
            setStatus('error');
            setMessage('❌ Error de conexión');
        }
    };

    const handleDisconnect = async () => {
        await axios.post(`${import.meta.env.VITE_FLASK_URL}/camera/disconnect`);
        setStatus('idle');
        setMessage('🔌 Desconectado');
    };

    const handleModelLoad = async () => {

        if (!modeloSeleccionado) {
            setMessage('❌ Selecciona un modelo');
            setStatusModel('error');
            return;
        }

        try {
            const res = await axios.post(`${import.meta.env.VITE_FLASK_URL}/yolo/load`, {
                model_url: modeloSeleccionado
            });


            if (res.data.success) {
                setStatusModel('success');
                setMessage('✅ Modelo cargado correctamente');

                if (socket) {
                    socket.disconnect();
                    console.log('🔌 Socket anterior desconectado');
                }

                const newSocket = io(import.meta.env.VITE_FLASK_URL, {
                    transports: ['websocket'],
                    withCredentials: true,
                });

                newSocket.on('connect', () => {
                    console.log('✅ Socket conectado:', newSocket.id);
                    setSocketId(String(newSocket.id));
                });

                newSocket.on('imagenes', (data) => {
                    console.log('📷 Imágenes recibidas');
                    setImageUrl(`data:image/jpeg;base64,${data.imagen1}`);
                    setImageCorte(`data:image/jpeg;base64,${data.imagen2}`);
                    setLoading(false);
                });
                setSocket(newSocket);
            } else {
                setStatusModel('error');
                setMessage('❌ Error al cargar el modelo');
            }
        } catch (err) {
            console.error(err);
            setStatusModel('error');
            setMessage('❌ Error de conexión al cargar el modelo');
        }
    };

    const handleCapturaFoto = () => {
        if (!modeloSeleccionado) {
            message.warning('Selecciona un modelo primero');
            return;
        }

        if (!socket || !socketId) {
            alert('Primero debes hacer clic en "Cargar" para conectar el socket');
            return;
        }

        setCapturando(true);

        const payload = {
            model_url: modeloSeleccionado,
            type,
            ip_url: type === 'ip' ? ipUrl : ''
            // 👇 ya no necesitas enviar socketId, el backend usa request.sid
        };

        // 🔁 Emitimos el evento al backend
        socket.emit('captura', payload);
    };

    const handleIniciarStreaming = () => {
        if (!modeloSeleccionado) {
            message.warning('Selecciona un modelo primero');
            return;
        }
        if (!socket || !socketId) {
            alert('Primero debes hacer clic en "Cargar" para conectar el socket');
            return;
        }

        if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
            streamingIntervalRef.current = null;
            message.info('⏹️ Streaming detenido');
        } else {
            message.info('📡 Iniciando streaming...');
            streamingIntervalRef.current = setInterval(() => {
                socket.emit('captura', {
                    model_url: modeloSeleccionado,
                    type,
                    ip_url: type === 'ip' ? ipUrl : ''
                });
            }, 200); // cada 150ms (~6 FPS)
            message.success('🎥 Streaming iniciado');
        }
    };
    const handleGuardarImagen = async () => {
        if (modoCaptura !== 'foto') {
            message.warning('Solo puedes guardar en modo foto');
            return;
        }

        if (!imageCorte || !proyectoGuardar) {
            message.warning('Falta imagen o proyecto');
            return;
        }

        try {
            // Paso 1: Descargar la imagen desde base64
            const response = await fetch(imageCorte);
            const blob = await response.blob();
            const file = new File([blob], 'captura_corte.jpg', { type: 'image/jpeg' });

            // Paso 2: Subirla a S3
            const formData = new FormData();
            formData.append('file', file);

            const s3Res = await axios.put(`${import.meta.env.VITE_API_URL}/s3/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });

            const url = s3Res.data.url;

            // Paso 3: Guardarla en la base de datos
            const payload = {
                projectId: proyectoGuardar,
                name: `captura_${Date.now()}`,
                url,
                metadata: {
                    etiquetado: false,
                    orientacion: ''
                }
            };

            const res = await axios.put(`${import.meta.env.VITE_API_URL}/images/create`, payload, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });

            if (res.status === 200 || res.status === 201) {
                message.success('✅ Imagen guardada exitosamente');
            } else {
                message.error('❌ Error al guardar en base de datos');
            }

        } catch (err) {
            console.error(err);
            message.error('❌ Error al guardar la imagen');
        }
    };


    useEffect(() => {
        if (modoCaptura !== 'streaming' && streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
            streamingIntervalRef.current = null;
            message.info("⏹️ Streaming detenido al cambiar de modo");
        }
    }, [modoCaptura]);


    return (
        <div className="test-model-page-container">
            <div className='selector-container'>
                <div className="camera-selector-container">
                    <Title level={4}>Conexión de Cámara</Title>
                    <label>Tipo de cámara:</label>
                    <Select value={type} onChange={(value) => setType(value)} className="camera-select">
                        <Option value="realsense">RealSense</Option>
                        <Option value="ip">Cámara IP</Option>
                    </Select>

                    {type === 'ip' && (
                        <Input
                            placeholder="Introduce la URL de la cámara IP"
                            value={ipUrl}
                            onChange={(e) => setIpUrl(e.target.value)}
                            className="camera-input"
                        />
                    )}

                    <div className="camera-buttons-container">
                        <Button
                            type={status === 'success' ? 'default' : 'primary'}
                            onClick={handleConnect}
                            loading={status === 'loading'}
                            className={`camera-button ${status === 'success' ? 'connected' : ''}`}
                        >
                            {status === 'loading'
                                ? 'Conectando...'
                                : status === 'success'
                                    ? '✅ Conectado'
                                    : 'Conectar'}
                        </Button>

                        {status === 'success' && (
                            <Button
                                danger
                                onClick={handleDisconnect}
                                className="camera-button"
                            >
                                Desconectar
                            </Button>
                        )}
                    </div>
                </div>
                <div className="section model-loader">
                    <Title level={4}>Cargar modelo previamente entrenado</Title>

                    <Select
                        placeholder="Selecciona un proyecto"
                        onChange={setProyectoSeleccionado}
                        value={proyectoSeleccionado}
                        className="model-loader-select"
                    >
                        {proyectos.map((p) => (
                            <Option key={p._id} value={p._id}>{p.name}</Option>
                        ))}
                    </Select>

                    <Select
                        placeholder="Selecciona un modelo"
                        onChange={(value) => setModeloSeleccionado(value)}
                        value={modelosEntrenados.length > 0 ? modeloSeleccionado : null}
                        className="model-loader-select"
                        disabled={bloquearModelo} // ✅ aquí se desactiva si se bloquea
                    >
                        {modelosEntrenados.map((m) => (
                            <Option key={m._id} value={m.url}>
                                {m.name}
                            </Option>
                        ))}
                    </Select>

                    <Button
                        type={statusModel === 'success' ? 'default' : 'primary'}
                        loading={statusModel === 'loading'}
                        onClick={handleModelLoad}
                        className={`model-loader-button ${statusModel === 'success' ? 'connected' : ''}`}
                    >
                        {statusModel === 'loading'
                            ? 'Cargando modelo...'
                            : statusModel === 'success'
                                ? '✅ Modelo cargado'
                                : 'Cargar modelo'}
                    </Button>
                    {bloquearModelo && (
                        <Button
                            type="dashed"
                            danger
                            style={{ marginTop: 10 }}
                            onClick={() => {
                                setBloquearModelo(false);
                                setStatusModel('idle');
                                setMessageModel('');
                                setModeloSeleccionado(undefined);
                            }}
                        >
                            Cambiar modelo
                        </Button>
                    )}


                    {statusModel === 'error' && (
                        <Alert message={messageTextModel} type="error" showIcon style={{ marginTop: 10 }} />
                    )}
                </div>
                <div className="section guardar-imagen">
                    <Title level={4}>Guardar imagen en proyecto</Title>

                    <Select
                        placeholder="Selecciona un proyecto para guardar"
                        onChange={setProyectoGuardar}
                        value={proyectoGuardar}
                        className="model-loader-select"
                    >
                        {proyectos.map((p) => (
                            <Option key={p._id} value={p._id}>{p.name}</Option>
                        ))}
                    </Select>

                    <Button
                        type="primary"
                        disabled={!imageUrl || !proyectoGuardar}
                        onClick={handleGuardarImagen}
                        style={{ marginTop: 10 }}
                    >
                        Guardar imagen
                    </Button>
                </div>
                <div className="modo-captura-switch">
                    <Title level={4}>Modo de captura</Title>
                    <Switch
                        checked={modoCaptura === 'streaming'}
                        onChange={(checked) => setModoCaptura(checked ? 'streaming' : 'foto')}
                        checkedChildren="🎥 Streaming"
                        unCheckedChildren="📸 Foto"
                    />
                    <Button
                        type="primary"
                        onClick={() => {
                            if (modoCaptura === 'streaming') {
                                if (streamingIntervalRef.current) {
                                    clearInterval(streamingIntervalRef.current);
                                    streamingIntervalRef.current = null;
                                    message.info("⏹️ Streaming detenido");
                                } else {
                                    handleIniciarStreaming();
                                }
                            } else {
                                handleCapturaFoto();
                            }
                        }}
                        style={{ marginTop: 12 }}
                    >
                        {modoCaptura === 'foto'
                            ? '📸 Hacer foto'
                            : streamingIntervalRef.current
                                ? '⏹️ Detener streaming'
                                : '🎥 Iniciar streaming'}
                    </Button>

                </div>
            </div>
            <div className="resultado-wrapper-container">
                <div className="resultado-container">
                    {imageUrl ? (
                        <img src={imageUrl} alt="Detección YOLO" />
                    ) : (
                        <span style={{ color: '#999' }}>La imagen aparecerá aquí</span>
                    )}
                </div>

            </div>


        </div>
    );
}






























