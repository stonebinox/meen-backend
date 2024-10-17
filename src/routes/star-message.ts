import express, { Request, Response } from "express";

import { checkAuthToken } from "../services/token-service";
import { IUser } from "../models/User";
import StarMessage, { IStarMessage } from "../models/StarMessage";
import {
  getOpenAIResponse,
  getRecentMessages,
  initConversation,
} from "../services/star-message-service";
import { getCarById } from "../services/car-service";

const router = express.Router();

router.post("/add", async (req: Request, res: Response) => {
  try {
    const user: IUser | null = await checkAuthToken(req);

    if (!user) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    const userMessage = req.body.message;

    if (!userMessage || userMessage.trim() === "") {
      return res.status(400).send({ error: "Invalid message" });
    }

    const source = req.body.sourceId;

    if (!source) {
      return res.status(400).send({ error: "Invalid source" });
    }

    let car = null;

    if (source !== "app") {
      car = await getCarById(source);

      if (!car) {
        return res.status(400).send({ error: "Invalid source" });
      }
    }
    // add an else condition to detect the latest car driven by the user
    // it's going to be unknown if the source is "app"

    const newStarMessage: IStarMessage = new StarMessage({
      content: {
        role: "user",
        content: userMessage,
      },
      userId: user.id,
      source,
    });

    let recentMessages: IStarMessage[] = await getRecentMessages(user.id);

    if (recentMessages.length === 0) {
      await initConversation(user, car?.color || "Unknown", source);
    }

    recentMessages = await getRecentMessages(user.id);
    const latestMessage = await newStarMessage.save();
    recentMessages.push(latestMessage);

    const parsedMessages = recentMessages.map((message) => message.content);

    const response = await getOpenAIResponse(parsedMessages);
    const starResponse: IStarMessage = new StarMessage({
      content: response,
      userId: user.id,
      source,
    });
    await starResponse.save();

    return res.status(200).send({
      message: response,
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: "Server error" });
  }
});

export default router;
