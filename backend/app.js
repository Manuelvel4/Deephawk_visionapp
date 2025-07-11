import express, { json } from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import { createUserRouter } from './routes/users/users.js';
import { createAuthRouter } from './routes/auth/auth.js';
import { createProjectRouter } from './routes/projects/projects.js';
import { corsMiddleware } from './middlewares/cors.js';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createImageRouter } from './routes/images/images.js';
import { createLabelRouter } from './routes/label/label.js';
import { createS3Router } from './routes/s3/s3.js';
import { createTrainRouter } from './routes/train/train.js';
import { createYoloRouter } from './routes/yolo/yolo.js';
import morgan from 'morgan';

dotenv.config()

export const createApp = ({ userModel, projectModel, imageModel, labelModel, S3Model, YoloModel }) => {
  const app = express()

  const server = http.createServer(app);
  const io = new SocketIO(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true
    }
  });

  app.set('io', io); // ✅ compartir instancia a rutas/controladores

  // 🌐 Middlewares
  app.use(morgan('dev')) // Middleware para logs de peticiones HTTP
  app.use(json())
  app.use(corsMiddleware())
  app.disable('x-powered-by')
  app.use(express.json()) // :) Middleware para parsear el cuerpo de la peticion a JSON
  app.use(cookieParser())
  app.set('view engine', 'ejs')

  // 🧩 Rutas 
  app.use('/users', createUserRouter({ userModel }))
  app.use('/project', createProjectRouter({ projectModel }))
  app.use('/auth', createAuthRouter())
  app.use('/images', createImageRouter({ imageModel }))
  app.use('/label', createLabelRouter({ labelModel }))
  app.use('/s3', createS3Router({ S3Model }));
  app.use('/train', createTrainRouter({ imageModel, labelModel, S3Model, YoloModel }))
  app.use('/yolo', createYoloRouter({ YoloModel }));

  const PORT = process.env.DEV_PORT ?? 1234;
  server.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
  })
}