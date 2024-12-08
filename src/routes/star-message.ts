import express, { Request, Response } from "express";

import { checkAuthToken } from "../services/token-service";
import { IUser } from "../models/User";
import StarMessage, { IStarMessage } from "../models/StarMessage";
import {
  getOpenAIResponse,
  getRecentMessages,
  handleToolCalls,
  initConversation,
  parseToolCall,
  triggerEvent,
} from "../services/star-message-service";
import { getCarById } from "../services/car-service";
import { generateInitialStarInstruction } from "../helpers/generate-initial-star-instruction";
import { ChatCompletionMessageParam } from "openai/resources";

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

    if (
      req.body.event &&
      req.body.event?.trim() !== "" &&
      req.body.event !== "user"
    ) {
      await triggerEvent(
        req.body.event,
        {
          data: userMessage,
        },
        user.id,
        source
      );
    } else {
      if (source !== "app") {
        car = await getCarById(source);

        if (!car) {
          return res.status(400).send({ error: "Invalid source" });
        }
      }
      // add an else condition to detect the latest car driven by the user
      // it's going to be unknown if the source is "app"

      const recentMessages: IStarMessage[] = await getRecentMessages(user.id);

      if (recentMessages.length === 0) {
        await initConversation(user, car?.color || "Unknown", source);
      }

      const newStarMessage: IStarMessage = new StarMessage({
        content: {
          role: "user",
          content: `{
            message: "${userMessage}",
            event: "user",
          }`,
        },
        userId: user.id,
        source,
      });

      await newStarMessage.save();
    }

    const freshMessages = await getRecentMessages(user.id);
    const parsedMessages = freshMessages.map((message) => message.content);

    if (user.starPreferences) {
      const starPreferenceMessage: ChatCompletionMessageParam = {
        role: "user",
        content: `{
          message: "",
          event: "customization",
          eventData: ${user.starPreferences}
        }`,
      };

      parsedMessages.push(starPreferenceMessage);
    }

    const systemMessageContent = generateInitialStarInstruction(
      user,
      car?.color || "Unknown"
    );
    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: systemMessageContent,
    };

    parsedMessages.push(systemMessage);

    const reversedMessages = parsedMessages.reverse();
    const openResponse = await getOpenAIResponse(reversedMessages);
    const toolCall = openResponse.tool_calls;
    const starResponse: IStarMessage = new StarMessage({
      content: openResponse,
      userId: user.id,
      source,
    });
    const newResponse = await starResponse.save();

    if (toolCall) {
      await handleToolCalls(toolCall, user.id, source);

      for (let i = 0; i < toolCall.length; i++) {
        const tool = toolCall[i];
        await parseToolCall(tool, user.id, source);
      }

      const messages = await getRecentMessages(user.id);
      const reversed = messages.reverse();
      const response = await getOpenAIResponse(
        reversed.map((message) => message.content)
      );
      const starResponseMessage: IStarMessage = new StarMessage({
        content: response,
        userId: user.id,
        source,
      });
      const starResponse = await starResponseMessage.save();

      return res.status(200).send({
        message: starResponse,
      });
    }

    return res.status(200).send({
      message: newResponse,
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

    let recentMessages: any[] = await getRecentMessages(user.id);

    if (recentMessages.length !== 0) {
      if (recentMessages[0].content.tool_calls) {
        await handleToolCalls(
          recentMessages[0].content.tool_calls,
          user.id,
          source
        );
        for (let i = 0; i < recentMessages[0].content.tool_calls.length; i++) {
          const tool = recentMessages[0].content.tool_calls[i];
          await parseToolCall(tool, user.id, source);
        }
      }

      await triggerEvent(
        "app",
        {
          appLaunched: true,
          description:
            "This means that the user is initiating a conversation with you via the OS. This is a cue for you to initiate conversation with the user.",
        },
        user.id,
        source
      );

      recentMessages = await getRecentMessages(user.id);
      const reversed = recentMessages.reverse();
      const response = await getOpenAIResponse(
        reversed.map((message) => message.content)
      );
      const starResponseMessage: IStarMessage = new StarMessage({
        content: response,
        userId: user.id,
        source,
      });

      const starResponse = await starResponseMessage.save();

      return res.status(200).send({ message: starResponse });
    }

    await initConversation(user, car?.color || "Unknown", source);

    recentMessages = await getRecentMessages(user.id);

    return res.status(200).send({ message: recentMessages[0] });
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: "Server error" });
  }
});

export default router;
