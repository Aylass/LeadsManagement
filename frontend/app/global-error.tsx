"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
          <h2 className="text-2xl font-semibold">Alguma coisa deu errado</h2>
          <p className="text-gray-500 text-center max-w-md">
            {error.message || "A critical error occurred. Please refresh the page."}
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
