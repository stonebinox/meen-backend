import mongoose, { Document, Schema } from "mongoose";
import { ChatCompletionMessageParam } from "openai/resources";

export interface IStarMessage extends Document {
  content: ChatCompletionMessageParam;
  userId: string;
  source: string; // this can be "app" or a car ID
  crtTs: Date;
  delTs: Date | null;
}

const StarMessageSchema: Schema = new Schema({
  content: {
    type: Object,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    required: true,
    default: "app",
  },
  crtTs: {
    type: Date,
    required: true,
    default: Date.now,
  },
  delTs: {
    type: Date,
    default: null,
  },
});

export default mongoose.model<IStarMessage>("StarMessage", StarMessageSchema);
