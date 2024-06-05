import express, { Request, Response } from "express";
import User, { IUser } from "../models/User";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const newUser: IUser = new User({
      name: req.body.name,
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
    });

    const user = await newUser.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

export default router;
