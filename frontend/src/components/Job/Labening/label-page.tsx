import React, { useContext, useState, useRef } from 'react';
import './label-page.css';
import { AuthContext } from '../../auth/auth-context';
import ImageSelect from '../Labening/images-select/image-select';
import ImageLabelJob from '../Labening/images-label-job/image-label-job';
import { removeCookie } from 'typescript-cookie';
import { Button } from 'antd';
import type { ImagenFile, LabelImagenFile } from './types/label-types';
import ImagenLabelHist from '../Labening/images-label-hist/images-label-hist';
import axios from 'axios';
import { message } from 'antd';

export default function LabelPage() {

    const { projects } = useContext(AuthContext);
    const [imagenSeleccionada, setImagenSeleccionada] = useState<ImagenFile | null>(null);
    const [labelSeleccionada, setLabelSeleccionada] = useState<LabelImagenFile | null>(null);
    const [eliminarLabel, setEliminarLabel] = useState<boolean>(false);


    const handleback = () => {
        window.history.back();
        removeCookie('imagen');
    }
    const handleEliminarLabel = async (labelId: string) => {
        setEliminarLabel(true);

    };
    return (
        <>
            <div className='project-header'>
                <Button className='project-button'type="primary" onClick={handleback}>
                    volver
                </Button>
                <div className='project-name'>Nombre del proyecto: {projects?.project_name}</div>
            </div>

            <div className="project-container">
                <div className="images-select_1">
                    <ImageSelect projectId={projects?.project_id} onSeleccionarImagen={setImagenSeleccionada} onSeleccionarLabel={setLabelSeleccionada} />
                </div>

                <div className="images-labeling_1">
                    <ImageLabelJob
                        imagen={imagenSeleccionada}
                        label={labelSeleccionada}
                        deleteLabel={eliminarLabel}
                        setDeleteLabel={setEliminarLabel}
                    />
                </div>

                <div className="images-label-history_1">
                    <ImagenLabelHist
                        imagenFile={imagenSeleccionada}
                        onSeleccionarLabel={setLabelSeleccionada}
                        onEliminarLabel={handleEliminarLabel}
                    />
                </div>
            </div>
        </>
    );
}
