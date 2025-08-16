import express, { Request, Response } from "express";
import { ChatCompletionMessageParam } from "openai/resources";
import multer from "multer";
import fs from "fs";
import FormData from "form-data";
import nodeFetch from "node-fetch";

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
  triggerEvent,
} from "../services/star-message-service";
import { getCarById } from "../services/car-service";
import { generateInitialStarInstruction } from "../helpers/generate-initial-star-instruction";
import { toMp3, toWav16kMono } from "../helpers/media";

const router = express.Router();

// Set up multer for file uploads (store in /tmp)
const upload = multer({ dest: "/tmp/" });

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

router.post(
  "/add-audio",
  upload.single("audio"),
  async (req: Request, res: Response) => {
    try {
      const user: IUser | null = await checkAuthToken(req);
      if (!user) {
        return res.status(401).send({ error: "Unauthorized" });
      }

      const source = req.body.sourceId;
      const format = req.body.format || "wav"; // default to wav
      const userContext = req.body.context ? JSON.parse(req.body.context) : {};

      if (!req?.file || !source) {
        return res
          .status(400)
          .send({ error: "Missing audio file or sourceId" });
      }

      let car = null;

      if (source !== "app") {
        car = await getCarById(source);

        if (!car) {
          return res.status(400).send({ error: "Invalid source" });
        }
      }

      const audioPath = req.file.path;
      const { base64: audioBase64, format: audioFormat } = await toMp3(
        audioPath
      );

      const freshMessages = await getRecentMessages(user.id);
      let parsedMessages = freshMessages.map((message: any) => message.content);

      if (parsedMessages[parsedMessages.length - 1]?.role !== "system") {
        const systemMessage = await generateInitialStarInstruction(
          user,
          car?.color || "Green"
        );
        parsedMessages.push(systemMessage);
      }

      parsedMessages = parsedMessages.reverse();
      parsedMessages = parsedMessages.map((message) => ({
        role: message.role,
        content: [
          {
            type: "text",
            text: message.content,
          },
        ],
      }));

      // Call OpenAI audio response
      const audioResponse = await getOpenAIAudioResponse(
        parsedMessages,
        audioBase64,
        audioFormat
      );

      // Respond to the client immediately
      res.status(200).send({
        message: "ok",
        audioData: audioResponse.audioData,
        transcript: audioResponse.transcript,
      });

      // 1. Transcribe the user's audio
      let transcription = "";

      try {
        const formData = new FormData();
        formData.append("file", fs.createReadStream(audioPath), {
          filename: req.file!.originalname || "audio.wav",
        });
        formData.append("model", "gpt-4o-transcribe");
        formData.append(
          "language",
          (user.starPreferences?.language || "en-US").split("-")[0]
        );

        const openaiKey = process.env.OPENAI_KEY;
        const response = await nodeFetch(
          "https://api.openai.com/v1/audio/transcriptions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openaiKey}`,
              ...formData.getHeaders(),
            },
            body: formData,
          }
        );
        const data = await response.json();
        if (response.ok && data.text) {
          transcription = data.text;
        }
      } catch (err) {
        console.error("Transcription error:", err);
      }

      // 2. Save the user message (with transcription)
      const userContentObj: any = {
        message: "[AUDIO]",
        event: "user",
        userContext,
        promptVersion: process.env.PROMPT_VERSION,
      };

      if (transcription) userContentObj.message = transcription;

      const newStarMessage: IStarMessage = new StarMessage({
        content: {
          role: "user",
          content: JSON.stringify(userContentObj),
        },
        userId: user.id,
        source,
      });
      await newStarMessage.save();

      // 3. Save star's response
      const starResponse: IStarMessage = new StarMessage({
        content: {
          role: "assistant",
          content: audioResponse.transcript,
        },
        userId: user.id,
        source,
      });
      await starResponse.save();
    } catch (e) {
      console.log(e);
      res.status(500).send({ error: "Server error" });
    }
  }
);

export default router;
