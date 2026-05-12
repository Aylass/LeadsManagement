export type LeadStatus = "Whatsapp" | "Instagram" | "Boca-boca"

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
  createdAt?: Date
  updatedAt?: Date
}

export interface LeadQuery {
  page?: number
  limit?: number
  search?: string
  status?: LeadStatus | "all"
  sortBy?: "name" | "email" | "telephone" | "createdAt"
  sortOrder?: "asc" | "desc"
}

export interface LeadResponse {
  leads: LeadWithId[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LeadWithId extends Lead {
  _id: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
