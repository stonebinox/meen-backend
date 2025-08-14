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
exports.setUserKnowledge = exports.setStarLanguage = exports.setStarName = exports.markCarAsVerified = exports.markUserAsVerified = exports.getUserByToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Car_1 = __importDefault(require("../models/Car"));
const getUserByToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const original = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const { id: userId } = original;
        const user = yield User_1.default.findOne({
            _id: userId,
        });
        return user;
    }
    catch (e) {
        return null;
    }
});
exports.getUserByToken = getUserByToken;
const markUserAsVerified = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield User_1.default.updateOne({
        _id: userId,
    }, {
        verified: true,
        updatedTs: new Date().getTime(),
        otp: null,
    });
});
exports.markUserAsVerified = markUserAsVerified;
const markCarAsVerified = (carId) => __awaiter(void 0, void 0, void 0, function* () {
    yield Car_1.default.updateOne({
        _id: carId,
    }, {
        verifiedTs: new Date().getTime(),
        updatedTs: new Date().getTime(),
    });
});
exports.markCarAsVerified = markCarAsVerified;
const setStarName = (starName, userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield User_1.default.updateOne({
        _id: userId,
    }, {
        "starPreferences.name": starName,
    });
});
exports.setStarName = setStarName;
const setStarLanguage = (starLanguage, userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield User_1.default.updateOne({
        _id: userId,
    }, {
        "starPreferences.language": starLanguage,
    });
});
exports.setStarLanguage = setStarLanguage;
const setUserKnowledge = (key, value, userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield User_1.default.updateOne({
        _id: userId,
    }, {
        $set: {
            [`starPreferences.userData.${key}`]: value,
        },
    });
});
exports.setUserKnowledge = setUserKnowledge;
