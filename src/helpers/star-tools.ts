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
      description: `Call this function to search for a place of interest when the user provides a destination or location they want to drive to. The user may provide their input in various formats, such as an address, business name, or general location. Add additional context like city names or other relevant details to improve the search results in the "location" parameter. Your response will be used by Google Maps Autocomplete API to grab a list of possible suggestions within a given radius based on user input and base location. You will receive the response from Google's API via a user event called "locationSuggestionsFound" which you can use to let the user know the suggestions. If suggestions are found, only mention the localities and not the exact addresses. If no suggestions are found, you can inform the user accordingly.`,
      parameters: {
        type: "object",
        properties: {
          input: {
            type: "string",
            description: "The destination you think the user wants to go to.",
          },
          location: {
            type: "string",
            description: `Coordinates of their current location in "latitude,longitude" format. This information is present in "userContext" property of the most recent user message. This needs to be coordinates ONLY.`,
          },
        },
        additionalProperties: false,
        required: ["input", "location"],
      },
    },
  },
];
