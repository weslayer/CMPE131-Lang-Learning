import { client, database } from "@/actions/database"
import { ObjectId, WithId } from "mongodb";
import { NextRequest, NextResponse } from "next/server"
import { auth } from "../auth/[...nextauth]/route";
import { DeckID } from "@/types/deck";


export interface User {
    _id: string
    name: string;
    decks: DeckID[];
};



export async function GET(req: NextRequest, res: NextResponse) {
    const searchParams = req.nextUrl.searchParams
    let id = searchParams.get('id');
    if(!id) {
        const session = await auth(req, res);
        if(!session) {
            throw "Missing id parameter";
        }

        id = session.user.id ?? "";

        const user = await database.collection("users").findOne({
            _id: ObjectId.createFromHexString(id)
        });
        // const i = user?.name;
        if(!user) {
            throw "Invalid log in";
        }
        
        const returned = {
            _id: user._id.toHexString(),
            name: user.name,
            decks: user.decks
        };

        return Response.json(returned);

    }
    const user = await database.collection("users").findOne({
        _id: ObjectId.createFromHexString(id)
    });

    if(!user) {
        return Response.json(null);
    }
        
    const returned = {
        _id: user._id.toHexString(),
        name: user.name,
        decks: user.decks
    };

    return Response.json(returned);
}