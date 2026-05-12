import Link from "next/link"
import { apiClient } from "@/lib/api"
import Breadcrumb from "@/components/breadcrumb"

export default async function HomePage() {
  let stats = {
    total: 0,
    statusCounts: {
      Whatsapp: 0,
      Instagram: 0,
      "Boca-boca": 0,
    },
    conversionRate: 0,
  }

  let recentLeads: any[] = []

  try {
    // Fetch stats
    const statsResponse = await apiClient.getLeadStats()
    if (statsResponse.success && statsResponse.data) {
      stats = statsResponse.data
    }

    // Fetch recent leads
    const leadsResponse = await apiClient.getLeads({ limit: 5, sortBy: "createdAt", sortOrder: "desc" })
    if (leadsResponse.success && leadsResponse.data) {
      recentLeads = leadsResponse.data.leads
    }
  } catch (error) {
    console.error("Error fetching data:", error)
  }

  return (
    <>
      <Breadcrumb />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Bem vindo a Alessandrosaba Licores</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Seu sistema de gestão de leads completo
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total de Leads</h3>
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <p className="text-xs text-gray-500">Leads ativos no pipeline</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Whatsapp</h3>
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.statusCounts.Whatsapp}</div>
              <p className="text-xs text-gray-500">Via Whatsapp</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Instagram</h3>
                <svg className="h-5 w-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="text-2xl font-bold text-pink-600">{stats.statusCounts.Instagram}</div>
              <p className="text-xs text-gray-500">Via Instagram</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Porcentagem de Conversão</h3>
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.conversionRate}%</div>
              <p className="text-xs text-gray-500">Proporção de lead para cliente</p>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl rounded-lg p-8">
              <div className="flex items-center gap-2 mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                <h2 className="text-2xl font-bold">Criar Novo Lead</h2>
              </div>
              <p className="text-blue-100 mb-6">  Capture novos clientes potenciais e comece a construir relacionamentos</p>
              <Link href="/leads/new">
                <button className="w-full bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors">
                  Criar Novo Lead
                </button>
              </Link>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-xl rounded-lg p-8">
              <div className="flex items-center gap-2 mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h2 className="text-2xl font-bold">Ver toda a lista de Leads</h2>
              </div>
              <p className="text-purple-100 mb-6">Monitore e gerencie sua base de dados de leads</p>
              <p className="mb-6 text-purple-50">
              </p>
              <Link href="/leads">
                <button className="w-full bg-white text-purple-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors">
                  Ver Lista de Leads
                </button>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow-lg rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Atividade Recente</h2>
              <p className="text-gray-600">Últimas atualizações do seu pipeline de leads</p>
            </div>
            <div className="p-6">
              {recentLeads.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Sem atividade recente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentLeads.map((lead) => (
                    <div key={lead._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">{lead.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{lead.name}</p>
                          <p className="text-sm text-gray-500">{lead.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            lead.status === "Whatsapp"
                              ? "bg-green-100 text-green-800"
                              : lead.status === "Instagram"
                                ? "bg-pink-100 text-pink-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {lead.status}
                        </span>
                        <span className="text-sm text-gray-500">{new Date(lead.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
