export interface ImagenFile {
    _id: string;
    name: string;
    url: string;
    metadata: {
        imgData: string;
    };
}
export interface LabelImagenFile {
    _id: string;
    imagenId: string;
    name: string;
    coordinates: [number, number, number, number];
}

export const CanvasParams = {
    width: 750,
    height: 750,
    backgroundColor: '#FFFFFF',
    imageScale: 1,
    imgwidth: 640,
    imgheight: 640,
}

