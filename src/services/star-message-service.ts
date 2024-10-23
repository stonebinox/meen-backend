import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
} from "openai/resources";
import OpenAI from "openai";

import { generateInitialStarInstruction } from "../helpers/generate-initial-star-instruction";
import StarMessage, { IStarMessage } from "../models/StarMessage";
import { IUser } from "../models/User";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const getRecentMessages = async (userId: string) => {
  const messages = await StarMessage.find({
    userId,
  })
    .sort({ crtTs: -1 })
    .limit(100);

  return messages;
};

const initConversation = async (
  user: IUser,
  carColor: string,
  source: string
) => {
  const firstMessage = generateInitialStarInstruction(
    user.fullName || "User",
    carColor
  );

  const aiMessage: ChatCompletionMessageParam = {
    role: "system",
    content: firstMessage,
  };

  const response: ChatCompletionMessage = await getOpenAIResponse([aiMessage]);
  const starMessage: IStarMessage = new StarMessage({
    content: aiMessage,
    userId: user.id,
    source,
  });
  await starMessage.save();

  const starResponse: IStarMessage = new StarMessage({
    content: response,
    userId: user.id,
    source,
  });
  await starResponse.save();
};

const getOpenAIResponse = async (
  messages: ChatCompletionMessageParam[]
): Promise<ChatCompletionMessage> => {
  const response = await openai.chat.completions.create({
    messages,
    model: "gpt-4o-mini",
  });

  const { choices } = response;
  const { message } = choices[0];

  return message;
};

export { getRecentMessages, initConversation, getOpenAIResponse };
