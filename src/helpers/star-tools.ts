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
      description:
        "To search for music and play it. The video is not visible to the user while the audio is playing. Do not mention the source of the music in the response.",
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
  {
    type: "function",
    function: {
      name: "updateUserKnowledge",
      description:
        "Call this function whenever the user shares new personal information, preferences, or habits. This helps maintain an evolving profile of the user over time. You can track details about their interests, lifestyle, routines, preferences (e.g., favorite music, food, movies, books), and general patterns. Avoid calling this function for temporary or one-time details unless they are part of a recurring trend. Do not explicitly tell the user every time you save something unless relevant to the conversation.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description:
              "The category or aspect of the user’s profile to update (e.g., 'favoriteMusic', 'dietaryPreference', 'commuteHabit').",
          },
          value: {
            type: "string",
            description:
              "The specific information to store (e.g., 'jazz', 'vegetarian', 'prefers biking').",
          },
        },
        additionalProperties: false,
        required: ["key", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "findLocation",
      description:
        "Call this function to search for a location when the user provides a destination or location they want to drive to. This location will be used by the client-side code to find available routes. If you can predict the exact name of the location, you can use it directly. Otherwise, you can use the provided location as a search query to find the best match. You can also ask follow-up questions to confirm the location. The user may provide the destination in various formats, such as an address, business name, or general location.",
      parameters: {
        type: "object",
        properties: {
          destination: {
            type: "string",
            description: "The destination the user wants to go to",
          },
        },
        additionalProperties: false,
        required: ["destination"],
      },
    },
  },
];
