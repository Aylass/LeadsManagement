"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { apiClient, type LeadStatus } from "@/lib/api"
import Breadcrumb from "@/components/breadcrumb"
import { SectionTitle, Field, Input, UF_OPTIONS } from "@/components/lead-form"

interface FormData {
  name: string
  fantasyName: string
  email: string
  telephone: string
  fax: string
  contact: string
  cnpj: string
  cpf: string
  street: string
  number: string
  complement: string
  neighborhood: string
  cep: string
  city: string
  uf: string
  status: LeadStatus
}

interface FormErrors {
  name?: string
  email?: string
  telephone?: string
  cnpj?: string
  cpf?: string
  cep?: string
}

export default function NewLeadPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: "",
    fantasyName: "",
    email: "",
    telephone: "",
    fax: "",
    contact: "",
    cnpj: "",
    cpf: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    cep: "",
    city: "",
    uf: "",
    status: "Whatsapp",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const set = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14)
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  }

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2")
  }

  const formatCEP = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    return digits.replace(/^(\d{5})(\d)/, "$1-$2")
  }

  const handleCepBlur = async () => {
    const digits = formData.cep.replace(/\D/g, "")
    if (digits.length !== 8) return

    setIsFetchingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          uf: data.uf || prev.uf,
        }))
        setErrors((prev) => ({ ...prev, cep: undefined }))
      } else {
        setErrors((prev) => ({ ...prev, cep: "CEP não encontrado" }))
      }
    } catch {
      setErrors((prev) => ({ ...prev, cep: "Erro ao buscar CEP" }))
    } finally {
      setIsFetchingCep(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Nome deve ter pelo menos 2 caracteres"
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório"
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "E-mail inválido"
    }

    if (formData.telephone.trim()) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{7,}$/
      if (!phoneRegex.test(formData.telephone.trim())) {
        newErrors.telephone = "Telefone inválido"
      }
    }

    if (formData.cnpj.trim()) {
      const cnpjDigits = formData.cnpj.replace(/\D/g, "")
      if (cnpjDigits.length !== 14) newErrors.cnpj = "CNPJ deve ter 14 dígitos"
    }

    if (formData.cpf.trim()) {
      const cpfDigits = formData.cpf.replace(/\D/g, "")
      if (cpfDigits.length !== 11) newErrors.cpf = "CPF deve ter 11 dígitos"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError(null)
    if (!validate()) return

    const addressData = {
      ...(formData.street.trim() && { street: formData.street.trim() }),
      ...(formData.number.trim() && { number: formData.number.trim() }),
      ...(formData.complement.trim() && { complement: formData.complement.trim() }),
      ...(formData.neighborhood.trim() && { neighborhood: formData.neighborhood.trim() }),
      ...(formData.cep.trim() && { cep: formData.cep.trim() }),
      ...(formData.city.trim() && { city: formData.city.trim() }),
      ...(formData.uf && { uf: formData.uf }),
    }
    const hasAddress = Object.keys(addressData).length > 0

    setIsSubmitting(true)
    try {
      const response = await apiClient.createLead({
        name: formData.name.trim(),
        ...(formData.fantasyName.trim() && { fantasyName: formData.fantasyName.trim() }),
        email: formData.email.trim(),
        ...(formData.telephone.trim() && { telephone: formData.telephone.trim() }),
        ...(formData.fax.trim() && { fax: formData.fax.trim() }),
        ...(formData.contact.trim() && { contact: formData.contact.trim() }),
        ...(formData.cnpj.trim() && { cnpj: formData.cnpj.trim() }),
        ...(formData.cpf.trim() && { cpf: formData.cpf.trim() }),
        ...(hasAddress && { address: addressData }),
        status: formData.status,
      })

      if (response.success) {
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          router.push("/leads")
        }, 2000)
      } else {
        setGlobalError(response.error || "Falha ao criar lead")
      }
    } catch (error: any) {
      const msg: string = error.message || ""
      if (msg.includes("email already exists") || msg.includes("e-mail")) {
        setErrors({ email: "Este e-mail já está cadastrado" })
      } else if (msg.includes("Failed to fetch") || msg.includes("fetch")) {
        setGlobalError("Não foi possível conectar ao servidor. Verifique se o backend está rodando.")
      } else {
        setGlobalError(msg || "Erro inesperado ao salvar o lead")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Breadcrumb />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Novo Lead</h1>
            <p className="text-gray-500 text-sm">Campos marcados com <span className="text-red-500 font-medium">*</span> são obrigatórios</p>
          </div>

          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-800 font-medium">Lead cadastrado com sucesso! Redirecionando...</span>
            </div>
          )}

          {globalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{globalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Seção 1: Identificação */}
            <div className="bg-white shadow rounded-xl p-6">
              <SectionTitle
                title="Identificação"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome" required error={errors.name}>
                  <Input
                    type="text"
                    placeholder="Nome completo ou razão social"
                    value={formData.name}
                    onChange={(e) => set("name", e.target.value)}
                    hasError={!!errors.name}
                  />
                </Field>
                <Field label="Nome Fantasia">
                  <Input
                    type="text"
                    placeholder="Nome fantasia ou apelido"
                    value={formData.fantasyName}
                    onChange={(e) => set("fantasyName", e.target.value)}
                  />
                </Field>
                <Field label="CNPJ" error={errors.cnpj}>
                  <Input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => set("cnpj", formatCNPJ(e.target.value))}
                    hasError={!!errors.cnpj}
                  />
                </Field>
                <Field label="CPF" error={errors.cpf}>
                  <Input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => set("cpf", formatCPF(e.target.value))}
                    hasError={!!errors.cpf}
                  />
                </Field>
              </div>
            </div>

            {/* Seção 2: Contato */}
            <div className="bg-white shadow rounded-xl p-6">
              <SectionTitle
                title="Contato"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="E-mail" required error={errors.email}>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => set("email", e.target.value)}
                    hasError={!!errors.email}
                  />
                </Field>
                <Field label="Pessoa de Contato">
                  <Input
                    type="text"
                    placeholder="Nome da pessoa de contato"
                    value={formData.contact}
                    onChange={(e) => set("contact", e.target.value)}
                  />
                </Field>
                <Field label="Telefone" error={errors.telephone}>
                  <Input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={formData.telephone}
                    onChange={(e) => set("telephone", e.target.value)}
                    hasError={!!errors.telephone}
                  />
                </Field>
                <Field label="Fax">
                  <Input
                    type="tel"
                    placeholder="(00) 0000-0000"
                    value={formData.fax}
                    onChange={(e) => set("fax", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {/* Seção 3: Endereço */}
            <div className="bg-white shadow rounded-xl p-6">
              <SectionTitle
                title="Endereço"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {/* CEP ocupa 2 cols, com spinner */}
                <div className="md:col-span-2">
                  <Field label="CEP" error={errors.cep}>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="00000-000"
                        value={formData.cep}
                        onChange={(e) => set("cep", formatCEP(e.target.value))}
                        onBlur={handleCepBlur}
                        hasError={!!errors.cep}
                      />
                      {isFetchingCep && (
                        <div className="absolute right-3 top-2.5">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                        </div>
                      )}
                    </div>
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Endereço">
                    <Input
                      type="text"
                      placeholder="Rua, Avenida..."
                      value={formData.street}
                      onChange={(e) => set("street", e.target.value)}
                      disabled={isFetchingCep}
                    />
                  </Field>
                </div>

                <div className="md:col-span-1">
                  <Field label="Número">
                    <Input
                      type="text"
                      placeholder="Nº"
                      value={formData.number}
                      onChange={(e) => set("number", e.target.value)}
                    />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Complemento">
                    <Input
                      type="text"
                      placeholder="Apto, Sala, Bloco..."
                      value={formData.complement}
                      onChange={(e) => set("complement", e.target.value)}
                    />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Bairro">
                    <Input
                      type="text"
                      placeholder="Bairro"
                      value={formData.neighborhood}
                      onChange={(e) => set("neighborhood", e.target.value)}
                      disabled={isFetchingCep}
                    />
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="Cidade">
                    <Input
                      type="text"
                      placeholder="Cidade"
                      value={formData.city}
                      onChange={(e) => set("city", e.target.value)}
                      disabled={isFetchingCep}
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="UF">
                    <select
                      value={formData.uf}
                      onChange={(e) => set("uf", e.target.value)}
                      disabled={isFetchingCep}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">UF</option>
                      {UF_OPTIONS.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </div>

            {/* Seção 4: Origem */}
            <div className="bg-white shadow rounded-xl p-6">
              <SectionTitle
                title="Origem do Lead"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(["Whatsapp", "Instagram", "Boca-boca"] as LeadStatus[]).map((s) => (
                  <label
                    key={s}
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                      formData.status === s
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={formData.status === s}
                      onChange={() => set("status", s)}
                      className="text-blue-600"
                    />
                    <span className="font-medium text-gray-700">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 pb-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Cadastrar Lead
                  </>
                )}
              </button>
              <Link href="/leads" className="flex-1">
                <button
                  type="button"
                  className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
