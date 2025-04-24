import { DB_PASSWORD, DB_USERNAME, DICTIONARY_SERVER } from "./secret";

export { DICTIONARY_SERVER };
export const DATABASE_URI = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@langlearning-cluster.lg4o4fr.mongodb.net/?retryWrites=true&w=majority&appName=langlearning-cluster`;
