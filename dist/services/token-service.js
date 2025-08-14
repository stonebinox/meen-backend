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
exports.generateAuthToken = exports.checkAuthToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_service_1 = require("./user-service");
const checkAuthToken = (req) => __awaiter(void 0, void 0, void 0, function* () {
    let token = req.headers.authorization || null;
    if (!token) {
        return null;
    }
    token = token.replace("Bearer", "").trim();
    const user = yield (0, user_service_1.getUserByToken)(token);
    if (!user) {
        return null;
    }
    return user;
});
exports.checkAuthToken = checkAuthToken;
const generateAuthToken = (userId) => {
    const payload = { id: userId, date: new Date().getTime() };
    const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET);
    return token;
};
exports.generateAuthToken = generateAuthToken;
