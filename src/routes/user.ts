import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";

import User, { IUser } from "../models/User";
import { getUserByToken, markUserAsVerified } from "../services/user-service";

const router = express.Router();

const generateAuthToken = (userId: any): String => {
  const payload = { id: userId, date: new Date().getTime() };
  const token = jwt.sign(payload, process.env.JWT_SECRET as string);

  return token;
};

const generateOtp = (): Number => Math.floor(100000 + Math.random() * 900000);

router.post("/", async (req: Request, res: Response) => {
  try {
    const phoneNumber = req.body.phoneNumber;

    const existingUser = await User.findOne({
      phoneNumber,
      delTs: null,
    });

    if (existingUser !== null) {
      await User.updateOne(
        {
          _id: existingUser._id,
        },
        {
          otp: generateOtp(),
          updatedTs: new Date().getTime(),
        }
      );

      const token = generateAuthToken(existingUser._id);

      return res.status(200).send({ token, id: existingUser._id });
    }

    const newUser: IUser = new User({
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
      otp: generateOtp(),
    });

    const user = await newUser.save();
    const token = generateAuthToken(user._id);

    res.status(200).send({ token, id: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Server error",
    });
  }
});

router.post("/verification", async (req: Request, res: Response) => {
  try {
    const code = req.body.code;
    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    if (!code || code.length !== 6) {
      throw new Error("Invalid code");
    }

    token = token.replace("Bearer", "").trim();
    const user = await getUserByToken(token);

    if (!user) {
      throw new Error("User not found");
    }

    const { otp } = user;

    if (otp !== code) {
      return res.status(406).send({ error: "Code mismatch" });
    }

    await markUserAsVerified(user._id as string);

    res.status(200).send({ message: "Verified" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Server error" });
  }
});

export default router;
