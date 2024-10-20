import express, { Request, Response } from "express";

import User, { IUser } from "../models/User";
import {
  markCarAsVerified,
  markUserAsVerified,
} from "../services/user-service";
import { checkAuthToken, generateAuthToken } from "../services/token-service";
import { generateOtp } from "../helpers/generate-otp";
import Car from "../models/Car";

const router = express.Router();

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
    const user: IUser | null = await checkAuthToken(req);

    if (!user) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    const code = req.body.code;

    if (!code || code.length !== 6) {
      throw new Error("Invalid code");
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

router.get("/car-code", async (req: Request, res: Response) => {
  try {
    const user: IUser | null = await checkAuthToken(req);

    if (!user) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    const car = await Car.findOne({
      userId: user._id as string,
    });

    if (!car) {
      return res.status(400).send({ error: "No car found" });
    }

    res
      .status(200)
      .send({ code: car.verificationCode, carId: car._id as string });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Server error" });
  }
});

router.post("/car-confirm", async (req: Request, res: Response) => {
  try {
    const user: IUser | null = await checkAuthToken(req);

    if (!user) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    const code = req.body.code;
    const carId = req.body.carId;

    if (!code || code.trim().length !== 6) {
      return res.status(400).send({ error: "Invalid code" });
    }

    if (!carId || carId.trim() === "") {
      return res.status(400).send({ error: "Invalid car ID" });
    }

    const car = await Car.findOne({
      _id: carId,
      verificationCode: code,
      userId: user._id as string,
    });

    if (!car) {
      return res.status(400).send({ error: "No car found" });
    }

    await markCarAsVerified(carId);

    res.status(200).send({ car });
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: "Server error" });
  }
});

export default router;
