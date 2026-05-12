import mongoose, { Schema, type Document } from "mongoose"

export interface LeadDocument extends Document {
  name: string
  fantasyName?: string
  email: string
  telephone?: string
  fax?: string
  contact?: string
  cnpj?: string
  cpf?: string
  address?: {
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    cep?: string
    city?: string
    uf?: string
  }
  status: "Whatsapp" | "Instagram" | "Boca-boca"
  createdAt: Date
  updatedAt: Date
}

const addressSchema = new Schema(
  {
    street: { type: String, trim: true },
    number: { type: String, trim: true },
    complement: { type: String, trim: true },
    neighborhood: { type: String, trim: true },
    cep: { type: String, trim: true },
    city: { type: String, trim: true },
    uf: { type: String, trim: true, maxlength: 2 },
  },
  { _id: false },
)

const leadSchema = new Schema<LeadDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    fantasyName: {
      type: String,
      trim: true,
      maxlength: [100, "Fantasy name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    telephone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]{7,}$/, "Please enter a valid telephone number"],
    },
    fax: {
      type: String,
      trim: true,
    },
    contact: {
      type: String,
      trim: true,
      maxlength: [100, "Contact name cannot exceed 100 characters"],
    },
    cnpj: {
      type: String,
      trim: true,
    },
    cpf: {
      type: String,
      trim: true,
    },
    address: {
      type: addressSchema,
    },
    status: {
      type: String,
      enum: ["Whatsapp", "Instagram", "Boca-boca"],
      default: "Whatsapp",
      required: [true, "Status is required"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

leadSchema.index({ status: 1 })
leadSchema.index({ createdAt: -1 })
leadSchema.index({ name: "text", email: "text" })

export default mongoose.model<LeadDocument>("Lead", leadSchema)
