const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface LeadResponse {
  leads: Lead[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LeadAddress {
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  cep?: string
  city?: string
  uf?: string
}

export interface Lead {
  _id: string
  name: string
  fantasyName?: string
  email: string
  telephone?: string
  fax?: string
  contact?: string
  cnpj?: string
  cpf?: string
  address?: LeadAddress
  status: LeadStatus
  createdAt: string
  updatedAt: string
}

export type LeadStatus = "Whatsapp" | "Instagram" | "Boca-boca"

export interface LeadQuery {
  page?: number
  limit?: number
  search?: string
  status?: LeadStatus | "all"
  sortBy?: "name" | "email" | "telephone" | "createdAt"
  sortOrder?: "asc" | "desc"
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`

    const config: RequestInit = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Erro HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error("Failed to fetch")
      }
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Erro desconhecido")
    }
  }

  async getLeads(query: LeadQuery = {}): Promise<ApiResponse<LeadResponse>> {
    const searchParams = new URLSearchParams()

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value.toString())
      }
    })

    const queryString = searchParams.toString()
    const endpoint = `/leads${queryString ? `?${queryString}` : ""}`

    return this.request<LeadResponse>(endpoint)
  }

  async createLead(lead: Omit<Lead, "_id" | "createdAt" | "updatedAt">): Promise<ApiResponse<Lead>> {
    return this.request<Lead>("/leads", {
      method: "POST",
      body: JSON.stringify(lead),
    })
  }

  async getLead(id: string): Promise<ApiResponse<Lead>> {
    const response = await this.request<any>(`/leads/${id}`)
    if (response.success && response.data) {
      // getLeadById uses toJSON transform which converts _id → id
      response.data._id = response.data.id ?? response.data._id
    }
    return response as ApiResponse<Lead>
  }

  async updateLead(
    id: string,
    lead: Partial<Omit<Lead, "_id" | "createdAt" | "updatedAt">>,
  ): Promise<ApiResponse<Lead>> {
    return this.request<Lead>(`/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(lead),
    })
  }

  async deleteLead(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/leads/${id}`, {
      method: "DELETE",
    })
  }

  async getLeadStats(): Promise<
    ApiResponse<{
      total: number
      statusCounts: Record<LeadStatus, number>
      conversionRate: number
    }>
  > {
    return this.request("/leads/stats")
  }
}

export const apiClient = new ApiClient()
