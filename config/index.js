import dotenv from 'dotenv';
dotenv.config();

export const PORT = 4000;
export const DB_FILE = "./db.json";
export const REPLIT_USERNAME = process.env.REPLIT_USERNAME;
export const REPLIT_PASSWORD = process.env.REPLIT_PASSWORD;
