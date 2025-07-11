import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import crypto from 'crypto';
import mime from 'mime-types';
import fs from 'fs';
import path from 'path';

dotenv.config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
});

export class S3Model {
    // 🔹 PUT: Subir archivo a S3
    static async uploadFileToS3(fileBuffer, originalName, mimetype) {
        const key = `${crypto.randomUUID()}.${mime.extension(mimetype)}`;
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: mimetype,
        });

        await s3.send(command);

        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    // 🔹 DELETE: Eliminar archivo de S3 por key
    static async deleteFileFromS3(key) {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
        });

        await s3.send(command);
    }
    static async fileExists(key) {
        const command = new HeadObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
        });

        try {
            await s3.send(command);
            return true; // El archivo existe
        } catch (error) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                return false;
            }
            // Otros errores (ej. permisos)
            throw error;
        }
    }


    static async uploadFileFromPath(localPath, s3Key = null) {
        const buffer = fs.readFileSync(localPath);
        const ext = path.extname(localPath).toLowerCase();
        let mimeType = mime.lookup(localPath) || 'application/octet-stream';

        if (ext === '.pt') mimeType = 'application/x-pytorch';

        let fileName;
        if (typeof s3Key === 'string' && s3Key.trim() !== '') {
            fileName = s3Key;
        } else {
            const uuid = crypto.randomUUID();
            fileName = ext ? `${uuid}${ext}` : `${uuid}.${mime.extension(mimeType) || 'bin'}`;
        }

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: mimeType,
        });

        // Subida directa a S3
        await s3.send(command);

        const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

        // Borrar archivo local tras subir
        try {
            fs.unlinkSync(localPath);
        } catch (err) {
            console.warn(`⚠️ No se pudo eliminar el archivo local ${localPath}:`, err.message);
        }

        return url;
    }


    static async uploadLogBufferToS3(logContent, s3Key, mimetype = 'text/plain') {
        const buffer = Buffer.isBuffer(logContent) ? logContent : Buffer.from(logContent, 'utf-8');

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
            ContentType: mimetype,
            ContentLength: buffer.length
        });

        await s3.send(command);

        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    }

    static async uploadFileStreamToS3(readStream, s3Key, mimetype = 'application/octet-stream', contentLength = null) {
        if (typeof contentLength !== 'number') {
            throw new Error('ContentLength es obligatorio para subir streams a S3');
        }

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: readStream,
            ContentType: mimetype,
            ContentLength: contentLength
        });

        await s3.send(command);

        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    }

}