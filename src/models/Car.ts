import mongoose, { Schema, Document } from "mongoose";

export interface ICar extends Document {
  modelName: string;
  color: string;
  userId: string;
  crtTs: Date;
  verificationCode: string | null;
  verifiedTs: Date | null;
  delTs: Date | null;
}

const CarSchema: Schema = new Schema({
  modelName: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  crtTs: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updatedTs: {
    type: Date,
    default: null,
  },
  verificationCode: {
    type: String,
    default: null,
  },
  verifiedTs: {
    type: Date,
    default: null,
  },
  delTs: {
    type: Date,
    default: null,
  },
});

export default mongoose.model<ICar>("Car", CarSchema);
