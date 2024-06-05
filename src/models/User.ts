import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IUser extends Document {
  id: string;
  name: string;
  fullName: string | null;
  crtTs: Date;
  phoneNumber: string;
  otp: string | null;
  email: string | null;
  updatedTs: Date | null;
  deltTs: Date | null;
  /*
  Consider adding numberOfOwners, defaultModel, and more
  */
}

const UserSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
  },
  name: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    default: null,
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
});

export default mongoose.model<IUser>("User", UserSchema);
