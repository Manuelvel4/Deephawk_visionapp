import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const uri = process.env.DB_CONN_STRING;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function connect() {
    try {
        await client.connect();
        const database = client.db('database');
        return database.collection('Yolos');
    } catch (error) {
        console.error('Error connecting to the database');
        console.error(error);
        await client.close();
    }
}

export class YoloModel {
    // 🔹 PUT: Crear nueva Yolon
    static async createYolo({ input }) {
        const db = await connect();

        const Yolo = {
            _id: crypto.randomUUID(), // Genera un UUID único
            projectId: input.projectId,
            userId: input.userId,
            name: input.name,
            url: input.url,
            logs: input.logs || '', // Logs opcionales
            descripcion: input.descripcion,
            model: input.model,
            uploadedAt: new Date(),
            metadata: input.metadata || {} // Metadata opcional
        };

        const { insertedId } = await db.insertOne(Yolo);
        return { result: insertedId ? 'success' : 'failure', id: insertedId };
    }
    // 🔹 GET: Todas las imágenes de un proyecto
    static async getAllByProject({ projectId }) {
        const db = await connect();
        return db.find({ projectId }).toArray();
    }

    // 🔹 GET: Todas las Yolons de un usuario
    static async getByUserId({ userId }) {

        const db = await connect();
        return db.find({ userId }).toArray();
    }

    // 🔹 GET: Obtener Yolon por su ID
    static async getByYoloId({ YoloId }) {
        const db = await connect();
        return db.findOne({ _id: YoloId });
    }

    // 🔹 GET: Obtener todas las Yolons de un proyecto
    static async getByProjectId({ projectId }) {
        const db = await connect();
        return db.find({ projectId }).toArray();
    }

    // 🔹 DELETE: Eliminar una Yolon
    static async deleteYolo({ YoloId }) {
        const db = await connect();
        const result = await db.deleteOne({ _id: YoloId });
        return result.deletedCount > 0;
    }

    // 🔹 PATCH: Actualizar metadatos o nombre
    static async updateYolo({ YoloId, updates }) {
        const db = await connect();
        const result = await db.updateOne(
            { _id: YoloId },
            { $set: { ...updates } }
        );
        return result.modifiedCount > 0;
    }
    static async existsByName({ name }) {
        const db = await connect();
        const found = await db.findOne({ name });
        return !!found;
    }
}