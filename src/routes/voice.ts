import express, { Request, Response } from "express";

import {
  addVoice,
  AddVoiceParams,
  getVoice,
  getVoices,
} from "../services/voice-service";
import { IVoice } from "../models/Voice";

const router = express.Router();

router.post("/add", async (req: Request, res: Response) => {
  try {
    const voicePayload: AddVoiceParams = req.body;

    if (
      !voicePayload ||
      voicePayload.name?.trim() === "" ||
      voicePayload.description?.trim() === ""
    ) {
      return res.status(400).send({ error: "Invalid voice message data" });
    }

    const newVoice = await addVoice(voicePayload);

    res.status(200).send({ message: newVoice });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Server error" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const voices: IVoice[] = await getVoices();

    res.status(200).send({ voices });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const voiceId = req.params.id;

    if (!voiceId || voiceId.trim() === "") {
      return res.status(400).send({ error: "Invalid voice ID" });
    }

    const voice: IVoice | null = await getVoice(voiceId);

    if (!voice) {
      return res.status(404).send({ error: "Voice not found" });
    }

    res.status(200).send({ voice });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Server error" });
  }
});

export default router;
