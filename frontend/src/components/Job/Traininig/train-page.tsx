import { useEffect, useState, useContext } from 'react';
import { Select, Button, message, Card, Progress, Table, Input } from 'antd';
import axios from 'axios';
import { getCookie } from 'typescript-cookie';
import { AuthContext } from '../../auth/auth-context';
import './train-page.css';
import { io } from 'socket.io-client';
import { Alert,Modal } from 'antd';
import { Dropdown, Menu } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import { SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';


const { TextArea } = Input;


const { Option } = Select;

interface Proyecto {
    _id: string;
    name: string;
}

interface Imagen {
    _id: string;
    name: string;
    url: string;
    projectId: string;
}

interface ModeloEntrenado {
    _id: string;
    name: string;
    descripcion: string;
    url: string;
    model: string;
    metadata: object;
    createdAt: string;
}

const modelos = [ //TODO: Put this const in a separate file
    { value: 'yolov8n', label: 'YOLOv8n (Nano) - Rápido, bajo peso' },
    { value: 'yolov8s', label: 'YOLOv8s (Small) - Equilibrio velocidad/calidad' },
    { value: 'yolov8m', label: 'YOLOv8m (Medium) - Más precisión, más lento' },
    { value: 'yolov8l', label: 'YOLOv8l (Large) - Alta precisión, GPU recomendada' },
    { value: 'yolov8x', label: 'YOLOv8x (XLarge) - Máxima precisión, más pesado' }
];

export default function TrainPage() {
    // Estados para manejar proyectos, imágenes, selección y entrenamiento
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [imagenes, setImagenes] = useState<Imagen[]>([]);
    const [proyectoSeleccionado, setProyectoSeleccionado] = useState<string | undefined>();
    const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState<string[]>([]);
    const [modeloSeleccionado, setModeloSeleccionado] = useState<string | undefined>();
    const [loadingImagenes, setLoadingImagenes] = useState(false);
    const [estadoEntrenamiento, setEstadoEntrenamiento] = useState<'idle' | 'in_progress' | 'success' | 'error'>('idle');
    const [progreso, setProgreso] = useState<number>(0);
    const [modelosEntrenados, setModelosEntrenados] = useState<ModeloEntrenado[]>([]);
    const [nombreModelo, setNombreModelo] = useState<string>('');
    const [descripcionModelo, setDescripcionModelo] = useState<string>('');
    const { user } = useContext(AuthContext);
    const userId = user?.id || JSON.parse(getCookie('user') || '{}')?.id;
    const [mensajeError, setMensajeError] = useState<string | null>(null);
    const [modeloSeleccionadoModal, setModeloSeleccionadoModal] = useState<ModeloEntrenado | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);    
    const [ordenPorFechaDesc, setOrdenPorFechaDesc] = useState(true);


    useEffect(() => {
        const fetchProyectos = async () => {
            if (!userId) return;
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/project/user/${userId}`, { withCredentials: true });
                setProyectos(res.data);
            } catch (err) {
                console.error('Error al obtener proyectos:', err);
            }
        };
        fetchProyectos();
    }, [userId]);

    const fetchImagenes = async (proyectoId?: string) => {
        setLoadingImagenes(true);
        try {
            const url = proyectoId
                ? `${import.meta.env.VITE_API_URL}/images/project/${proyectoId}`
                : `${import.meta.env.VITE_API_URL}/images`;
            const res = await axios.get(url, { withCredentials: true });
            setImagenes(res.data);
        } catch (err) {
            console.error('Error al obtener imágenes:', err);
        } finally {
            setLoadingImagenes(false);
        }
    };

    const fetchModelosEntrenados = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/yolo/user/${userId}`, { withCredentials: true });
            setModelosEntrenados(res.data);
            console.log('Modelos entrenados:', res.data);
        } catch (err) {
            console.error('Error al obtener modelos entrenados:', err);
        }
    };

    useEffect(() => {
        fetchImagenes(proyectoSeleccionado);
        fetchModelosEntrenados();
    }, [proyectoSeleccionado]);

    const handleProyectoChange = (value: string | undefined) => {
        setProyectoSeleccionado(value);
        setImagenesSeleccionadas([]);
        fetchImagenes(value);
    };

    const handleImagenSeleccion = (values: string[]) => {
        if (values.includes('all')) {
            setImagenesSeleccionadas(imagenes.map((img) => img._id));
        } else {
            setImagenesSeleccionadas(values);
        }
    };

    const lanzarEntrenamiento = async () => {
        if (!proyectoSeleccionado || !modeloSeleccionado) {
            message.warning('Selecciona un proyecto y un modelo para entrenar');
            return;
        }

        setEstadoEntrenamiento('in_progress');
        setMensajeError(null);
        setProgreso(0);

        // 🔌 Conectar a socket.io SOLO en este momento
        const socket = io(import.meta.env.VITE_API_URL, {
            withCredentials: true,
            transports: ['websocket'] // fuerza WebSocket si quieres evitar polling
        });

        socket.on('connect', async () => {
            console.log('✅ Socket conectado con ID:', socket.id);

            socket.on('train:status', (msg) => {
                console.log('[STATUS]', msg);
            });

            socket.on('train:progress', ({ current, total, message: msg }) => {
                const porcentaje = Math.round((current / total) * 100);
                setProgreso(porcentaje);
                console.log(`[PROGRESO ${porcentaje}%]`, msg);
            });

            socket.on('train:log', (log) => {
                console.log('[YOLO LOG]', log);
            });

            try {
                // 🚀 Llamar al backend con el socket.id
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/train`, {
                    userId: userId,
                    name: nombreModelo,
                    descripcion: descripcionModelo,
                    projectId: proyectoSeleccionado,
                    model: modeloSeleccionado,
                    imagenes: imagenesSeleccionadas,
                    socketId: socket.id
                }, { withCredentials: true });

                setProgreso(100);
                setEstadoEntrenamiento('success');
                message.success('Entrenamiento finalizado');
                fetchModelosEntrenados();
                socket.disconnect(); // 🔌 Cerrar conexión tras éxito
            } catch (err) {
                // ¿El backend envió un mensaje personalizado?
                let errorMsg = 'Error desconocido';
                if (err.response && err.response.data && err.response.data.error) {
                    errorMsg = err.response.data.error;
                } else if (err.message) {
                    errorMsg = err.message;
                }
                setMensajeError(errorMsg);
                console.error('Error al iniciar entrenamiento:', errorMsg);
                setEstadoEntrenamiento('error');
                message.error(errorMsg); // Puedes usarlo para mostrar un toast o alerta
                socket.disconnect(); // si quieres cerrar la conexión
            }
        });
    };

    const handleVer = (record: ModeloEntrenado) => {
        setModeloSeleccionadoModal(record);
        setIsModalVisible(true);
    };
    
    const handleEliminar = async (record: ModeloEntrenado) => {

        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/yolo/${record._id}`, { withCredentials: true });
                setModelosEntrenados(prev =>
                prev.filter(modelo => modelo._id !== record._id)
            );
            fetchModelosEntrenados();
            message.success(`Modelo "${record.name}" eliminado correctamente`);
        } catch (err) {
            console.error('Error al eliminar modelo:', err);
            message.error('Error al eliminar modelo');
        }
            
    };
    

    return (
        <div className="train-page-container">
            <div className='section train-execution'>
                <h1> Configuración del entrenamiento</h1>
                <div className='train-execution-selection'>
                    <Select placeholder="Selecciona un proyecto" onChange={handleProyectoChange} value={proyectoSeleccionado} allowClear>
                        {proyectos.map((p) => (
                            <Option key={p._id} value={p._id}>{p.name}</Option>
                        ))}
                    </Select>

                    <Select mode="multiple" placeholder="Selecciona imágenes" loading={loadingImagenes} onChange={handleImagenSeleccion} value={imagenesSeleccionadas} allowClear maxTagCount={0}>
                        <Option key="all" value="all">Todas las imágenes</Option>
                        {imagenes.map((img) => (
                            <Option key={img._id} value={img._id}>{img.name}</Option>
                        ))}
                    </Select>

                    <Select placeholder="Selecciona un modelo" onChange={setModeloSeleccionado} value={modeloSeleccionado}>
                        {modelos.map((m) => (
                            <Option key={m.value} value={m.value}>{m.label}</Option>
                        ))}
                    </Select>

                    <Input placeholder="Nombre del modelo" value={nombreModelo} onChange={(e) => setNombreModelo(e.target.value)} />
                    <TextArea
                        className="descripcion-modelo"
                        placeholder="Descripción del modelo"
                        value={descripcionModelo}
                        onChange={(e) => setDescripcionModelo(e.target.value)}
                    />
                    <Button type="primary" onClick={lanzarEntrenamiento}>Entrenar modelo</Button>
                    {mensajeError && (
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                            <Alert
                                type="error"
                                message={mensajeError}
                                showIcon
                                style={{ maxWidth: 500, width: '100%' }}
                            />
                        </div>
                    )}
                    <Card title="Estado del entrenamiento" style={{ width: '100%' }}>
                        <Progress percent={progreso} status={
                            estadoEntrenamiento === 'error' ? 'exception' :
                                estadoEntrenamiento === 'success' ? 'success' :
                                    estadoEntrenamiento === 'in_progress' ? 'active' : 'normal'
                        } />
                    </Card>
                </div>
                <h1> Imagenes del proyecto</h1>
                <div className="selected-dashboard">
                    {imagenes.filter((img) => imagenesSeleccionadas.includes(img._id))
                        .map((img) => (
                            <img key={img._id} src={img.url} alt={img.name} />
                        ))}
                </div>
            </div>
            <div className='section train-download'>
                <h3>Modelos entrenados</h3>
                <div className='train-download-header'>
                    <Input.Search
                        className="search-modelos"
                        placeholder="Buscar por nombre o descripción"
                        onChange={(e) => {
                            const search = e.target.value.toLowerCase();
                            const filtrados = modelosEntrenados.filter(modelo =>
                                modelo.name.toLowerCase().includes(search) ||
                                modelo.descripcion.toLowerCase().includes(search)
                            );
                            setModelosEntrenados([...filtrados]);
                        }}
                    />
                    <Button
                        className='ordenar-fecha'
                        onClick={() => setOrdenPorFechaDesc(prev => !prev)}
                        type="text"
                        icon={ordenPorFechaDesc ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
                    />
                </div>


                <Table
                    dataSource={[...modelosEntrenados].sort((a, b) =>
                        ordenPorFechaDesc
                            ? new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
                            : new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
                    )}
                    rowKey="_id"
                    columns={[
                        { title: 'Nombre', dataIndex: 'name', key: 'name' },
                        { title: 'Descripción', dataIndex: 'descripcion', key: 'descripcion' },
                        {
                            title: 'Copiar URL',
                            key: 'url',
                            render: (_, record) => (
                                <Button
                                    onClick={() => {
                                        navigator.clipboard.writeText(record.url);
                                        message.success('URL copiada al portapapeles');
                                    }}
                                >
                                    Copiar URL
                                </Button>
                            ),
                        },
                        {
                            title: 'Acciones',
                            key: 'acciones',
                            render: (_, record) => {
                                const handleMenuClick = ({ key }: { key: string }) => {
                                    if (key === 'ver') {
                                        handleVer(record);
                                    }  else if (key === 'eliminar') {
                                        handleEliminar(record);
                                    }
                                };
                    
                                const menu = (
                                    <Menu
                                        onClick={handleMenuClick}
                                        items={[
                                            { key: 'ver', label: 'Ver' },
                                            { key: 'eliminar', label: 'Eliminar' },
                                        ]}
                                    />
                                );
                    
                                return (
                                    <Dropdown overlay={menu} trigger={['click']}>
                                        <Button type="text" icon={<EllipsisOutlined />} />
                                    </Dropdown>
                                );
                            },
                        },
                    ]}
                />
            </div>
            <Modal
            title={`Detalles del modelo: ${modeloSeleccionadoModal?.name}`}
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={null}
        >
            {modeloSeleccionadoModal && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <strong>Logs:</strong>{' '}
                        <a href={modeloSeleccionadoModal.logs} target="_blank" rel="noopener noreferrer">
                            Ver logs
                        </a>
                    </div>
                    <div>
                        <strong>Modelo:</strong> {modeloSeleccionadoModal.model}
                    </div>
                    <div>
                        <strong>Nombre:</strong> {modeloSeleccionadoModal.name}
                    </div>
                    <div>
                        <strong>Metadata:</strong>
                        <pre style={{
                            background: '#f9f9f9',
                            padding: '8px',
                            borderRadius: '6px',
                            maxHeight: '200px',
                            overflow: 'auto'
                        }}>
                            {JSON.stringify(modeloSeleccionadoModal.metadata, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </Modal>
        </div>
    );
}
