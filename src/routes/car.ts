import express, { Request, Response } from "express";

import Car, { ICar } from "../models/Car";
import { generateOtp } from "../helpers/generate-otp";
import User from "../models/User";
import { getCarById } from "../services/car-service";

const router = express.Router();

// these routes need protection and should be accessed only via our admin tool, whatever it is
router.post("/", async (req: Request, res: Response) => {
  try {
    const modelName: string | null = req.body.modelName;

    if (!modelName || modelName.trim() === "") {
      return res.status(406).send({ error: "Invalid car model name" });
    }

    const userId: string | null = req.body.userId;

    if (!userId || userId.trim() === "") {
      return res.status(406).send({ error: "Invalid user ID" });
    }

    const existingCar = await Car.findOne({
      modelName,
      userId,
    });

    if (existingCar !== null) {
      await Car.updateOne(
        {
          _id: existingCar._id,
        },
        {
          verificationCode: generateOtp(),
          updatedTs: new Date().getTime(),
        }
      );

      return res.status(200).send({ car: existingCar });
    }

    const existingUser = await User.findOne({
      _id: userId,
      delTs: null,
    });

    if (!existingUser) {
      return res.status(406).send({ error: "Invalid user ID" });
    }

    const newCar: ICar = new Car({
      modelName,
      userId,
      verificationCode: generateOtp(),
    });

    const car = await newCar.save();

    res.status(200).send({ car });
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: "Server error" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const carId = req.query.carId;

    if (!carId) {
      return res.status(402).send({ error: "Invalid car ID" });
    }

    const car = await getCarById(carId.toString());

    if (!car) {
      return res.status(402).send({ error: "Invalid car ID" });
    }

    res.status(200).send({ car });
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: "Server error" });
  }
});

export default router;
