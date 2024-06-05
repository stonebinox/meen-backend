import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";

import User, { IUser } from "../models/User";

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
      name: req.body.name,
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      otp: generateOtp(),
    });

    const user = await newUser.save();
    const token = generateAuthToken(user._id);

    res.status(200).send({ token, id: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

export default router;
