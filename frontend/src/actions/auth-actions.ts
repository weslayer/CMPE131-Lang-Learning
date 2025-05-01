import { UserID } from "@/types/deck";
import { database } from "./database";



export const users = database.collection("users");


/**
 * Get the UserID of a user, registered using Google.
 * Returns null if there is no user (new user).
 * @param googleID Google ID to search by
 * @returns UserID of a user, null if user does not exist.
 */
export async function getUserIDViaGoogle(googleID: string) : Promise<UserID|null> {
    const result = await users.findOne({
        google_id: googleID,
    });

    if(!result) {
        return null;
    }

    return result._id.toString();
}