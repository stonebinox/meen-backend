import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string | null;
  fullName: string | null;
  crtTs: Date;
  phoneNumber: string;
  otp: string | null;
  email: string | null;
  updatedTs: Date | null;
  delTs: Date | null;
  verified: boolean;
  starPreferences?: {
    name?: string;
    language?: string;
    voiceId?: string;
    userData?: {
      [key: string]: string;
    };
  } | null;
  /*
  Consider adding numberOfOwners, defaultModel, and more
  */
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    default: null,
  },
  fullName: {
    type: String,
    required: true,
  },
  crtTs: {
    type: Date,
    required: true,
    default: Date.now,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    default: null,
  },
  updatedTs: {
    type: Date,
    default: null,
  },
  delTs: {
    type: Date,
    default: null,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  starPreferences: {
    name: {
      type: String,
      default: "Star",
    },
    language: {
      type: String,
      default: "en-US",
    },
    voiceId: {
      type: String,
      default: null,
    },
    userData: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
  },
});

export default mongoose.model<IUser>("User", UserSchema);
