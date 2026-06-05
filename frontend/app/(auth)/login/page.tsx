"use client"

import Link from "next/link"
import type React from "react"
import { useState } from "react"
import { apiClient } from "@/lib/api"
import { useRouter } from "next/dist/client/components/navigation"
import { Field, Input, SectionTitle } from "@/components/lead-form"

interface LoginData {
  login: string
  password: string
}

export default async function LoginPage() {
  const router = useRouter()
  const [loginData, setLoginData] = useState<LoginData>({ login: "", password: "" })
  const [validated, setValidated] = useState<boolean>(false)
  let recentLeads: any[] = []

  try {
    const loginResponse = await apiClient.getLeads({ limit: 5, sortBy: "createdAt", sortOrder: "desc" })
    if (loginResponse.success && loginResponse.data) {
      if (loginResponse.data.login === loginData.login && loginResponse.data.password === loginData.password) {
        setValidated(true)
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error)
  }


  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">

            {/* Login */}
            <div className="bg-white shadow rounded-xl p-6">
              <SectionTitle
                title="Login"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Login">
                  <Input
                    type="text"
                    placeholder="Loguin ou email"
                    value={formData.login}
                    onChange={(e) => set("login", e.target.value)}
                    hasError={!!errors.name}
                  />
                </Field>
                <Field label="Nome Fantasia">
                  <Input
                    type="text"
                    placeholder="Senha"
                    value={formData.fantasyName}
                    onChange={(e) => set("fantasyName", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <Link href="/dashboard" className="flex-1">
              <button
                type="button"
                className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Entrar
              </button>
            </Link>
        </form>
    </div>
  )
}
