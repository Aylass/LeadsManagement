import type { Request, Response } from "express"
import Lead from "../models/Lead"
import type { LeadQuery, LeadResponse, ApiResponse, LeadWithId } from "../types"

export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as LeadQuery

    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.max(1, Math.min(50, Number(limit)))
    const skip = (pageNum - 1) * limitNum

    const query: any = {}

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { fantasyName: { $regex: search.trim(), $options: "i" } },
        { contact: { $regex: search.trim(), $options: "i" } },
      ]
    }

    if (status && status !== "all") {
      query.status = status
    }

    const sortConfig: any = {}
    sortConfig[sortBy as string] = sortOrder === "asc" ? 1 : -1

    const [leads, total] = await Promise.all([
      Lead.find(query).sort(sortConfig).skip(skip).limit(limitNum).lean(),
      Lead.countDocuments(query),
    ])

    const totalPages = Math.ceil(total / limitNum)

    const transformedLeads: LeadWithId[] = leads.map((lead: any) => ({
      _id: lead._id.toString(),
      name: lead.name,
      fantasyName: lead.fantasyName,
      email: lead.email,
      telephone: lead.telephone,
      fax: lead.fax,
      contact: lead.contact,
      cnpj: lead.cnpj,
      cpf: lead.cpf,
      address: lead.address,
      status: lead.status,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    }))

    const response: ApiResponse<LeadResponse> = {
      success: true,
      data: {
        leads: transformedLeads,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    }

    res.status(200).json(response)
  } catch (error) {
    console.error("Error fetching leads:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, fantasyName, email, telephone, fax, contact, cnpj, cpf, address, status } = req.body

    if (!name || !email) {
      res.status(400).json({ success: false, error: "Name and email are required" })
      return
    }

    const existingLead = await Lead.findOne({ email: email.toLowerCase() })
    if (existingLead) {
      res.status(400).json({ success: false, error: "A lead with this email already exists" })
      return
    }

    const lead = new Lead({
      name: name.trim(),
      ...(fantasyName && { fantasyName: fantasyName.trim() }),
      email: email.toLowerCase().trim(),
      ...(telephone && { telephone: telephone.trim() }),
      ...(fax && { fax: fax.trim() }),
      ...(contact && { contact: contact.trim() }),
      ...(cnpj && { cnpj: cnpj.trim() }),
      ...(cpf && { cpf: cpf.trim() }),
      ...(address && { address }),
      status: status || "Whatsapp",
    })

    const savedLead = await lead.save()

    res.status(201).json({ success: true, data: savedLead, message: "Lead created successfully" })
  } catch (error: any) {
    console.error("Error creating lead:", error)

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      res.status(400).json({ success: false, error: validationErrors.join(", ") })
    } else if (error.code === 11000) {
      res.status(400).json({ success: false, error: "A lead with this email already exists" })
    } else {
      res.status(500).json({ success: false, error: "Internal server error" })
    }
  }
}

export const getLeadById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const lead = await Lead.findById(id)

    if (!lead) {
      res.status(404).json({ success: false, error: "Lead not found" })
      return
    }

    res.status(200).json({ success: true, data: lead })
  } catch (error) {
    console.error("Error fetching lead:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

export const updateLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, fantasyName, email, telephone, fax, contact, cnpj, cpf, address, status } = req.body

    const lead = await Lead.findById(id)
    if (!lead) {
      res.status(404).json({ success: false, error: "Lead not found" })
      return
    }

    if (email && email.toLowerCase() !== lead.email) {
      const existingLead = await Lead.findOne({ email: email.toLowerCase(), _id: { $ne: id } })
      if (existingLead) {
        res.status(400).json({ success: false, error: "A lead with this email already exists" })
        return
      }
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.trim() }),
        ...(fantasyName !== undefined && { fantasyName: fantasyName ? fantasyName.trim() : "" }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(telephone !== undefined && { telephone: telephone ? telephone.trim() : "" }),
        ...(fax !== undefined && { fax: fax ? fax.trim() : "" }),
        ...(contact !== undefined && { contact: contact ? contact.trim() : "" }),
        ...(cnpj !== undefined && { cnpj: cnpj ? cnpj.trim() : "" }),
        ...(cpf !== undefined && { cpf: cpf ? cpf.trim() : "" }),
        ...(address !== undefined && { address }),
        ...(status && { status }),
      },
      { new: true, runValidators: true },
    )

    res.status(200).json({ success: true, data: updatedLead, message: "Lead updated successfully" })
  } catch (error: any) {
    console.error("Error updating lead:", error)

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      res.status(400).json({ success: false, error: validationErrors.join(", ") })
    } else {
      res.status(500).json({ success: false, error: "Internal server error" })
    }
  }
}

export const deleteLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const lead = await Lead.findByIdAndDelete(id)

    if (!lead) {
      res.status(404).json({ success: false, error: "Lead not found" })
      return
    }

    res.status(200).json({ success: true, message: "Lead deleted successfully" })
  } catch (error) {
    console.error("Error deleting lead:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

export const getLeadStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await Lead.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])

    const total = await Lead.countDocuments()

    const statusCounts = {
      Whatsapp: 0,
      Instagram: 0,
      "Boca-boca": 0,
    }

    stats.forEach((stat) => {
      statusCounts[stat._id as keyof typeof statusCounts] = stat.count
    })

    const conversionRate = total > 0 ? Math.round((statusCounts["Whatsapp"] / total) * 100) : 0

    res.status(200).json({
      success: true,
      data: { total, statusCounts, conversionRate },
    })
  } catch (error) {
    console.error("Error fetching lead stats:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}
