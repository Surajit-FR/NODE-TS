import mongoose, { Model, Schema } from "mongoose";
import { IRefund } from "../../types/types";

const RefundSchema: Schema<IRefund> = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    refundId: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    status: { type: String, default: "" },
    created: { type: Date, default: null },
}, { timestamps: true });

const RefundModel: Model<IRefund> = mongoose.model<IRefund>('refund', RefundSchema);

export default RefundModel;