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
import { setStarLanguage, setStarName, setUserKnowledge } from "./user-service";
import { searchMusic } from "./youtube-service";
import { getPlaceSuggestion } from "./google-maps-service";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const getRecentMessages = async (userId: string) => {
  const messages = await StarMessage.find({
    userId,
  })
    .sort({ crtTs: -1 })
    .limit(200);

  if (messages.length > 0) {
    // we need to remove the very first message IF it's a response to a tool call
    const earliestMessage = messages[messages.length - 1];

    if (earliestMessage.content.role === "tool") {
      messages.splice(messages.length - 1, 1);
    }
  }

  return messages;
};

const initConversation = async (
  user: IUser,
  carColor: string,
  source: string
) => {
  const firstMessage = generateInitialStarInstruction(user, carColor);

  const aiMessage: ChatCompletionMessageParam = {
    role: "system",
    content: firstMessage,
  };

  const response: ChatCompletionMessage = await getOpenAIResponse(
    [aiMessage],
    true
  );
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
  messages: ChatCompletionMessageParam[],
  init: boolean = false
): Promise<ChatCompletionMessage> => {
  const response = await openai.chat.completions.create({
    messages,
    model: "gpt-4o-mini",
    tools: init ? [] : tools,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "response",
        description: "Response to user",
        schema: {
          type: "object",
          properties: {
            message: {
              type: "string",
            },
            data: {
              type: "object",
              default: {},
            },
            callback: {
              type: "string",
              default: null,
            },
            speechInstructions: {
              type: "string",
            },
            promptVersion: {
              type: "string",
            },
          },
          required: ["message", "speechInstructions", "promptVersion"],
        },
      },
    },
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
      content: JSON.stringify({
        message: "",
        event: eventName,
        eventData,
        promptVersion: process.env.PROMPT_VERSION,
      }),
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
    case "playMusic":
      const results = await searchMusic(JSON.parse(args).query, userId, source);

      return results;
    case "updateUserKnowledge":
      const { key, value } = JSON.parse(args);
      await updateUserKnowledge({ key, value, userId, source });

      return;
    case "findLocation":
      const { input, location } = JSON.parse(args);
      await triggerEvent("findLocation", { input, location }, userId, source); // we only log this
      const suggestions = await getPlaceSuggestion(input, location);
      await triggerEvent(
        "locationSuggestionsFound",
        { suggestions },
        userId,
        source
      ); // we let the AI read it out to the user first

      return;
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

interface UpdateUserKnowledgeParams {
  key: string;
  value: string;
  userId: string;
  source: string;
}

const updateUserKnowledge = async ({
  key,
  value,
  userId,
  source,
}: UpdateUserKnowledgeParams) => {
  await setUserKnowledge(key, value, userId);

  await triggerEvent(
    "customization",
    {
      [key]: value,
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
