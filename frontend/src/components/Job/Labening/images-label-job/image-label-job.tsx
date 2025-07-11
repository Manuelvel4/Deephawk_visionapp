import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { FabricImage, Canvas } from 'fabric';
import { getCookie } from 'typescript-cookie';
import './images-label-job.css';
import type { ImagenFile, LabelImagenFile } from '../types/label-types';
import { CanvasParams } from '../types/label-types';

import axios from 'axios';
import { Button } from 'antd';

interface ImageLabelJobProps {
    imagen: ImagenFile | null;
    label: LabelImagenFile | null;
    deleteLabel: boolean;
    setDeleteLabel: (deleteLabel: boolean) => void;
}

export default function ImageLabelJob({ imagen, label, deleteLabel, setDeleteLabel }: ImageLabelJobProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rectRef = useRef<fabric.Rect | null>(null);
    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
    const [imgScale, setImgScale] = useState<number>(1);
    const [imagenData, setImagenData] = useState<ImagenFile | null>(null);

    useEffect(() => { // Inicializa el canvas de Fabric.js
        if (!canvasRef.current) return;
        const fabricCanvas = new Canvas(canvasRef.current, { backgroundColor: CanvasParams.backgroundColor });
        fabricCanvas.setDimensions({ width: CanvasParams.width, height: CanvasParams.height });
        setCanvas(fabricCanvas);
        return () => {
            fabricCanvas.dispose();
        };
    }, []);

    useEffect(() => { // get current imagen from cookie in clase refresh page
        if (!imagen) {
            const cookie = getCookie('imagen');
            if (cookie) {
                const parsedCookie = JSON.parse(cookie);
                setImagenData(parsedCookie);
            }
        } else {
            setImagenData(imagen);
        }
    }, [imagen]);

    useEffect(() => {
        if (!imagenData || !canvas) return;
        const htmlImg = new Image();
        htmlImg.crossOrigin = 'anonymous';
        htmlImg.src = imagenData.url;
        htmlImg.onload = () => {
            if (canvas) {
                const scale = Math.min(canvas.getWidth() / htmlImg.width, canvas.getHeight() / htmlImg.height);
                setImgScale(scale);
                const fabricImage = new FabricImage(htmlImg, {
                    originX: 'center',
                    originY: 'center',
                    left: canvas.getWidth() / 2,
                    top: canvas.getHeight() / 2,
                    selectable: false,
                    scaleX: scale,
                    scaleY: scale,
                });
                canvas.getObjects('rect').forEach(obj => canvas.remove(obj));
                canvas.backgroundImage = fabricImage;
                canvas.setDimensions({ width: CanvasParams.width, height: CanvasParams.height });
                canvas.renderAll();
            }
        };

    }, [imagenData, canvas, imgScale]);

    useEffect(() => {
        if (!label || !canvas || !imagenData) return;

        const getCoordenadasLabel = async (labelId: string) => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/label/${labelId}`,
                    { withCredentials: true }
                );
                return response.data.coordinates;
            } catch (error) {
                console.error('Error al obtener coordenadas:', error);
                return null;
            }
        };

        const getLabelFromImagenData = async (imagenId: string) => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/label/image/${imagenId}`,
                    { withCredentials: true }
                );
                return response.data;
            } catch (error) {
                console.error('Error al obtener etiquetas:', error);
                return null;
            }
        };

        const fetchAndDrawRect = async () => {

            if (!canvas || !label) return;
            const labelfromimg = await getLabelFromImagenData(imagenData._id);
            if (!labelfromimg || labelfromimg.length === 0) {
                console.error('No se encontraron etiquetas para la imagen');
                return;
            }
            const coordenadas = await getCoordenadasLabel(label._id);
            const [x_center, y_center, width, height] = coordenadas || [0, 0, 0, 0];
            console.log('current label', label._id);
            const imgWidth = canvas.backgroundImage?.getScaledWidth() || 0;
            const imgHeight = canvas.backgroundImage?.getScaledHeight() || 0;

            const rectWidth = width * imgWidth;
            const rectHeight = height * imgHeight;
            const left = (x_center * imgWidth) - (rectWidth / 2);
            const top = (y_center * imgHeight) - (rectHeight / 2);

            const rect = new fabric.Rect({
                left: canvas.getWidth() / 2 - imgWidth / 2 + left,
                top: canvas.getHeight() / 2 - imgHeight / 2 + top,
                width: rectWidth,
                height: rectHeight,
                fill: 'transparent',
                stroke: 'red',
                strokeWidth: 2,
                selectable: true,
            });

            rectRef.current = rect;
            canvas.remove(...canvas.getObjects('rect'));
            canvas.add(rect);
            canvas.renderAll();
        };
        if (deleteLabel) {
            canvas.remove(...canvas.getObjects('rect'));
            canvas.renderAll();
            setDeleteLabel(false);
            console.log('Label deleted');
        } else {
            console.log('Label not deleted');
            fetchAndDrawRect();
        }

    }, [imagenData, canvas, label, deleteLabel, setDeleteLabel]);

    const guardarCoordenadasLabel = async (labelId: string, coordinates: [number, number, number, number]) => {
        console.log('Guardando coordenadas:', labelId, coordinates);
        try {
            await axios.patch(
                `${import.meta.env.VITE_API_URL}/label/${labelId}`,
                {
                    coordinates: coordinates,
                },
                { withCredentials: true }
            );
            console.log('Coordenadas actualizadas en la base de datos');
        } catch (error) {
            console.error('Error al guardar coordenadas:', error);
        }
    };

    const handleGuardar = async () => {
        if (!rectRef.current || !canvas || !imagenData || !label) return;

        const rect = rectRef.current;
        const imgWidth = canvas.backgroundImage?.getScaledWidth() || 1;
        const imgHeight = canvas.backgroundImage?.getScaledHeight() || 1;

        const offsetX = canvas.getWidth() / 2 - imgWidth / 2;
        const offsetY = canvas.getHeight() / 2 - imgHeight / 2;

        const realWidth = rect.width! * rect.scaleX!;
        const realHeight = rect.height! * rect.scaleY!;

        const centerX = (rect.left! - offsetX) + realWidth / 2;
        const centerY = (rect.top! - offsetY) + realHeight / 2;

        const newX = centerX / imgWidth;
        const newY = centerY / imgHeight;
        const newW = realWidth / imgWidth;
        const newH = realHeight / imgHeight;

        const nuevasCoordenadas: [number, number, number, number] = [newX, newY, newW, newH];

        await guardarCoordenadasLabel(label._id, nuevasCoordenadas);
    };

    return (
        <div className="image-label-job">
            <Button type="primary" onClick={handleGuardar} style={{ marginTop: '10px' }}>
                Submit Label
            </Button>
            <canvas ref={canvasRef} className="fabric-canvas" />
        </div>
    );
}
