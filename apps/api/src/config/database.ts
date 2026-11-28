import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5_000,
    maxPoolSize: 20,
    minPoolSize: 2
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
