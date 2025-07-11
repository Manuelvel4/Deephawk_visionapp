import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../../../auth/auth-context';
import ImageCards from '../components/ImageCards';
import ImageForm from '../components/ImagenForm';
import axios from 'axios';
import { message } from 'antd';
import { getCookie, removeCookie, setCookie } from 'typescript-cookie';
import type { ImagenFile, LabelImagenFile } from '../types/label-types';
import { CanvasParams } from '../types/label-types';

interface ImageSelectProps {
    onSeleccionarImagen: (img: ImagenFile) => void;
    projectId?: string;
    onSeleccionarLabel: (label: LabelImagenFile | null) => void;
}

export default function ImageSelect({ onSeleccionarImagen, projectId, onSeleccionarLabel }: ImageSelectProps) {
    const { projects, setProjects, user } = useContext(AuthContext);
    const [busqueda, setBusqueda] = useState('');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [imagenes, setImagenes] = useState<ImagenFile[]>([]);
    const [errorForm, setErrorForm] = useState<string | null>(null);
    const [nuevaImagen, setNuevaImagen] = useState<Partial<ImagenFile>>({
        name: '',
        url: '',
        metadata: {
            imgData: '',
        },
    });
    const [imagenSeleccionada, setImagenSeleccionada] = useState<ImagenFile | null>(null);

    const añadirImagen = () => {
        setMostrarFormulario(true);
    };
    const manejarSubida = async (file: File) => {
        try {
            // 🔹 Leer la imagen en un objeto HTMLImageElement
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = reader.result as string;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // 🔹 Crear canvas de 640x640
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 640;
            canvas.height = 640;

            // 🔹 Calcular escala manteniendo aspect ratio (letterbox)
            const scale = Math.min(640 / img.width, 640 / img.height);
            const newWidth = img.width * scale;
            const newHeight = img.height * scale;
            const offsetX = (640 - newWidth) / 2;
            const offsetY = (640 - newHeight) / 2;

            // 🔹 Dibujar la imagen redimensionada
            if (ctx) {
                ctx.fillStyle = 'white'; // fondo blanco
                ctx.fillRect(0, 0, 640, 640);
                ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
            }

            // 🔹 Convertir a blob para enviar
            const resizedBlob = await new Promise<Blob>((resolve) =>
                canvas.toBlob((blob) => blob && resolve(blob), 'image/jpeg', 0.9)
            );

            // 🔹 Subir a backend
            const formData = new FormData();
            formData.append('file', new File([resizedBlob], file.name, { type: 'image/jpeg' }));

            const response = await axios.put(`${import.meta.env.VITE_API_URL}/s3/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });

            const imageUrl = response.data.url;
            setNuevaImagen((prev) => ({
                ...prev,
                url: imageUrl
            }));

            return false; // evita comportamiento por defecto del Upload
        } catch (error) {
            console.error('Error al redimensionar o subir imagen:', error);
            return false;
        }
    };


    const guardarImagen = async () => {
        if (!nuevaImagen.name || !nuevaImagen.url) {
            setErrorForm('Por favor completa todos los campos.');
            return;
        }
    
        try {
            const payload = {
                projectId: projects?.project_id,
                name: nuevaImagen.name,
                url: nuevaImagen.url,
                metadata: nuevaImagen.metadata || { imgData: '' }
            };
    
            let response;
    
            if (nuevaImagen._id) {
                // 🟢 Si hay _id, actualiza (edit)
                response = await axios.patch(
                    `${import.meta.env.VITE_API_URL}/images/${nuevaImagen._id}`,
                    payload,
                    {
                        headers: { 'Content-Type': 'application/json' },
                        withCredentials: true
                    }
                );
            } else {
                // 🟢 Si no hay _id, crea
                response = await axios.put(
                    `${import.meta.env.VITE_API_URL}/images/create`,
                    payload,
                    {
                        headers: { 'Content-Type': 'application/json' },
                        withCredentials: true
                    }
                );
            }
    
            if (response.status === 200 || response.status === 201) {
                obtenerImagenes2();
                setMostrarFormulario(false);
                setErrorForm(null);
                setNuevaImagen({
                    name: '',
                    url: '',
                    metadata: {
                        imgData: '',
                    }
                });
            } else {
                const mensaje = response.data?.message || 'Error inesperado';
                setErrorForm(mensaje);
            }
        } catch (err: any) {
            const mensaje = err.response?.data?.message || 'Error inesperado';
            console.error('Error al guardar imagen:', mensaje);
            setErrorForm(mensaje);
        }
    };
    

    const editarImagen = (img: ImagenFile) => {
        setNuevaImagen(img);            
        setMostrarFormulario(true);    
    };
    

    const eliminarImagen = async (id: string) => {
        console.log('Eliminar imagen con ID:', id);
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/images/${id}`, {
                withCredentials: true
            });
            setImagenes((prev) => prev.filter((img) => img._id !== id));
        } catch (error: any) {
            console.error('Error al eliminar imagen:', error.response?.data || error.message);
        }
    };
    const obtenerImagenes2 = async () => {
        if (!projects?.project_id) return;
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/images/project/${projects.project_id}`,
                { withCredentials: true }
            );
            setImagenes(response.data);
        } catch (error) {
            console.error('Error al obtener las imágenes:', error);
        }
    };
    const seleccionarImagen = (img: ImagenFile) => {
        setImagenSeleccionada(img);
        setCookie('imagen', JSON.stringify(img));
        removeCookie('label');
        onSeleccionarImagen(img);
        onSeleccionarLabel(null);
    };
    useEffect(() => {
        const cookieProject = getCookie('project');
        if (cookieProject) {
            const parsed = JSON.parse(cookieProject);
            setProjects({
                project_id: parsed.project_id,
                project_name: parsed.project_name
            });
        }
    }, []);

    useEffect(() => {
        if (!projects?.project_id) return;

        const obtenerImagenes = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/images/project/${projects.project_id}`,
                    { withCredentials: true }
                );
                setImagenes(response.data);
            } catch (error) {
                console.error('Error al obtener las imágenes:', error);
            }
        };

        obtenerImagenes();
    }, [projects?.project_id]);

    return (
        <>
            <ImageCards
                imagenes={imagenes}
                busqueda={busqueda}
                onBuscar={setBusqueda}
                onAddImage={añadirImagen}
                onEditar={editarImagen}
                onEliminar={eliminarImagen}
                onSelect={seleccionarImagen}
            />

            <ImageForm
                visible={mostrarFormulario}
                imagen={nuevaImagen}
                onChange={setNuevaImagen}
                onImagen={manejarSubida}
                onGuardar={guardarImagen}
                onCancelar={() => {
                    setMostrarFormulario(false);
                    setErrorForm(null);
                    setNuevaImagen({
                        name: '',
                        url: '',
                        metadata: {
                            imgData: '',
                        }
                    });
                }}
                error={errorForm}
            />

        </>
    );
}
