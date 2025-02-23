"use client"

import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-sm supports-[backdrop-filter]:bg-background/40">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="text-lg font-bold tracking-tight hover:text-primary transition-colors">
          LangLearn
        </a>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hover:bg-background/80">
              Sign in
            </Button>
            <Button size="sm" className="bg-primary/90 hover:bg-primary">
              Sign up
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
} 