import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../../../auth/auth-context';
import ImageCards from '../components/ImageCards';
import ImageForm from '../components/ImagenForm';
import axios from 'axios';
import { message } from 'antd';
import { getCookie, setCookie } from 'typescript-cookie';
import type { ImagenFile, LabelImagenFile } from '../types/label-types';
import LabelCards from '../components/LabelCards';
import LabelForm from '../components/LabelForm';
import './images-label-hist.css';

interface ImagenLabelHistProps {
    imagenFile: ImagenFile | null;
    onSeleccionarLabel: (img: LabelImagenFile) => void;
    onEliminarLabel: (labelId: string) => void;
}

export default function ImagenLabelHist({ imagenFile, onSeleccionarLabel, onEliminarLabel }: ImagenLabelHistProps) {
    const [imagen, setImagen] = useState<ImagenFile | null>(null);
    const [labels, setLabels] = useState<LabelImagenFile[]>([]);
    const [busquedaLabel, setBusquedaLabel] = useState<string>('');
    const [labelFormVisible, setLabelFormVisible] = useState(false);
    const [nuevaLabel, setNuevaLabel] = useState<Partial<LabelImagenFile>>({});
    const [error, setErrorForm] = useState<string | null>(null);
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        if (imagenFile) {
            console.log('Imagen seleccionada:', imagenFile);
            setImagen(imagenFile);
        } else {
            console.log('No hay imagen seleccionada');
            const cookieImagen = getCookie('imagen');
            if (cookieImagen) {
                const parsed = JSON.parse(cookieImagen);
                setImagen({
                    _id: parsed._id,
                    name: parsed.name,
                    url: parsed.url,
                    metadata: parsed.metadata
                });
            }
        }
    }, [imagenFile]);


    useEffect(() => {
        if (!imagen) return;
        const obtenerLabels = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/label/image/${imagen._id}`,
                    { withCredentials: true }
                );
                setLabels(response.data);
            } catch (error) {
                console.error('Error al obtener las etiquetas:', error);
            }
        };

        obtenerLabels();
        setRefresh(false);
    }, [imagen, refresh]);


    function handleAddLabel(): void {
        setLabelFormVisible(true);
    }

    function handleEditLabel(label: LabelImagenFile): void {
        setNuevaLabel(label);           // Rellena el formulario con la label seleccionada
        setLabelFormVisible(true);      // Muestra el formulario
    }
    

    function handleEliminarLabel(labelId: string): void {
        const deleteLabel = async () => {
            try {
                const response = await axios.delete(
                    `${import.meta.env.VITE_API_URL}/label/${labelId}`,
                    { withCredentials: true }
                );
                if (response.status === 200) {
                    message.success('Etiqueta eliminada');
                } else {
                    message.error('Error al eliminar la etiqueta');
                }
            } catch (error) {
                console.error('Error al eliminar la etiqueta:', error);
                message.error('Error al eliminar la etiqueta');
            }
            onEliminarLabel(labelId); //Eliminate from canvas
            setRefresh(true); // Refresh labels

        }
        deleteLabel();
    }
    const obtenerLabels2 = async () => {
        if (!imagen) return;
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/label/image/${imagen._id}`,
                { withCredentials: true }
            );
            setLabels(response.data);
        } catch (error) {
            console.error('Error al obtener las etiquetas:', error);
        }
    }
    const onGuardarLabel = async () => {
        if (!nuevaLabel.name) {
            setErrorForm('Por favor completa todos los campos.');
            return;
        }
        if (!imagen) {
            setErrorForm('No hay imagen seleccionada.');
            return;
        }
        try {
            const payload = {
                imageId: imagen._id,
                name: nuevaLabel.name,
                coordinates: nuevaLabel.coordinates || [0.46, 0.33, 0.13, 0.11]
            };
    
            let response;
            if (nuevaLabel._id) {
                // Editar label existente
                response = await axios.patch(
                    `${import.meta.env.VITE_API_URL}/label/${nuevaLabel._id}`,
                    payload,
                    {
                        headers: { 'Content-Type': 'application/json' },
                        withCredentials: true
                    }
                );
            } else {
                // Crear nueva label
                response = await axios.put(
                    `${import.meta.env.VITE_API_URL}/label/create`,
                    payload,
                    {
                        headers: { 'Content-Type': 'application/json' },
                        withCredentials: true
                    }
                );
            }
    
            if (response.status === 200 || response.status === 201) {
                obtenerLabels2();
                setLabelFormVisible(false);
                setErrorForm(null);
                setNuevaLabel({
                    imagenId: '',
                    name: '',
                    coordinates: [0.46, 0.33, 0.13, 0.11]
                });
            } else {
                const mensaje = response.data?.message || 'Error inesperado';
                setErrorForm(mensaje);
            }
        } catch (err: any) {
            const mensaje = err.response?.data?.message || 'Error inesperado';
            console.error('Error al guardar label:', mensaje);
            setErrorForm(mensaje);
        }
    };
    

    function onCancelarLabel(): void {
        setLabelFormVisible(false);
    }
    return (
        <div className="images-label-history">
            <LabelCards
                Labeles={labels}
                busquedaLabel={busquedaLabel}
                onBuscarLabel={setBusquedaLabel}
                onAddLabel={handleAddLabel}
                onEditarLabel={handleEditLabel}
                onEliminarLabel={handleEliminarLabel}
                onSelectLabel={onSeleccionarLabel}
            />
            <LabelForm
                labelFormVisible={labelFormVisible}
                label={nuevaLabel}
                onChangeLabel={setNuevaLabel}
                onGuardarLabel={onGuardarLabel}
                onCancelarLabel={onCancelarLabel}
                error={error}
            />
        </div>
    );

}