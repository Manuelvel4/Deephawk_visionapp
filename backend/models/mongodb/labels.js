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
        return database.collection('labels');
    } catch (error) {
        console.error('Error connecting to the database');
        console.error(error);
        await client.close();
    }
}

export class LabelModel {
    // 🔹 Obtener todas las etiquetas de una imagen
    static async getAllByImage({ imageId }) {
        const db = await connect();
        return db.find({ imageId }).toArray();
    }

    // 🔹 Verificar si ya existe una etiqueta con ese name en la imagen
    static async existsLabelName({ imageId, name }) {
        const db = await connect();
        const result = await db.findOne({ imageId, name });
        return Boolean(result);
    }

    // 🔹 Crear nueva etiqueta
    static async createLabel({ input }) {
        const db = await connect();
        const label = {
            _id: crypto.randomUUID(),
            imageId: input.imageId,
            name: input.name,
            coordinates: input.coordinates, // formato: [x_center, y_center, width, height]
            createdAt: new Date(),
        };

        const { insertedId } = await db.insertOne(label);
        return { result: insertedId ? 'success' : 'failure', id: insertedId };
    }

    // 🔹 Obtener etiqueta por ID
    static async getById({ labelId }) {
        const db = await connect();
        return db.findOne({ _id: labelId });
    }

    // 🔹 Actualizar etiqueta (coordenadas o nombre)
    static async updateLabel({ labelId, updates }) {
        const db = await connect();
        const result = await db.updateOne(
            { _id: labelId },
            { $set: updates }
        );
        return result.modifiedCount > 0;
    }

    // 🔹 Eliminar etiqueta
    static async deleteLabel({ labelId }) {
        const db = await connect();
        const result = await db.deleteOne({ _id: labelId });
        return result.deletedCount > 0;
    }
}
