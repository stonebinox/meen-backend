"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleToolCalls = exports.parseToolCall = exports.triggerEvent = exports.getOpenAIResponse = exports.initConversation = exports.getRecentMessages = void 0;
const openai_1 = __importDefault(require("openai"));
const generate_initial_star_instruction_1 = require("../helpers/generate-initial-star-instruction");
const StarMessage_1 = __importDefault(require("../models/StarMessage"));
const star_tools_1 = require("../helpers/star-tools");
const user_service_1 = require("./user-service");
const youtube_service_1 = require("./youtube-service");
const google_maps_service_1 = require("./google-maps-service");
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_KEY,
});
const getRecentMessages = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = yield StarMessage_1.default.find({
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
});
exports.getRecentMessages = getRecentMessages;
const initConversation = (user, carColor, source) => __awaiter(void 0, void 0, void 0, function* () {
    const firstMessage = yield (0, generate_initial_star_instruction_1.generateInitialStarInstruction)(user, carColor);
    const aiMessage = {
        role: "system",
        content: firstMessage,
    };
    const response = yield getOpenAIResponse([aiMessage], true);
    const starMessage = new StarMessage_1.default({
        content: aiMessage,
        userId: user.id,
        source,
    });
    yield starMessage.save();
    const starResponse = new StarMessage_1.default({
        content: response,
        userId: user.id,
        source,
    });
    yield starResponse.save();
});
exports.initConversation = initConversation;
const getOpenAIResponse = (messages_1, ...args_1) => __awaiter(void 0, [messages_1, ...args_1], void 0, function* (messages, init = false) {
    const response = yield openai.chat.completions.create({
        messages,
        model: "gpt-4o-mini",
        tools: init ? [] : star_tools_1.tools,
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
});
exports.getOpenAIResponse = getOpenAIResponse;
const triggerEvent = (eventName, eventData, userId, source) => __awaiter(void 0, void 0, void 0, function* () {
    const appTriggerEventMessage = new StarMessage_1.default({
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
    yield appTriggerEventMessage.save();
    return;
});
exports.triggerEvent = triggerEvent;
const handleToolCalls = (toolCalls, userId, source) => __awaiter(void 0, void 0, void 0, function* () {
    for (let i = 0; i < toolCalls.length; i++) {
        const tool = toolCalls[i];
        const { function: { arguments: args }, id: toolId, } = tool;
        yield saveToolResponse(toolId, JSON.parse(args), userId, source);
    }
});
exports.handleToolCalls = handleToolCalls;
const parseToolCall = (toolCall, userId, source) => __awaiter(void 0, void 0, void 0, function* () {
    const { function: { arguments: args, name }, } = toolCall;
    switch (name) {
        case "changeStarName":
            const parsedArgs = JSON.parse(args);
            yield changeStarName(Object.assign(Object.assign({}, parsedArgs), { userId,
                source }));
            break;
        case "changeStarLanguage":
            yield changeStarLanguage(Object.assign(Object.assign({}, JSON.parse(args)), { userId,
                source }));
            break;
        case "playMusic":
            const results = yield (0, youtube_service_1.searchMusic)(JSON.parse(args).query, userId, source);
            return results;
        case "updateUserKnowledge":
            const { key, value } = JSON.parse(args);
            yield updateUserKnowledge({ key, value, userId, source });
            return;
        case "findLocation":
            const { input, location } = JSON.parse(args);
            yield triggerEvent("findLocation", { input, location }, userId, source); // we only log this
            const suggestions = yield (0, google_maps_service_1.getPlaceSuggestion)(input, location);
            yield triggerEvent("locationSuggestionsFound", { suggestions }, userId, source); // we let the AI read it out to the user first
            return;
    }
});
exports.parseToolCall = parseToolCall;
const changeStarLanguage = (_a) => __awaiter(void 0, [_a], void 0, function* ({ language, userId, source, }) {
    yield (0, user_service_1.setStarLanguage)(language, userId);
    yield triggerEvent("customization", {
        starLanguage: language,
    }, userId, source);
});
const changeStarName = (_b) => __awaiter(void 0, [_b], void 0, function* ({ name, userId, source, }) {
    yield (0, user_service_1.setStarName)(name, userId);
    yield triggerEvent("customization", {
        starName: name,
    }, userId, source);
});
const updateUserKnowledge = (_c) => __awaiter(void 0, [_c], void 0, function* ({ key, value, userId, source, }) {
    yield (0, user_service_1.setUserKnowledge)(key, value, userId);
    yield triggerEvent("customization", {
        [key]: value,
    }, userId, source);
});
const saveToolResponse = (toolId, content, userId, source) => __awaiter(void 0, void 0, void 0, function* () {
    const toolResponse = new StarMessage_1.default({
        content: {
            role: "tool",
            content: JSON.stringify(content),
            tool_call_id: toolId,
        },
        userId,
        source,
    });
    yield toolResponse.save();
});
