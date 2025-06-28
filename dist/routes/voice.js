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
const express_1 = __importDefault(require("express"));
const voice_service_1 = require("../services/voice-service");
const router = express_1.default.Router();
router.post("/add", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const voicePayload = req.body;
        if (!voicePayload ||
            ((_a = voicePayload.name) === null || _a === void 0 ? void 0 : _a.trim()) === "" ||
            ((_b = voicePayload.description) === null || _b === void 0 ? void 0 : _b.trim()) === "") {
            return res.status(400).send({ error: "Invalid voice message data" });
        }
        const newVoice = yield (0, voice_service_1.addVoice)(voicePayload);
        res.status(200).send({ message: newVoice });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ error: "Server error" });
    }
}));
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const voices = yield (0, voice_service_1.getVoices)();
        res.status(200).send({ voices });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ error: "Server error" });
    }
}));
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const voiceId = req.params.id;
        if (!voiceId || voiceId.trim() === "") {
            return res.status(400).send({ error: "Invalid voice ID" });
        }
        const voice = yield (0, voice_service_1.getVoice)(voiceId);
        if (!voice) {
            return res.status(404).send({ error: "Voice not found" });
        }
        res.status(200).send({ voice });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ error: "Server error" });
    }
}));
exports.default = router;
