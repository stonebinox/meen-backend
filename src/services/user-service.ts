import jwt from "jsonwebtoken";

import User, { IUser } from "../models/User";
import Car from "../models/Car";

const getUserByToken = async (token: string): Promise<IUser | null> => {
  try {
    const original = jwt.verify(token, process.env.JWT_SECRET as string);
    const { id: userId } = original as any;
    const user: IUser | null = await User.findOne({
      _id: userId,
    });

    return user;
  } catch (e) {
    return null;
  }
};

const markUserAsVerified = async (userId: string) => {
  await User.updateOne(
    {
      _id: userId,
    },
    {
      verified: true,
      updatedTs: new Date().getTime(),
      otp: null,
    }
  );
};

const markCarAsVerified = async (carId: string) => {
  await Car.updateOne(
    {
      _id: carId,
    },
    {
      verifiedTs: new Date().getTime(),
      updatedTs: new Date().getTime(),
    }
  );
};

export { getUserByToken, markUserAsVerified, markCarAsVerified };
