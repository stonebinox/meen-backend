import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources";
import OpenAI from "openai";

import { generateInitialStarInstruction } from "../helpers/generate-initial-star-instruction";
import StarMessage, { IStarMessage } from "../models/StarMessage";
import { IUser } from "../models/User";
import { tools } from "../helpers/star-tools";
import { setStarName } from "./user-service";

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
    tools,
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

const handleToolCall = async (
  toolCall: ChatCompletionMessageToolCall,
  userId: string,
  source: string
) => {
  const {
    function: { arguments: args, name },
    id: toolId,
  } = toolCall;

  switch (name) {
    case "changeStarName":
      const parsedArgs = JSON.parse(args);
      const starResponse = await changeStarName({
        ...parsedArgs,
        userId,
        source,
        toolId,
      });

      return starResponse;
  }
};

interface ChangeStarNameParams {
  name: string;
  userId: string;
  source: string;
  toolId: string;
}

const changeStarName = async ({
  name,
  userId,
  source,
  toolId,
}: ChangeStarNameParams) => {
  await setStarName(name, userId);
  await sendToolResponse(toolId, { name }, userId, source);

  const starResponse = await triggerEvent(
    "customization",
    {
      starName: name,
    },
    userId,
    source
  );

  return starResponse;
};

const sendToolResponse = async (
  toolId: string,
  content: object,
  userId: string,
  source: string
) => {
  const toolResponse: IStarMessage = new StarMessage({
    content: {
      role: "tool",
      content: JSON.stringify(content),
      tool_call_id: toolId,
    },
    userId,
    source,
  });
  await toolResponse.save();
};

export {
  getRecentMessages,
  initConversation,
  getOpenAIResponse,
  triggerEvent,
  handleToolCall,
};
