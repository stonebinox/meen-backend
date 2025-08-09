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
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMusic = void 0;
const googleapis_1 = require("googleapis");
const star_message_service_1 = require("./star-message-service");
const createYoutubeService = () => {
    return googleapis_1.google.youtube({
        version: "v3",
        auth: process.env.GOOGLE_API_KEY,
    });
};
const searchMusic = (query, userId, source) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const youtube = createYoutubeService();
    const response = yield youtube.search.list({
        part: ["snippet"],
        q: query,
        type: ["video"],
    });
    yield (0, star_message_service_1.triggerEvent)("playMusic", ((_a = response.data.items) === null || _a === void 0 ? void 0 : _a[0]) || null, userId, source);
    return response.data.items;
});
exports.searchMusic = searchMusic;
