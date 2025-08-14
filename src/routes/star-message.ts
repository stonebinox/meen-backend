import express, { Request, Response } from "express";
import { ChatCompletionMessageParam } from "openai/resources";
import fs from "fs";
import path from "path";

import { checkAuthToken } from "../services/token-service";
import { IUser } from "../models/User";
import StarMessage, { IStarMessage } from "../models/StarMessage";
import {
  getOpenAIAudioResponse,
  getOpenAIResponse,
  getRecentMessages,
  handleToolCalls,
  initConversation,
  parseToolCall,
  transcribeAudio,
  triggerEvent,
} from "../services/star-message-service";
import { getCarById } from "../services/car-service";
import { generateInitialStarInstruction } from "../helpers/generate-initial-star-instruction";
import { convertM4ABase64ToWavBase64 } from "../helpers/convert-audio";
import { getStarLanguage } from "../services/user-service";

const router = express.Router();

router.post("/speak", async (req: Request, res: Response) => {
  try {
    const user = await checkAuthToken(req);
    if (!user) return res.status(401).send({ error: "Unauthorized" });

    const { sourceId, context: userContext } = req.body;
    const audioBase64 = req.body.audioBase64; // or req.file.path if using multer
    const wavBase64 = await convertM4ABase64ToWavBase64(audioBase64);
    const format: "wav" | "mp3" = req.body.audioFormat || "wav"; // default to m4a if not provided

    if (!sourceId || !audioBase64) {
      return res.status(400).send({ error: "Missing source or audio file" });
    }

    const recentMessages = await getRecentMessages(user.id);
    const car = await getCarById(sourceId);
    const systemMessageContent = generateInitialStarInstruction(
      user,
      car?.color || "Unknown"
    );

    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: systemMessageContent,
    };

    const parsedMessages = [
      systemMessage,
      ...recentMessages.map((m) => m.content),
    ].reverse();

    const { audioData, transcript } = await getOpenAIAudioResponse(
      parsedMessages,
      wavBase64,
      format
    );

    res.status(200).send({
      message: {
        audio: audioData,
        transcript,
      },
    });

    const starLanguage = await getStarLanguage(user.id);
    const userTranscript = await transcribeAudio(
      wavBase64,
      format,
      starLanguage
    );
    const newStarMessage: IStarMessage = new StarMessage({
      content: {
        role: "user",
        content: JSON.stringify({
          message: userTranscript,
          event: "user",
          userContext,
          promptVersion: process.env.PROMPT_VERSION,
        }),
      },
      userId: user.id,
      source: sourceId,
    });

    await newStarMessage.save();

    const assistantMessage: IStarMessage = new StarMessage({
      content: audioData
        ? {
            role: "assistant",
            content: JSON.stringify({
              message: transcript,
              data: {},
              callback: null,
              promptVersion: process.env.PROMPT_VERSION,
            }),
          }
        : transcript,
      userId: user.id,
      source: sourceId,
    });
    await assistantMessage.save();
  } catch (e) {
    console.error("Audio message error:", e);
    return res.status(500).send({ error: "Server error" });
  }
});

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

      const userContext = req.body.context || {};

      const newStarMessage: IStarMessage = new StarMessage({
        content: {
          role: "user",
          content: JSON.stringify({
            message: userMessage,
            event: "user",
            userContext,
            promptVersion: process.env.PROMPT_VERSION,
          }),
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
        content: JSON.stringify({
          message: "",
          event: "customization",
          eventData: user.starPreferences,
          promptVersion: process.env.PROMPT_VERSION,
        }),
      };

      parsedMessages.push(starPreferenceMessage);
    }

    const systemMessageContent = await generateInitialStarInstruction(
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
    let toolResponse = null;

    if (toolCall) {
      await handleToolCalls(toolCall, user.id, source);

      for (let i = 0; i < toolCall.length; i++) {
        const tool = toolCall[i];
        toolResponse = await parseToolCall(tool, user.id, source);
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
        toolResponse,
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
          userDetected: true,
          description:
            "This means that the car has detected the user and the auxillary battery systems have been powered on along with the OS. You can use this as a cue to initiate conversation with the user.",
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
