import mongoose from "mongoose";
import { config } from "../config/app.config";

const connectToDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Error connecting to MongoDB");
    process.exit(1);
  }
};

export default connectToDB;
