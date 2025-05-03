'use server';

import { Session } from "next-auth";
import { auth } from "../api/auth/[...nextauth]/route";
import { database } from "@/actions/database";
import { ObjectId } from "mongodb";
import Link from "next/link";

function NotLoggedIn() {
  return <>
    <h2>Log in to see your flashcards.</h2>
  </>
}

async function LoggedIn({ session } : { session: Session }) {

  // const headers = await getAuthHeaders();
  const user = await database.collection("users").findOne({
    _id: ObjectId.createFromHexString(session.user.id ?? "")
  });

  const decks = await database.collection("decks").find({
    _id: {
      $in: user?.decks ?? []
    }
  }).limit(20).toArray();


  return <div>
    {
      decks.map((deck, i) => <li key={i}>{
        <Link href={`/deck/${deck._id.toString("base64")}`}>{deck.name}</Link>}</li>)
    }
    <Link href="/deck/create">Create Deck</Link>
    {/* <CreateDeckButton/> */}
  </div>
}

export default async function MyFlashcardsPage() {
  // const { data: session, status } = useSession();
  const session = await auth();



  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">My Flashcards</h1>
      
      {
        session ? <LoggedIn session={session}/> : <NotLoggedIn/>
      }

    </div>
  );
} 