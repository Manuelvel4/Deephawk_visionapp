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
        return database.collection('images');
    } catch (error) {
        console.error('Error connecting to the database');
        console.error(error);
        await client.close();
    }
}

export class ImageModel {
    // 🔹 GET: Todas las imágenes de un proyecto
    static async getAllByProject({ projectId }) {
        const db = await connect();
        return db.find({ projectId }).toArray();
    }

    // 🔹 PUT: Crear nueva imagen
    static async createImage({ input }) {
        const db = await connect();

        const image = {
            _id: crypto.randomUUID(),
            projectId: input.projectId,
            name: input.name,
            url: input.url,
            uploadedAt: new Date(),
            metadata: input.metadata || {}
        };

        const { insertedId } = await db.insertOne(image);
        return { result: insertedId ? 'success' : 'failure', id: insertedId };
    }

    // 🔹 GET: Obtener imagen por su ID
    static async getByImageId({ imageId }) {
        const db = await connect();
        return db.findOne({ _id: imageId });
    }

    // 🔹 DELETE: Eliminar una imagen
    static async deleteImage({ imageId }) {
        const db = await connect();
        const result = await db.deleteOne({ _id: imageId });
        return result.deletedCount > 0;
    }

    // 🔹 PATCH: Actualizar metadatos o nombre
    static async updateImage({ imageId, updates }) {
        const db = await connect();
        const result = await db.updateOne(
            { _id: imageId },
            { $set: { ...updates } }
        );
        return result.modifiedCount > 0;
    }
}
