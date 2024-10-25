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
import { setStarLanguage, setStarName } from "./user-service";

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
): Promise<void> => {
  const appTriggerEventMessage: IStarMessage = new StarMessage({
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
  await appTriggerEventMessage.save();

  return;
};

const handleToolCalls = async (
  toolCalls: ChatCompletionMessageToolCall[],
  userId: string,
  source: string
) => {
  for (let i = 0; i < toolCalls.length; i++) {
    const tool = toolCalls[i];
    const {
      function: { arguments: args },
      id: toolId,
    } = tool;
    await saveToolResponse(toolId, JSON.parse(args), userId, source);
  }
};

const parseToolCall = async (
  toolCall: ChatCompletionMessageToolCall,
  userId: string,
  source: string
) => {
  const {
    function: { arguments: args, name },
  } = toolCall;

  switch (name) {
    case "changeStarName":
      const parsedArgs = JSON.parse(args);
      await changeStarName({
        ...parsedArgs,
        userId,
        source,
      });

      break;
    case "changeStarLanguage":
      await changeStarLanguage({
        ...JSON.parse(args),
        userId,
        source,
      });

      break;
  }
};

interface ChangeStarLanguageParams {
  language: string;
  userId: string;
  source: string;
}

const changeStarLanguage = async ({
  language,
  userId,
  source,
}: ChangeStarLanguageParams) => {
  await setStarLanguage(language, userId);

  await triggerEvent(
    "customization",
    {
      starLanguage: language,
    },
    userId,
    source
  );
};

interface ChangeStarNameParams {
  name: string;
  userId: string;
  source: string;
}

const changeStarName = async ({
  name,
  userId,
  source,
}: ChangeStarNameParams) => {
  await setStarName(name, userId);

  await triggerEvent(
    "customization",
    {
      starName: name,
    },
    userId,
    source
  );
};

const saveToolResponse = async (
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
  parseToolCall,
  handleToolCalls,
};
