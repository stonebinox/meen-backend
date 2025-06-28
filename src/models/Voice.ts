import mongoose, { Document, Schema } from "mongoose";

export interface IVoice extends Document {
  name: string;
  description: string;
  gender: "male" | "female" | "neutral";
  tone: "formal" | "casual" | "neutral";
  personality: string;
  voiceNameId: string;
  speechInstructions: string;
  ttsProvider: "openai" | "elevenlabs" | "google";
  default: boolean;
  crtTs: Date;
  updatedTs: Date | null;
  delTs: Date | null;
}

const VoiceSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ["male", "female", "neutral"],
  },
  tone: {
    type: String,
    required: true,
    enum: ["formal", "casual", "neutral"],
  },
  personality: {
    type: String,
    required: true,
  },
  voiceNameId: {
    type: String,
    required: true,
  },
  speechInstructions: {
    type: String,
    required: true,
  },
  ttsProvider: {
    type: String,
    required: true,
    enum: ["openai", "elevenlabs", "google"],
    default: "openai",
  },
  default: {
    type: Boolean,
    default: false,
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
  delTs: {
    type: Date,
    default: null,
  },
});

export default mongoose.model<IVoice>("Voice", VoiceSchema);
