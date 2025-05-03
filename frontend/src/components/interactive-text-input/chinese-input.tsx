"use client"

import { useState, useEffect, Dispatch, SetStateAction } from 'react'
import { CDictEntry } from '@/types/cdict'
import { Button } from '@/components/ui/button'
import { addFlashcardToDeck, createFlashcard } from '@/actions/deck-actions'
import { useSession } from 'next-auth/react'
import { MultiRubyDisplay, RubyDisplay } from '@/components/ruby-display/ruby-display'

interface ChineseInputProps {
  setTokens: Dispatch<SetStateAction<string[]>>
}

export default function ChineseInput({ setTokens }: ChineseInputProps) {
  const [text, setText] = useState('');
  // const [tokens, setTokens] = useState<string[]>([])
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

    </div>
  );
}

interface TokenCardProps {
  token: string;
  deckId: string;
}

export function TokenCard({ token, deckId }: TokenCardProps) {
  const [entry, setEntry] = useState<CDictEntry | null>(null);
  const [loading, setLoading] = useState(false);
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
      })
      .catch(err => {
        console.error('Error fetching translation:', err);
      }).finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleAddClick = async () => {
    await addFlashcardToDeck(deckId, {
      term: token.split("").join(";"),
      reading: entry?.reading ?? "",
      definition: entry?.senses.join(", ") ?? ""
    });
  };
  
  if(loading) return <></>
  // Check if we have valid readings and definitions
  const hasValidReadings = entry?.reading != null;
  const hasValidSenses = entry && 
    Array.isArray(entry.senses) && 
    entry.senses.length > 0;
  if(!hasValidReadings) return <></>
  
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
              <MultiRubyDisplay text={token.split("").join(";")} reading={entry.reading} />
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