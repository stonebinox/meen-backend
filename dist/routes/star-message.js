"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const token_service_1 = require("../services/token-service");
const StarMessage_1 = __importDefault(require("../models/StarMessage"));
const star_message_service_1 = require("../services/star-message-service");
const car_service_1 = require("../services/car-service");
const generate_initial_star_instruction_1 = require("../helpers/generate-initial-star-instruction");
const router = express_1.default.Router();
router.post("/add", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
      const user = yield (0, token_service_1.checkAuthToken)(req);
      if (!user) {
        return res.status(401).send({ error: "Unauthorized" });
      }
      const userMessage = req.body.message;
      if (!userMessage || userMessage.trim() === "") {
        return res.status(400).send({ error: "Invalid message" });
      }
      const source = req.body.sourceId;
      if (!source) {
        return res.status(400).send({ error: "Invalid source" });
      }
      let car = null;
      if (
        req.body.event &&
        ((_a = req.body.event) === null || _a === void 0
          ? void 0
          : _a.trim()) !== "" &&
        req.body.event !== "user"
      ) {
        yield (0, star_message_service_1.triggerEvent)(
          req.body.event,
          {
            data: userMessage,
          },
          user.id,
          source
        );
      } else {
        if (source !== "app") {
          car = yield (0, car_service_1.getCarById)(source);
          if (!car) {
            return res.status(400).send({ error: "Invalid source" });
          }
        }
        // add an else condition to detect the latest car driven by the user
        // it's going to be unknown if the source is "app"
        const recentMessages = yield (0,
        star_message_service_1.getRecentMessages)(user.id);
        if (recentMessages.length === 0) {
          yield (0, star_message_service_1.initConversation)(
            user,
            (car === null || car === void 0 ? void 0 : car.color) || "Unknown",
            source
          );
        }
        const userContext = req.body.context || {};
        const newStarMessage = new StarMessage_1.default({
          content: {
            role: "user",
            content: JSON.stringify({
              message: userMessage,
              event: "user",
              userContext,
              promptVersion: process.env.PROMPT_VERSION,
            }),
          },
          userId: user.id,
          source,
        });
        yield newStarMessage.save();
      }
      const freshMessages = yield (0, star_message_service_1.getRecentMessages)(
        user.id
      );
      const parsedMessages = freshMessages.map((message) => message.content);
      if (user.starPreferences) {
        const starPreferenceMessage = {
          role: "user",
          content: JSON.stringify({
            message: "",
            event: "customization",
            eventData: user.starPreferences,
            promptVersion: process.env.PROMPT_VERSION,
          }),
        };
        parsedMessages.push(starPreferenceMessage);
      }
      const systemMessageContent = yield (0,
      generate_initial_star_instruction_1.generateInitialStarInstruction)(
        user,
        (car === null || car === void 0 ? void 0 : car.color) || "Unknown"
      );
      const systemMessage = {
        role: "system",
        content: systemMessageContent,
      };
      parsedMessages.push(systemMessage);
      const reversedMessages = parsedMessages.reverse();
      const openResponse = yield (0, star_message_service_1.getOpenAIResponse)(
        reversedMessages
      );
      const toolCall = openResponse.tool_calls;
      const starResponse = new StarMessage_1.default({
        content: openResponse,
        userId: user.id,
        source,
      });
      const newResponse = yield starResponse.save();
      let toolResponse = null;
      if (toolCall) {
        yield (0, star_message_service_1.handleToolCalls)(
          toolCall,
          user.id,
          source
        );
        for (let i = 0; i < toolCall.length; i++) {
          const tool = toolCall[i];
          toolResponse = yield (0, star_message_service_1.parseToolCall)(
            tool,
            user.id,
            source
          );
        }
        const messages = yield (0, star_message_service_1.getRecentMessages)(
          user.id
        );
        const reversed = messages.reverse();
        const response = yield (0, star_message_service_1.getOpenAIResponse)(
          reversed.map((message) => message.content)
        );
        const starResponseMessage = new StarMessage_1.default({
          content: response,
          userId: user.id,
          source,
        });
        const starResponse = yield starResponseMessage.save();
        return res.status(200).send({
          message: starResponse,
          toolResponse,
        });
      }
      return res.status(200).send({
        message: newResponse,
      });
    } catch (e) {
      console.log(e);
      res.status(500).send({ error: "Server error" });
    }
  })
);

router.post("/init", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const user = yield (0, token_service_1.checkAuthToken)(req);
      if (!user) {
        return res.status(401).send({ error: "Unauthorized" });
      }
      const source = req.body.sourceId;
      if (!source) {
        return res.status(400).send({ error: "Invalid source" });
      }
      let car = null;
      if (source !== "app") {
        car = yield (0, car_service_1.getCarById)(source);
        if (!car) {
          return res.status(400).send({ error: "Invalid source" });
        }
      }
      // add an else condition to detect the latest car driven by the user
      // it's going to be unknown if the source is "app"
      let recentMessages = yield (0, star_message_service_1.getRecentMessages)(
        user.id
      );
      if (recentMessages.length !== 0) {
        if (recentMessages[0].content.tool_calls) {
          yield (0, star_message_service_1.handleToolCalls)(
            recentMessages[0].content.tool_calls,
            user.id,
            source
          );
          for (
            let i = 0;
            i < recentMessages[0].content.tool_calls.length;
            i++
          ) {
            const tool = recentMessages[0].content.tool_calls[i];
            yield (0, star_message_service_1.parseToolCall)(
              tool,
              user.id,
              source
            );
          }
        }
        yield (0, star_message_service_1.triggerEvent)(
          "app",
          {
            userDetected: true,
            description:
              "This means that the car has detected the user and the auxillary battery systems have been powered on along with the OS. You can use this as a cue to initiate conversation with the user.",
          },
          user.id,
          source
        );
        recentMessages = yield (0, star_message_service_1.getRecentMessages)(
          user.id
        );
        const reversed = recentMessages.reverse();
        const response = yield (0, star_message_service_1.getOpenAIResponse)(
          reversed.map((message) => message.content)
        );
        const starResponseMessage = new StarMessage_1.default({
          content: response,
          userId: user.id,
          source,
        });
        const starResponse = yield starResponseMessage.save();
        return res.status(200).send({ message: starResponse });
      }
      yield (0,
      star_message_service_1.initConversation)(user, (car === null || car === void 0 ? void 0 : car.color) || "Unknown", source);
      recentMessages = yield (0, star_message_service_1.getRecentMessages)(
        user.id
      );
      return res.status(200).send({ message: recentMessages[0] });
    } catch (e) {
      console.log(e);
      res.status(500).send({ error: "Server error" });
    }
  })
);

exports.default = router;
