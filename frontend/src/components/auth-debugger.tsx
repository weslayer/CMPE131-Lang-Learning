'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { ensureUserExists } from '@/actions/flashcard-actions';
import { DICTIONARY_SERVER } from '@/config';
import { getAuthHeaders, getApiToken } from '@/lib/auth';

export default function AuthDebugger() {
  const { data: session, status } = useSession();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEnsured, setUserEnsured] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Function to fetch debug data from the API
  async function fetchDebugData() {
    try {
      setLoading(true);
      setError(null);
      
      // Get secure JWT token headers
      const headers = await getAuthHeaders();
      
      // Call the debug endpoint with JWT token
      const response = await fetch(`${DICTIONARY_SERVER}/auth/debug`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      setDebugData(data);
      
      // Get the JWT token for display
      const token = await getApiToken();
      setAuthToken(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }
  
  // Function to ensure user exists
  async function runEnsureUser() {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ensureUserExists();
      setUserEnsured(result);
      
      // Fetch debug data again to confirm
      await fetchDebugData();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setUserEnsured(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Authentication Debugger</h2>
      
      <div className="mb-4">
        <p><strong>Status:</strong> {status}</p>
        {session?.user && (
          <div className="mt-2">
            <p><strong>User:</strong> {session.user.name || 'N/A'}</p>
            <p><strong>Email:</strong> {session.user.email || 'N/A'}</p>
            <p><strong>ID:</strong> {session.user.id || 'N/A'}</p>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2 mb-6">
        {status === 'unauthenticated' ? (
          <button
            onClick={() => signIn('google')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Sign In with Google
          </button>
        ) : (
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        )}
        
        <button
          onClick={fetchDebugData}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition-colors"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Test Backend Auth'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {debugData && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Backend Response:</h3>
          <div className="bg-gray-50 p-3 rounded-md overflow-auto max-h-96">
            <pre className="whitespace-pre-wrap">{JSON.stringify(debugData, null, 2)}</pre>
          </div>
        </div>
      )}
      
      {authToken && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">JWT Token:</h3>
          <div className="bg-gray-50 p-3 rounded-md overflow-auto max-h-40">
            <pre className="whitespace-pre-wrap text-xs">{authToken}</pre>
          </div>
        </div>
      )}
    </div>
  );
} 