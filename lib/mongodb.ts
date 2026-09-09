import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "classroom-tools";

type MongoGlobal = typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

const mongoGlobal = globalThis as MongoGlobal;

function getMongoClientPromise() {
  if (!uri) {
    throw new Error("Missing MONGODB_URI");
  }

  const mongoClientPromise =
    mongoGlobal.mongoClientPromise ?? new MongoClient(uri).connect();

  if (process.env.NODE_ENV !== "production") {
    mongoGlobal.mongoClientPromise = mongoClientPromise;
  }

  return mongoClientPromise;
}

export async function getClassroomDb() {
  const client = await getMongoClientPromise();
  return client.db(dbName);
}
