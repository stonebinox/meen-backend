import { Request } from "express";

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

export { checkAuthToken };
