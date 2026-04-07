import mongoose from 'mongoose';

import { getServerConfig } from './config';

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache__: MongooseCache | undefined;
}

const mongooseCache: MongooseCache = global.__mongooseCache__ || {
  connection: null,
  promise: null,
};

if (!global.__mongooseCache__) {
  global.__mongooseCache__ = mongooseCache;
}

export async function connectToDatabase() {
  if (mongooseCache.connection) {
    return mongooseCache.connection;
  }

  if (!mongooseCache.promise) {
    const { mongodbUri } = getServerConfig();

    mongooseCache.promise = mongoose.connect(mongodbUri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10_000,
      dbName: 'invoices',
    });
  }

  mongooseCache.connection = await mongooseCache.promise;
  return mongooseCache.connection;
}
