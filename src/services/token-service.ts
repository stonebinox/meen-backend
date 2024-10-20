import { Request } from "express";
import jwt from "jsonwebtoken";

import { IUser } from "../models/User";
import { getUserByToken } from "./user-service";

const checkAuthToken = async (req: Request): Promise<IUser | null> => {
  let token = req.headers.authorization || null;

  if (!token) {
    return null;
  }

  token = token.replace("Bearer", "").trim();
  const user = await getUserByToken(token);

  if (!user) {
    return null;
  }

  return user;
};

const generateAuthToken = (userId: any): String => {
  const payload = { id: userId, date: new Date().getTime() };
  const token = jwt.sign(payload, process.env.JWT_SECRET as string);

  return token;
};

export { checkAuthToken, generateAuthToken };
