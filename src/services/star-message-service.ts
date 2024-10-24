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

const triggerEvent = async (
  eventName: string,
  eventData: any,
  userId: string,
  source: string
): Promise<IStarMessage> => {
  const appLaunchedMessage: IStarMessage = new StarMessage({
    content: {
      role: "user",
      content: `{
        message: "",
        event: "${eventName}",
        eventData: ${JSON.stringify(eventData)}
      }`,
    },
    userId,
    source,
  });
  const eventMessage = await appLaunchedMessage.save();
  const recentMessages: IStarMessage[] = await getRecentMessages(userId);
  const reversed = recentMessages.reverse();
  reversed.push(eventMessage);
  const starResponse = await getOpenAIResponse(
    reversed.map((message) => message.content)
  );
  const starResponseMessage: IStarMessage = new StarMessage({
    content: starResponse,
    userId,
    source,
  });
  const starResponseDto = await starResponseMessage.save();

  return starResponseDto;
};

export { getRecentMessages, initConversation, getOpenAIResponse, triggerEvent };
