"use client"

import { Button } from "@/components/ui/button"
import { signIn, signOut, useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"

export function Header() {
  const { data: session, status } = useSession()

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-sm supports-[backdrop-filter]:bg-background/40">
      <div className="container flex h-16 items-center justify-between">
        <Link 
          href="/" 
          className="text-lg font-bold tracking-tight hover:text-primary transition-colors"
          tabIndex={0}
          aria-label="Go to homepage"
        >
          LangLearn
        </Link>
        <nav className="flex items-center gap-4" aria-label="Main navigation">
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
      </div>
    </header>
  )
} 