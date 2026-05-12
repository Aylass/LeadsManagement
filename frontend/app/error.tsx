"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
      <h2 className="text-2xl font-semibold text-gray-800">Alguma coisa deu errado</h2>
      <p className="text-gray-500 text-center max-w-md">
        {error.message || "Ocorreu um erro inesperado. Por favor, tente novamente."}
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  )
}
