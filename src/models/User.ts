import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

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
});

export default mongoose.model<IUser>("User", UserSchema);
