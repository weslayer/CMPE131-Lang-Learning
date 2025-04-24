import { DB_PASSWORD, DB_USERNAME } from "./secret";

export const DICTIONARY_SERVER = "http://127.0.0.1:8000";
export const DATABASE_URI = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@langlearning-cluster.lg4o4fr.mongodb.net/?retryWrites=true&w=majority&appName=langlearning-cluster`;
