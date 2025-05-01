'use client';

import { useEffect, useState } from 'react';
import { getMyFlashcards, createFlashcard, getDefaultDeck, getUser } from '../../actions/deck-actions';
import { Flashcard, User } from '@/types/deck';
import LoadingIndicator from '@/components/ui/loading-indicator';
import FlashcardList from '@/components/flashcard-list/flashcard-list';
import { useSession } from 'next-auth/react';

export default function MyFlashcardsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [ user, setUser ] = useState<User|null>(null);

  // Load flashcards and default deck on page load
  useEffect(() => {
    if(!session?.user.id) {
      // redirect("/signin");
      return;
    }
    getUser(session?.user.id).then((user) => {
      // console.log(user)
    });
  }, [status]);


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">My Flashcards</h1>
      
      <ul>
        {user?.decks.map((deck) => <li>Deck</li>)}
      </ul>

      <button>Create Deck</button>

    </div>
  );
} 