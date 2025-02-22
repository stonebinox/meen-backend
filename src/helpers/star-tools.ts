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
  {
    type: "function",
    function: {
      name: "changeStarLanguage",
      description:
        "To change Star's default language of communication. Call this when the user wants to speak to Star in a different language",
      parameters: {
        type: "object",
        properties: {
          language: {
            type: "string",
            description: "The language configuration the user wants",
            enum: [
              "en-US",
              "en-IN",
              "en-GB",
              "en-AU",
              "kn-IN",
              "ml-IN",
              "mr-IN",
              "hi-IN",
              "ta-IN",
              "te-IN",
              "es-ES",
              "it-IT",
              "fr-FR",
              "de-DE",
              "ar-AE",
            ],
          },
        },
        additionalProperties: false,
        required: ["language"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "playMusic",
      description: "To search for music on YouTube and play it",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The query to search for",
          },
        },
        additionalProperties: false,
        required: ["query"],
      },
    },
  },
];
