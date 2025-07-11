import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input,message } from 'antd';
import ProjectCards from '../components/ProjectCards';
import ProjectForm from '../components/ProjectForm';
import axios from 'axios';
import { AuthContext } from '../../../auth/auth-context';
import { removeCookie, setCookie } from 'typescript-cookie';

import './form-project.css';

interface Proyecto {
    _id: string;
    userId: string;
    name: string;
    img: string;
    description: string;
    createdAt: string;
    lastModified: string;
    modelo: string;
    modelodescrip: string;
}

export default function ProjectOPage() {
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const { user, loading, setProjects } = useContext(AuthContext);
    const navigate = useNavigate();
    const [nuevoProyecto, setNuevoProyecto] = useState<Partial<Proyecto>>({
        name: '',
        description: '',
        modelo: '',
        modelodescrip: '',
        img: ''
    });
    const [busqueda, setBusqueda] = useState('');


    useEffect(() => {
        const obtenerProyectosDelUsuario = async () => {
            if (!user?.id) return;
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/project/user/${user.id}`,
                    { withCredentials: true }
                );
                removeCookie('project');
                setProyectos(response.data);
            } catch (error) {
                console.error('Error al obtener los proyectos del usuario:', error);
            }
        };

        if (!loading && user?.id) {
            obtenerProyectosDelUsuario();
        }
    }, [user?.id, loading]);
    const manejarImagen = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/s3/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });

            const imageUrl = response.data.url;

            console.log('URL de la imagen:', imageUrl);
            console.log('nuevoproyecto', nuevoProyecto);
            setNuevoProyecto((prev) => ({
                ...prev,
                img: imageUrl
            }));

            return false; // evita el comportamiento automático de Ant Upload
        } catch (error) {
            console.error('Error al subir imagen a S3:', error);
            return false;
        }
    };
    const handleGuardarProyecto = () => {
        if (nuevoProyecto._id) {
            modificarProyecto();
        } else {
            guardarProyecto();
        }
    };

    const guardarProyecto = async () => {
        try {
            const payload = {
                userId: user?.id, // desde contexto
                name: nuevoProyecto.name,
                description: nuevoProyecto.description,
                modelo: nuevoProyecto.modelo,
                modelodescrip: nuevoProyecto.modelodescrip,
                img: nuevoProyecto.img // URL obtenida de S3
            };

            console.log('Payload a enviar:', payload);

            const response = await axios.put(`${import.meta.env.VITE_API_URL}/project/create`, payload, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });

            if (response.status === 200 || response.status === 201) {
                const { id } = response.data;

                console.log('Proyecto creado con ID:', id);
                obtenerProyectoPorId(id);
            }
        } catch (err) {
            console.error('Error al crear proyecto:', err);
        }
    };
    
    const modificarProyecto = async () => {
        try {
            if (!nuevoProyecto._id) {
                message.error('No se ha seleccionado ningún proyecto para modificar.');
                return;
            }
    
            const payload = {
                name: nuevoProyecto.name,
                description: nuevoProyecto.description,
                modelo: nuevoProyecto.modelo,
                modelodescrip: nuevoProyecto.modelodescrip,
                img: nuevoProyecto.img
            };
    
            console.log('Payload a modificar:', payload);
    
            const response = await axios.patch(
                `${import.meta.env.VITE_API_URL}/project/${nuevoProyecto._id}`,
                payload,
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );
    
            if (response.status === 200 || response.status === 204) {
                setProyectos((prev) =>
                    prev.map((p) =>
                      p._id === nuevoProyecto._id
                        ? {
                            ...p,
                            name: nuevoProyecto.name || '',
                            description: nuevoProyecto.description || '',
                            modelo: nuevoProyecto.modelo || '',
                            modelodescrip: nuevoProyecto.modelodescrip || '',
                            img: nuevoProyecto.img || '',
                          }
                        : p
                    )
                  );
                  
                setMostrarFormulario(false);
                message.success('Proyecto modificado correctamente');
            }
        } catch (err) {
            console.error('Error al modificar proyecto:', err);
            message.error('Error al modificar el proyecto');
        }
    };
    

    const obtenerProyectoPorId = async (id: string) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/project/${id}`, {
                withCredentials: true
            });

            const proyecto = response.data;

            setProyectos((prev) => [...prev, proyecto]); // agregamos a la lista
            setNuevoProyecto({});
            setMostrarFormulario(false);
            console.log('Proyecto completo:', proyecto);
        } catch (error) {
            console.error('Error al obtener proyecto por ID:', error);
        }
    };

    const proyectosFiltrados = proyectos.filter((p) =>
        p.name?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const eliminarProyecto = async (id: string) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/project/${id}`, {
                withCredentials: true
            });
            setProyectos((prev) => prev.filter((p) => p._id !== id));
        } catch (error) {
            console.error('Error al eliminar el proyecto:', error);
        }
    };

    const seleccionarProyecto = (proyecto: Partial<Proyecto>) => {
        setCookie('project', JSON.stringify({
            project_id: proyecto._id || '',
            project_name: proyecto.name || ''
        }));
        navigate('/home/label');    
    };

    return (
        <>
            <div className="header-bar">
                <Input.Search
                    placeholder="Buscar proyecto por nombre"
                    allowClear
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ maxWidth: 400 }}
                />
            </div>
            <ProjectCards
                proyectos={proyectosFiltrados}
                onAddProject={() => {
                    setNuevoProyecto({
                        name: '',
                        description: '',
                        modelo: '',
                        modelodescrip: '',
                        img: ''
                    });
                    setMostrarFormulario(true);
                }}
                onEditar={(proyecto) => {
                    setNuevoProyecto(proyecto);
                    setMostrarFormulario(true);
                }}
                onEliminar={eliminarProyecto}
                onSelect={seleccionarProyecto}

            />

            <ProjectForm
                visible={mostrarFormulario}
                proyecto={nuevoProyecto}
                onChange={setNuevoProyecto}
                onImagen={manejarImagen}
                onGuardar={handleGuardarProyecto}
                onCancelar={() => setMostrarFormulario(false)}
            />
        </>
    );
}
