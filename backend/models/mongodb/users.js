import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt'
import crypto from 'crypto'

dotenv.config();

const uri = process.env.DB_CONN_STRING;
const SALT = parseInt(process.env.SALT_ROUNDS, 10);

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
    return database.collection('users');
  } catch (error) {
    console.error('Error connecting to the database');
    console.error(error);
    await client.close();
  }
}

export class UserModel {
  static async createUser({ input }) {
    const db = await connect();
    const id = crypto.randomUUID()
    const hashedPassword = await bcrypt.hash(input.password, SALT)
    const { insertedId } = await db.insertOne({
      _id: id,
      user: input.user,
      password: hashedPassword,
      mail: input.mail,
    });
    if (!insertedId) {
      return { result: "failure" };
    }
    return { result: "success" };
  }

  static async getUserById({ id }) {
    const db = await connect();
    return db.findOne({ _id: id });
  }

  static async getUserByUsername({ username }) {
    const db = await connect();
    return db.findOne({ user: username });
  }

  static async getUserByMail({ mail }) {
    const db = await connect();
    return db.findOne({ mail: mail });
  }

  static async updateUser({ id, input }) {
    const db = await connect();
    console.log('Updating user with ID:', id);
    try {
      const result = await db.findOneAndUpdate(
        { _id: id },
        { $set: input },
        { returnDocument: 'after' }
      );
      console.log('Update result:', result);
      if (!result) {
        return { result: "failure" };
      }

      return { result: "success", updatedUser: result };
    }
    catch (err) {
      console.error('Error in updateUser:', err);
      return { result: "failure" };
    }
  }
  static async deleteUser({ id }) {
    const db = await connect();
    const { deletedCount } = await db.deleteOne({ _id: id });
    console.log(deletedCount);
    return deletedCount > 0;
  }

  static async updatePassword({ id, newPassword }) {
    const db = await connect();
    const objectId = new ObjectId(id);
    const hashedPassword = await bcrypt.hash(newPassword, SALT)
    const { modifiedCount } = await db.updateOne(
      { _id: objectId },
      { $set: { password: hashedPassword } }
    );

    return modifiedCount > 0;
  }
  static async login({ user, password }) {
    const db = await connect();
    const userObject = await db.findOne({ user: user });
    if (!userObject) {
      throw new Error('User not found');
    }
    const isValid = await bcrypt.compare(password, userObject.password);
    if (!isValid) {
      throw new Error('Invalid password');
    }
    const publicUser = {
      id: userObject._id,
      user: userObject.user,
      mail: userObject.mail
    };
    return publicUser;
  }
}