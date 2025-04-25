"use client"

import { useState, useEffect } from 'react'
import { CDictEntry } from '@/types/cdict'
import { Button } from '@/components/ui/button'
import { createFlashcard } from '@/actions/deck-actions'
import { useSession } from 'next-auth/react'
import { RubyDisplay } from '@/components/ruby-display/ruby-display'

interface ChineseInputProps {
  onWordAdded?: (word: string) => void
}

export default function ChineseInput({ onWordAdded }: ChineseInputProps) {
  const { data: session, status } = useSession()
  const [text, setText] = useState('')
  const [tokens, setTokens] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Tokenize the input text when it changes
  useEffect(() => {
    if (!text.trim()) {
      setTokens([]);
      return;
    }

    // Debounce to avoid too many requests
    const timeoutId = setTimeout(() => {
      setLoading(true);
      fetch(`/api/tokenize/cn?q=${encodeURIComponent(text.trim())}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Server responded with ${res.status}`);
          }
          return res.json();
        })
        .then((data: { tokens: string[] }) => {
          setTokens(data.tokens || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error tokenizing text:', err);
          setError('Failed to tokenize text. Please try again.');
          setLoading(false);
        });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [text]);

  // Handle adding a word to flashcards
  const handleAddToFlashcards = async (
    token: string, 
    entry: CDictEntry | null
  ) => {
    if (!entry) return;
    
    if (status !== 'authenticated') {
      setError('You must be signed in to add flashcards');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      // Format readings and definition
      const readings = entry.reading || [];
      const definition = entry.senses && entry.senses.length > 0
        ? entry.senses.join('; ')
        : 'No definition available';
      
      // Create and add the flashcard
      const flashcard = {
        term: token,
        reading: readings,
        definition: definition
      };
      
      const result = await createFlashcard(flashcard);
      
      if (result) {
        setSuccessMessage(`Added "${token}" to your flashcards`);
        setTimeout(() => setSuccessMessage(null), 3000);
        if (onWordAdded) onWordAdded(token);
      } else {
        setError('Failed to add flashcard. Please try again.');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('Error adding flashcard:', err);
      setError(`Error: ${(err as Error).message}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-4">
        <label 
          htmlFor="chinese-input" 
          className="block text-sm font-medium mb-2 text-gray-100"
        >
          Enter Chinese Text:
        </label>
        <textarea
          id="chinese-input"
          className="w-full p-3 border border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-100 bg-gray-800"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste Chinese text here..."
        />
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-sm text-gray-100">Processing text...</p>
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      {tokens.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-100">Words Found:</h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {tokens.map((token, i) => (
              <TokenCard 
                key={i} 
                token={token} 
                onAddToFlashcards={handleAddToFlashcards}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TokenCardProps {
  token: string;
  onAddToFlashcards: (token: string, entry: CDictEntry | null) => Promise<void>;
}

function TokenCard({ token, onAddToFlashcards }: TokenCardProps) {
  const [entry, setEntry] = useState<CDictEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Fetch translation for this token
  useEffect(() => {
    setLoading(true);
    fetch(`/api/term/cn/${encodeURIComponent(token)}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }
        return res.json();
      })
      .then((data: CDictEntry[]) => {
        setEntry(Array.isArray(data) && data.length > 0 ? data[0] : null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching translation:', err);
        setLoading(false);
      });
  }, [token]);

  const handleAddClick = async () => {
    setAdding(true);
    try {
      await onAddToFlashcards(token, entry);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  };

  // Check if we have valid readings and definitions
  const hasValidReadings = entry && 
                           Array.isArray(entry.reading) && 
                           entry.reading.length > 0;
  const hasValidSenses = entry && 
                         Array.isArray(entry.senses) && 
                         entry.senses.length > 0;

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="animate-pulse h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-2">
            <div className="text-xl font-bold text-gray-900">
              {hasValidReadings ? (
                <RubyDisplay
                  terms={token.split('').map((char, i) => ({
                    text: char,
                    reading: (entry?.reading && i < entry.reading.length) 
                      ? entry.reading[i] 
                      : ""
                  }))}
                />
              ) : token}
            </div>
            <Button
              size="sm"
              variant={added ? "default" : "outline"}
              onClick={handleAddClick}
              disabled={adding || !entry}
              className={added ? "bg-green-500 hover:bg-green-600" : "text-gray-900 border-gray-500"}
            >
              {adding ? "..." : added ? "Added ✓" : "Add to Flashcards"}
            </Button>
          </div>
          
          {hasValidSenses ? (
            <div className="mt-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Translation:</h4>
              <ul className="list-disc pl-5 text-sm text-gray-900">
                {entry.senses.map((sense, i) => (
                  <li key={i}>{sense}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-900 italic">No translation available</p>
          )}
        </>
      )}
    </div>
  );
} 