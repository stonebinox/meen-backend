import { ChatCompletionTool } from "openai/resources";

export const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "changeStarName",
      description:
        "To change Star's default name. Call this when the user wants to rename Star",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name the user wants",
          },
        },
        additionalProperties: false,
        required: ["name"],
      },
    },
  },
];
