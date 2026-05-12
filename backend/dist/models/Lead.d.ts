import mongoose, { type Document } from "mongoose";
export interface LeadDocument extends Document {
    name: string;
    email: string;
    telephone: string;
    status: "Whatsapp" | "Instagram" | "Boca-boca";
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<LeadDocument, {}, {}, {}, mongoose.Document<unknown, {}, LeadDocument, {}> & LeadDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Lead.d.ts.map