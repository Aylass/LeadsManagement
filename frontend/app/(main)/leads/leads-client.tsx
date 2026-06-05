"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import * as XLSX from "xlsx"
import { apiClient, type LeadStatus, type LeadResponse } from "@/lib/api"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function LeadsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [leadsData, setLeadsData] = useState<LeadResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("leads-view-mode") as "cards" | "table" | null
    if (stored === "cards" || stored === "table") {
      setViewMode(stored)
    }
  }, [])

  const handleViewMode = (mode: "cards" | "table") => {
    setViewMode(mode)
    localStorage.setItem("leads-view-mode", mode)
  }

  // Local search state for immediate UI updates
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "")

  // Get current params
  const currentPage = Number(searchParams.get("page")) || 1
  const currentLimit = Number(searchParams.get("limit")) || 10
  const currentSearch = searchParams.get("search") || ""
  const currentStatus = (searchParams.get("status") as LeadStatus | "all") || "all"
  const currentSortBy = (searchParams.get("sortBy") as "name" | "email" | "createdAt") || "createdAt"
  const currentSortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc"

  // Debounce the search input
  const debouncedSearchInput = useDebounce(searchInput, 500)

  const updateSearchParams = useCallback(
    (updates: Record<string, string | number>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === "" || value === "all" || (key === "page" && value === 1)) {
          params.delete(key)
        } else {
          params.set(key, value.toString())
        }
      })

      router.push(`/leads?${params.toString()}`)
    },
    [searchParams, router],
  )

  const fetchLeads = useCallback(
    async (isSearching = false) => {
      try {
        if (isSearching) {
          setSearching(true)
        } else {
          setLoading(true)
        }
        setError(null)

        const response = await apiClient.getLeads({
          page: currentPage,
          limit: currentLimit,
          search: currentSearch,
          status: currentStatus,
          sortBy: currentSortBy,
          sortOrder: currentSortOrder,
        })

        if (response.success && response.data) {
          setLeadsData(response.data)
        } else {
          setError(response.error || "Failed to fetch leads")
        }
      } catch (err) {
        setError("Failed to fetch leads")
        console.error("Error fetching leads:", err)
      } finally {
        setLoading(false)
        setSearching(false)
      }
    },
    [currentPage, currentLimit, currentSearch, currentStatus, currentSortBy, currentSortOrder],
  )

  // Effect for debounced search
  useEffect(() => {
    if (debouncedSearchInput !== currentSearch) {
      updateSearchParams({ search: debouncedSearchInput, page: 1 })
    }
  }, [debouncedSearchInput, currentSearch, updateSearchParams])

  // Effect for fetching leads
  useEffect(() => {
    const isSearching = searchInput !== currentSearch
    fetchLeads(isSearching)
  }, [currentPage, currentLimit, currentSearch, currentStatus, currentSortBy, currentSortOrder, fetchLeads])

  // Sync search input with URL params when navigating
  useEffect(() => {
    setSearchInput(currentSearch)
  }, [currentSearch])

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case "Whatsapp":
        return "bg-green-100 text-green-800"
      case "Instagram":
        return "bg-pink-100 text-pink-800"
      case "Boca-boca":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const first = await apiClient.getLeads({
        page: 1,
        limit: 50,
        search: currentSearch,
        status: currentStatus,
        sortBy: currentSortBy,
        sortOrder: currentSortOrder,
      })

      if (!first.success || !first.data) return

      let allLeads = [...first.data.leads]

      if (first.data.totalPages > 1) {
        const pages = Array.from({ length: first.data.totalPages - 1 }, (_, i) =>
          apiClient.getLeads({
            page: i + 2,
            limit: 50,
            search: currentSearch,
            status: currentStatus,
            sortBy: currentSortBy,
            sortOrder: currentSortOrder,
          })
        )
        const results = await Promise.all(pages)
        results.forEach((r) => {
          if (r.success && r.data) allLeads = [...allLeads, ...r.data.leads]
        })
      }

      const rows = allLeads.map((lead) => ({
        Nome: lead.name,
        "Nome Fantasia": lead.fantasyName || "",
        Email: lead.email,
        Telefone: lead.telephone || "",
        Fax: lead.fax || "",
        Contato: lead.contact || "",
        CNPJ: lead.cnpj || "",
        CPF: lead.cpf || "",
        CEP: lead.address?.cep || "",
        Rua: lead.address?.street || "",
        Número: lead.address?.number || "",
        Complemento: lead.address?.complement || "",
        Bairro: lead.address?.neighborhood || "",
        Cidade: lead.address?.city || "",
        UF: lead.address?.uf || "",
        Origem: lead.status,
        "Data de Cadastro": new Date(lead.createdAt).toLocaleDateString("pt-BR"),
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Leads")

      const date = new Date().toISOString().split("T")[0]
      XLSX.writeFile(wb, `leads_${date}.xlsx`)
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setExporting(false)
    }
  }

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value)
  }

  const handleStatusFilter = (status: LeadStatus | "all") => {
    updateSearchParams({ status, page: 1 })
  }

  const handleLimitChange = (limit: number) => {
    updateSearchParams({ limit, page: 1 })
  }

  const handleSort = (sortBy: "name" | "email" | "createdAt") => {
    const newSortOrder = currentSortBy === sortBy && currentSortOrder === "asc" ? "desc" : "asc"
    updateSearchParams({ sortBy, sortOrder: newSortOrder })
  }

  const handlePageChange = (page: number) => {
    updateSearchParams({ page })
  }

  if (loading && !leadsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !leadsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => fetchLeads()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Tente novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Leads</h1>
            <p className="text-gray-600">Gerencie e acompanhe todos os seus leads em um único lugar</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {exporting ? "Exportando..." : "Exportar .xlsx"}
            </button>
            <Link href="/leads/new">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Adicionar Novo Lead
              </button>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow-lg rounded-lg mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filtros & Busca
              {searching && <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <svg
                  className="absolute left-3 top-3 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>

              <select
                value={currentStatus}
                onChange={(e) => handleStatusFilter(e.target.value as LeadStatus | "all")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas as Origens</option>
                <option value="Whatsapp">Whatsapp</option>
                <option value="Instagram">Instagram</option>
                <option value="Boca-boca">Boca-boca</option>
              </select>

              <select
                value={currentLimit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={6}>6 por página</option>
                <option value={10}>10 por página</option>
                <option value={18}>18 por página</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSort("name")}
                  className={`flex-1 px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1 ${
                    currentSortBy === "name" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                  }`}
                >
                  Nome
                  {currentSortBy === "name" && (
                    <svg
                      className={`h-4 w-4 ${currentSortOrder === "asc" ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => handleSort("createdAt")}
                  className={`flex-1 px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1 ${
                    currentSortBy === "createdAt" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                  }`}
                >
                  Data
                  {currentSortBy === "createdAt" && (
                    <svg
                      className={`h-4 w-4 ${currentSortOrder === "asc" ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {leadsData && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {(["Whatsapp", "Instagram", "Boca-boca"] as LeadStatus[]).map((status) => {
              const count = leadsData.leads.filter((lead) => lead.status === status).length
              return (
                <div key={status} className="bg-white shadow-md rounded-lg p-6 text-center">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600">{status}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Leads List */}
        <div className="bg-white shadow-lg rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {leadsData ? `${leadsData.leads.length} de ${leadsData.total}` : "0 de 0"} Leads
                {searching && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
              </h2>
              <div className="flex items-center gap-3">
                {leadsData && leadsData.totalPages > 1 && (
                  <div className="text-sm text-gray-600">
                    Página {leadsData.page} de {leadsData.totalPages}
                  </div>
                )}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleViewMode("cards")}
                    title="Visualização em cards"
                    className={`p-2 transition-colors ${
                      viewMode === "cards" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleViewMode("table")}
                    title="Visualização em tabela"
                    className={`p-2 transition-colors border-l border-gray-300 ${
                      viewMode === "table" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {!leadsData || leadsData.leads.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lead encontrado</h3>
                <p className="text-gray-600 mb-4">
                  {currentSearch || currentStatus !== "all"
                    ? "Tente ajustar sua busca ou critérios de filtro"
                    : "Comece adicionando seu primeiro lead"}
                </p>
                <Link href="/leads/new">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Adicionar Seu Primeiro Lead
                  </button>
                </Link>
              </div>
            ) : (
              <>
                {viewMode === "cards" ? (
                  <div className={`space-y-4 ${searching ? "opacity-75" : ""}`}>
                    {leadsData.leads.map((lead) => (
                      <div
                        key={lead._id}
                        className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                              {lead.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
                              {lead.fantasyName && (
                                <p className="text-sm text-gray-500 italic">{lead.fantasyName}</p>
                              )}
                              <div className="flex items-center gap-2 text-gray-600 mt-1">
                                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm">{lead.email}</span>
                              </div>
                              {lead.telephone && (
                                <div className="flex items-center gap-2 text-gray-600 mt-0.5">
                                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  <span className="text-sm">{lead.telephone}</span>
                                </div>
                              )}
                              {lead.contact && (
                                <div className="flex items-center gap-2 text-gray-500 mt-0.5">
                                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span className="text-sm">{lead.contact}</span>
                                </div>
                              )}
                              {lead.address?.city && (
                                <div className="flex items-center gap-2 text-gray-500 mt-0.5">
                                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="text-sm">{lead.address.city}{lead.address.uf ? ` - ${lead.address.uf}` : ""}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                              {lead.status}
                            </span>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                            </div>
                            <Link href={`/leads/${lead._id}/edit`}>
                              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-gray-700">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Editar
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={searching ? "opacity-75" : ""}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <button
                              onClick={() => handleSort("name")}
                              className="flex items-center gap-1 hover:text-gray-900 font-medium"
                            >
                              Nome
                              {currentSortBy === "name" && (
                                <svg className={`h-3.5 w-3.5 ${currentSortOrder === "asc" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </button>
                          </TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Cidade / UF</TableHead>
                          <TableHead>CNPJ / CPF</TableHead>
                          <TableHead>Origem</TableHead>
                          <TableHead>
                            <button
                              onClick={() => handleSort("createdAt")}
                              className="flex items-center gap-1 hover:text-gray-900 font-medium"
                            >
                              Data
                              {currentSortBy === "createdAt" && (
                                <svg className={`h-3.5 w-3.5 ${currentSortOrder === "asc" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </button>
                          </TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leadsData.leads.map((lead) => (
                          <TableRow key={lead._id}>
                            <TableCell>
                              <div className="font-medium text-gray-900">{lead.name}</div>
                              {lead.fantasyName && (
                                <div className="text-xs text-gray-500 italic">{lead.fantasyName}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-600">{lead.email}</TableCell>
                            <TableCell className="text-gray-600">{lead.telephone || "—"}</TableCell>
                            <TableCell className="text-gray-600">
                              {lead.address?.city
                                ? `${lead.address.city}${lead.address.uf ? ` - ${lead.address.uf}` : ""}`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {lead.cnpj || lead.cpf || "—"}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                                {lead.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-gray-600 whitespace-nowrap">
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Link href={`/leads/${lead._id}/edit`}>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-gray-700 whitespace-nowrap">
                                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Editar
                                </button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}


                {/* Pagination */}
                {leadsData.totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      {Array.from({ length: leadsData.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 border rounded-lg ${
                            page === currentPage
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= leadsData.totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
