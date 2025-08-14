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
exports.getVoice = exports.getVoices = exports.addVoice = void 0;
const Voice_1 = __importDefault(require("../models/Voice"));
const addVoice = (voice) => __awaiter(void 0, void 0, void 0, function* () {
    const newVoice = new Voice_1.default(voice);
    yield newVoice.save();
    return newVoice;
});
exports.addVoice = addVoice;
const getVoices = () => __awaiter(void 0, void 0, void 0, function* () {
    const voices = yield Voice_1.default.find({ delTs: null }).sort({ crtTs: -1 });
    return voices;
});
exports.getVoices = getVoices;
const getVoice = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const voice = yield Voice_1.default.findOne({ _id: id, delTs: null });
    if (!voice) {
        throw new Error("Voice not found");
    }
    return voice;
});
exports.getVoice = getVoice;
