import { Router } from 'express'
import { TrainController } from '../../controllers/train/train.js'

export const createTrainRouter = ({ imageModel, labelModel, S3Model, YoloModel }) => {
    const trainRouter = Router()
    const trainController = new TrainController({ imageModel, labelModel, S3Model, YoloModel })
    trainRouter.post('/', (req, res) => {
        const io = req.app.get('io');
        const socketId = req.body.socketId;
        const socket = io.sockets.sockets.get(socketId); // 🔍 obtener el socket puntual
        if (!socket) {
            return res.status(400).json({ error: '❌ Socket no encontrado o desconectado' });
        }

        trainController.TrainYoloLocal(socket, req, res);
    });

    return trainRouter
}
