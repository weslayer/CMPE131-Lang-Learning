'use client';

import { useEffect, useState } from 'react';
import { getMyFlashcards, createFlashcard, getDefaultDeck } from '../../actions/deck-actions';
import { Flashcard } from '@/types/deck';
import LoadingIndicator from '@/components/ui/loading-indicator';
import FlashcardList from '@/components/flashcard-list/flashcard-list';

export default function MyFlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [defaultDeck, setDefaultDeck] = useState<any>(null);
  
  // New flashcard form state
  const [term, setTerm] = useState('');
  const [reading, setReading] = useState('');
  const [definition, setDefinition] = useState('');
  
  // Load flashcards and default deck on page load
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        // Get default deck
        const deck = await getDefaultDeck();
        setDefaultDeck(deck);
        
        // Get flashcards
        const cards = await getMyFlashcards();
        setFlashcards(cards);
      } catch (err) {
        console.error(err);
        setError('Failed to load your flashcards. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!term || !reading || !definition) {
      setError('All fields are required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Create new flashcard in default deck
      const newFlashcard = await createFlashcard({
        term,
        reading: reading.split(',').map(r => r.trim()),
        definition
      });
      
      if (newFlashcard) {
        // Add new flashcard to the list
        setFlashcards(prev => [...prev, newFlashcard]);
        
        // Reset form
        setTerm('');
        setReading('');
        setDefinition('');
        
        // Show success message
        setSuccess('Flashcard added successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to create flashcard. Please ensure your term contains at least one Chinese character.');
    } finally {
      setSubmitting(false);
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
        <LoadingIndicator 
          message="Loading your flashcards..." 
          size="large" 
          className="py-20" 
        />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">My Flashcards</h1>
      
      {defaultDeck ? (
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Managing flashcards in deck: <span className="font-semibold">{defaultDeck.name}</span>
        </p>
      ) : (
        <p className="text-gray-600 dark:text-gray-300 mb-4">Loading your personal deck...</p>
      )}
      
      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {/* Add new flashcard form */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Add New Flashcard</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="term">
              Term (Chinese)
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="term"
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Enter Chinese term"
              disabled={submitting}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="reading">
              Reading (comma separated)
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="reading"
              type="text"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              placeholder="e.g. nǐ,ni3"
              disabled={submitting}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="definition">
              Definition
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Enter definition"
              rows={3}
              disabled={submitting}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center">
                  <LoadingIndicator size="small" message="" className="mr-2" /> 
                  Adding...
                </span>
              ) : 'Add Flashcard'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Flashcards list */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Your Flashcards</h2>
        <FlashcardList 
          flashcards={flashcards} 
          emptyMessage="You don't have any flashcards in your personal deck yet."
        />
      </div>
    </div>
  );
} 