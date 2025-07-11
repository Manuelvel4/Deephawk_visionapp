import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
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
        return database.collection('projects');
    } catch (error) {
        console.error('Error connecting to the database');
        console.error(error);
        await client.close();
    }
}

export class ProjectModel {
    // 🔹 GET all projects of userID
    static async getAll({ userId = null } = {}) {
        const db = await connect();
        return db.find({ userId }).toArray();
    }

    // 🔹 PUT: Create a new project
    static async createProject({ input }) {
        const db = await connect();

        const project = {
            _id: crypto.randomUUID(),
            userId: input.userId,
            name: input.name,
            img: input.img || '',
            description: input.description || '',
            createdAt: new Date(),
            lastModified: new Date(),
            modelo: input.modelo || '',
            modelodescrip: input.modelodescrip || '',
        };
        const { insertedId } = await db.insertOne(project);
        return { result: insertedId ? 'success' : 'failure', id: insertedId };
    }

    // 🔹 DELETE: Delete a project by id
    static async deleteProject({ projectId }) {
        const db = await connect();
        return db.deleteOne({ _id: projectId });
    }


    // 🔹 PATCH: Update fields in a project
    static async updateProject({ projectId, updates }) {
        const db = await connect();
        const result = await db.updateOne(
            { _id: projectId },
            { $set: { ...updates, lastModified: new Date() } }
        );
        return result.modifiedCount > 0;
    }


    // 🔹 GET project by ID
    static async getById({ projectId }) {
        console.log('projectId', projectId);
        const db = await connect();
        return db.findOne({ _id: projectId });
    }
}
