"use client"

import { RubyDisplay } from '@/components/ruby-display/ruby-display'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Flashcard {
  id: string
  term: string
  reading: string[]
  definition: string
  created_at: string
}

export default function FlashcardsPage() {
  const { data: session, status } = useSession()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentCard, setCurrentCard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  // Fetch user's flashcards
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }

    async function fetchFlashcards() {
      try {
        setLoading(true);
        console.log("Fetching flashcards for user");
        
        // Call our API which uses NextAuth session
        const response = await fetch('/api/user/flashcards', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important: include credentials for session cookies
        });
        
        if (!response.ok) {
          console.error(`Flashcard fetch failed: ${response.status}`);
          const errorText = await response.text();
          console.error("Error details:", errorText);
          throw new Error(`Failed to fetch flashcards: ${response.status}`);
        }
        
        const cards = await response.json();
        console.log(`Fetched ${cards.length} flashcards successfully`);
        setFlashcards(cards);
      } catch (err) {
        console.error('Error fetching flashcards:', err);
        setError(`Failed to load flashcards: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFlashcards();
  }, [status]);

  const nextCard = () => {
    setShowAnswer(false);
    setCurrentCard((current) => (current + 1) % flashcards.length);
  };

  const prevCard = () => {
    setShowAnswer(false);
    setCurrentCard((current) => 
      current === 0 ? flashcards.length - 1 : current - 1
    );
  };

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-6">Your Flashcards</h1>
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg text-center">
          <p className="text-amber-800 mb-4">
            Please sign in to view and study your flashcards.
          </p>
          <Link href="/">
            <Button>Go to Homepage</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Your Flashcards</h1>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <p className="text-red-700">{error}</p>
          <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">
            Go back to homepage
          </Link>
        </div>
      ) : flashcards.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center">
          <p className="text-gray-600 mb-4">
            You don't have any flashcards yet. Add some words from the homepage.
          </p>
          <Link href="/">
            <Button>Go to Homepage</Button>
          </Link>
        </div>
      ) : (
        <div className="mb-6">
          <div className="bg-white shadow-lg rounded-lg p-8 mb-6 min-h-[300px] flex flex-col">
            {flashcards.length > 0 && (
              <>
                <div className="text-right text-sm text-gray-500 mb-4">
                  Card {currentCard + 1} of {flashcards.length}
                </div>
                
                <div className="flex-grow flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold mb-8 text-gray-900">
                    {flashcards[currentCard].reading.length > 0 ? (
                      <RubyDisplay
                        terms={
                          Array.from(flashcards[currentCard].term).map((char, i) => ({
                            text: char,
                            reading: i < flashcards[currentCard].reading.length
                              ? flashcards[currentCard].reading[i]
                              : ""
                          }))
                        }
                      />
                    ) : (
                      flashcards[currentCard].term
                    )}
                  </div>
                  
                  {showAnswer ? (
                    <div className="text-center">
                      <h3 className="text-xl font-semibold mb-2 text-gray-800">Translation:</h3>
                      <p className="text-gray-900 text-lg">
                        {flashcards[currentCard].definition}
                      </p>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => setShowAnswer(true)}
                      className="mt-4"
                    >
                      Show Translation
                    </Button>
                  )}
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button 
                    variant="outline" 
                    onClick={prevCard}
                    disabled={flashcards.length <= 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={nextCard}
                    disabled={flashcards.length <= 1}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </div>
          
          <div className="text-center">
            <Link href="/">
              <Button variant="outline">
                Back to Homepage
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 