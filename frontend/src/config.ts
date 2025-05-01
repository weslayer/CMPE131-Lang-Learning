"server only"

// Configuration constants for the application
export const DICTIONARY_SERVER = process.env.DICTIONARY_SERVER || 'http://localhost:8000'; 

export const DB_USERNAME = process.env.DB_USERNAME;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_CLUSTER = process.env.DB_CLUSTER
export const DATABASE_URI = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@${DB_CLUSTER}/?retryWrites=true&w=majority&appName=langlearning-cluster`;