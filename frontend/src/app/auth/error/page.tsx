"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function Error() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-red-600">Authentication Error</h2>
          <p className="mt-2 text-gray-600">
            {error || "An error occurred during authentication"}
          </p>
        </div>
        <div className="mt-8">
          <Link
            href="/"
            className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
} 