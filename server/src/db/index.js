import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    let rawUrl = (process.env.MONGODB_URL || "mongodb://localhost:27017").trim();
    
    // Strip trailing slashes to prevent double slashes (e.g. host//SharePod)
    while (rawUrl.endsWith('/')) {
      rawUrl = rawUrl.slice(0, -1);
    }

    let connectionString;
    if (rawUrl.includes('?')) {
      const [base, query] = rawUrl.split('?');
      const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
      connectionString = `${cleanBase}/${DB_NAME}?${query}`;
    } else {
      connectionString = `${rawUrl}/${DB_NAME}`;
    }

    const connectionInstance = await mongoose.connect(connectionString, {
      dbName: DB_NAME, // Explicitly enforce database name without leading slashes
    });
    console.log(`✅ MongoDB connected at host: ${connectionInstance.connection.host}, Database: ${connectionInstance.connection.name}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
