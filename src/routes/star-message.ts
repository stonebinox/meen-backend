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
import { generateInitialStarInstruction } from "../helpers/generate-initial0star-instruction";

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
    recentMessages = [latestMessage, ...recentMessages];

    let parsedMessages = recentMessages.map((message) => message.content);
    const latestSystemMessage = generateInitialStarInstruction(
      user.fullName || "User",
      car?.color || "Unknown"
    );

    if (parsedMessages[parsedMessages.length - 1].role === "system") {
      parsedMessages[parsedMessages.length - 1].content = latestSystemMessage;
    } else {
      parsedMessages.push({
        role: "system",
        content: latestSystemMessage,
      });
    }

    const reversedMessages = parsedMessages.reverse();

    const response = await getOpenAIResponse(reversedMessages);
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

router.post("/init", async (req: Request, res: Response) => {
  try {
    const user: IUser | null = await checkAuthToken(req);

    if (!user) {
      return res.status(401).send({ error: "Unauthorized" });
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

    let recentMessages: IStarMessage[] = await getRecentMessages(user.id);

    if (recentMessages.length !== 0) {
      return res.status(400).send({ error: "Chat already initiated" });
    }

    await initConversation(user, car?.color || "Unknown", source);

    return res.status(200).send({ success: true });
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: "Server error" });
  }
});

export default router;
