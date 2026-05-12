import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
      <h2 className="text-2xl font-semibold text-gray-800">Página não encontrada</h2>
      <p className="text-gray-500">A página que você está procurando não existe.</p>
      <Button asChild>
        <Link href="/">Voltar para a página inicial</Link>
      </Button>
    </div>
  )
}
