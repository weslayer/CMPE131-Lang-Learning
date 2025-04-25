"use client"

import { Button } from "@/components/ui/button"
import { signIn, signOut, useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import styles from "./header.module.css";

export function Header() {
  const { data: session, status } = useSession()
  const [backendAvailable, setBackendAvailable] = useState(true)
  const pathname = usePathname()

  // Check if backend is available at all
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        // Try a simple endpoint first to test connection
        const response = await fetch('/api/tokenize/cn?q=test', { 
          method: 'GET',
          cache: 'no-store'
        });
        
        // If we get a response (even an error), the backend is available
        setBackendAvailable(true);
      } catch (error) {
        console.error('Backend server unavailable:', error);
        setBackendAvailable(false);
      }
    };
    
    checkBackendHealth();
  }, []);

  const handleSignIn = async () => {
    await signIn("google", { callbackUrl: "/" })
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  const handleKeyDown = (handler: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handler()
    }
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className={styles["header"]}>
        <nav className={styles["nav"]} aria-label="Main navigation">
          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-lg font-bold tracking-tight transition-colors ${isActive('/') ? 'text-primary' : 'hover:text-primary'}`}
              tabIndex={0}
              aria-label="Go to homepage"
              aria-current={isActive('/') ? 'page' : undefined}
            >
              LangLearn
            </Link>
            
            {!backendAvailable ? (
              <div className="flex items-center">
                <span className="text-md text-amber-500 mr-2" title="Backend server is not available">
                  ⚠️ Server Offline
                </span>
                <Link
                  href="/test-backend"
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                  tabIndex={0}
                >
                  Diagnose
                </Link>
              </div>
            ) : status === "authenticated" ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/my-flashcards"
                  className={`text-md tracking-tight transition-colors ${isActive('/my-flashcards') ? 'text-primary font-medium' : 'hover:text-primary'}`}
                  tabIndex={0}
                  aria-label="Go to my flashcards"
                  aria-current={isActive('/my-flashcards') ? 'page' : undefined}
                >
                  My Flashcards
                </Link>
                <Link
                  href="/flashcards"
                  className={`text-md tracking-tight transition-colors ${isActive('/flashcards') ? 'text-primary font-medium' : 'hover:text-primary'}`}
                  tabIndex={0}
                  aria-label="Practice flashcards"
                  aria-current={isActive('/flashcards') ? 'page' : undefined}
                >
                  Practice
                </Link>
              </div>
            ) : status === "unauthenticated" ? (
              <span className="text-md text-gray-400">
                Sign in to use Flashcards
              </span>
            ) : null}
          </div>

          {status === "loading" ? (
            <div 
              className="h-8 w-8 animate-pulse rounded-full bg-gray-200" 
              role="status"
              aria-label="Loading user session"
            />
          ) : session?.user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User avatar"}
                    width={32}
                    height={32}
                    className="rounded-full"
                    priority
                  />
                )}
                <span className="text-sm font-medium">{session.user.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                onKeyDown={handleKeyDown(handleSignOut)}
                className="hover:bg-destructive/10 hover:text-destructive"
                aria-label="Sign out of your account"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignIn}
                onKeyDown={handleKeyDown(handleSignIn)}
                className="hover:bg-background/80"
                aria-label="Sign in with Google"
              >
                Sign in with Google
              </Button>
            </div>
          )}
        </nav>
    </header>
  )
} 