// db.js
import mongoose from "mongoose";

import getEnvConfig from "../config/envConfig.js";
const connectDatabase = async () => {
  const DB_URL = getEnvConfig.get("dbUrl");

  if (DB_URL) {
    try {
      const connection = await mongoose.connect(DB_URL, {
        tlsAllowInvalidCertificates: true,
      });
      console.log(
        `MongoDB connected with server: ${connection.connection.host}`
      );
      return mongoose.connection.getClient(); // Return the connection object
    } catch (error) {
      console.error("Database connection error:", error.message);
      throw error;
    }
  } else {
    console.error("Database URL not found");
    throw new Error("Database URL not provided in environment variables");
  }
};

export default connectDatabase;
