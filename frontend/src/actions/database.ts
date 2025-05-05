// "use server"
import { DATABASE_URI } from "@/config";
import { MongoClient } from "mongodb";


// Create a new client and connect to MongoDB
export const client = new MongoClient(DATABASE_URI);
export const database = client.db("langlearn");
// export const users = database.collection("users");