import { DataSource } from "typeorm";
import mongoose from "mongoose";
import { WorkItem, RCA } from "../models/entities";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "user",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "ims",
    entities: [WorkItem, RCA],
    synchronize: true, // For development
});

export async function initDBs() {
    await AppDataSource.initialize();
    console.log("Postgres initialized");

    const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/ims";
    await mongoose.connect(mongoUrl);
    console.log("MongoDB initialized");
}
