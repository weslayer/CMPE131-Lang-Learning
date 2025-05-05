'use server';

import styles from "./page.module.css"
import { Session } from "next-auth";
import { auth } from "../api/auth/[...nextauth]/route";
import { database } from "@/actions/database";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { Flashcard } from "@/types/flashcard";

function NotLoggedIn() {
  return <>
    <h2>Log in to see your flashcards.</h2>
  </>
}



async function DeckSelectItem({id, name, description, cards } : { id: string, name: string, description: string, cards: Flashcard[]}) {
  return <Link href={`/deck/${id}`} className={styles["deck-select-item"]}>
      <div className={styles["name"]}>{name}</div>
      <div className={styles["description"]}>{description}</div>
      <div className={styles["description"]}>{cards.length} cards</div>
    </Link>

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


  return <>
  <div className={styles["list"]}>
      {
        decks.map((deck, i) => 
          <DeckSelectItem key={i} id={deck._id.toString("base64")} name={deck.name} description={deck.description} cards={deck.cards}/>
      )
      }
  </div>
      <div className={styles["center"]}>

    <Link className={styles["create"]} href="/deck/create">Create Deck</Link>
      </div>
    {/* <CreateDeckButton/> */}
  </>
}

export default async function MyFlashcardsPage() {
  // const { data: session, status } = useSession();
  const session = await auth();



  return (
    <>

      <div className="mb-8" style={{margin: "48px 0 32px 0"}}>
        <h1 className="text-3xl font-bold">My Flashcards</h1>
      </div>
      
      
      {
        session ? <LoggedIn session={session}/> : <NotLoggedIn/>
      }

    </>
  );
} 