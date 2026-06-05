import Footer from "@/components/footer"
import type React from "react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return(
  <>
    <main className="min-h-screen">{children}</main>
    <Footer />
  </>
  )
}
