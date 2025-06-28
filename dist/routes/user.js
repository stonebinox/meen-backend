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
const User_1 = __importDefault(require("../models/User"));
const user_service_1 = require("../services/user-service");
const token_service_1 = require("../services/token-service");
const generate_otp_1 = require("../helpers/generate-otp");
const Car_1 = __importDefault(require("../models/Car"));
const router = express_1.default.Router();
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const phoneNumber = req.body.phoneNumber;
        const existingUser = yield User_1.default.findOne({
            phoneNumber,
            delTs: null,
        });
        if (existingUser !== null) {
            yield User_1.default.updateOne({
                _id: existingUser._id,
            }, {
                otp: (0, generate_otp_1.generateOtp)(),
                updatedTs: new Date().getTime(),
            });
            const token = (0, token_service_1.generateAuthToken)(existingUser._id);
            return res.status(200).send({ token, id: existingUser._id });
        }
        const newUser = new User_1.default({
            fullName: req.body.fullName,
            phoneNumber: req.body.phoneNumber,
            otp: (0, generate_otp_1.generateOtp)(),
        });
        const user = yield newUser.save();
        const token = (0, token_service_1.generateAuthToken)(user._id);
        res.status(200).send({ token, id: user._id });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Server error",
        });
    }
}));
router.post("/verification", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield (0, token_service_1.checkAuthToken)(req);
        if (!user) {
            return res.status(401).send({ error: "Unauthorized" });
        }
        const code = req.body.code;
        if (!code || code.length !== 6) {
            throw new Error("Invalid code");
        }
        const { otp } = user;
        if (otp !== code) {
            return res.status(406).send({ error: "Code mismatch" });
        }
        yield (0, user_service_1.markUserAsVerified)(user._id);
        res.status(200).send({ message: "Verified" });
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ error: "Server error" });
    }
}));
router.get("/car-code", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield (0, token_service_1.checkAuthToken)(req);
        if (!user) {
            return res.status(401).send({ error: "Unauthorized" });
        }
        const car = yield Car_1.default.findOne({
            userId: user._id,
        });
        if (!car) {
            return res.status(400).send({ error: "No car found" });
        }
        res
            .status(200)
            .send({ code: car.verificationCode, carId: car._id });
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ error: "Server error" });
    }
}));
router.post("/car-confirm", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield (0, token_service_1.checkAuthToken)(req);
        if (!user) {
            return res.status(401).send({ error: "Unauthorized" });
        }
        const code = req.body.code;
        const carId = req.body.carId;
        if (!code || code.trim().length !== 6) {
            return res.status(400).send({ error: "Invalid code" });
        }
        if (!carId || carId.trim() === "") {
            return res.status(400).send({ error: "Invalid car ID" });
        }
        const car = yield Car_1.default.findOne({
            _id: carId,
            verificationCode: code,
            userId: user._id,
        });
        if (!car) {
            return res.status(400).send({ error: "No car found" });
        }
        yield (0, user_service_1.markCarAsVerified)(carId);
        res.status(200).send({ car });
    }
    catch (e) {
        console.log(e);
        res.status(500).send({ error: "Server error" });
    }
}));
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield (0, token_service_1.checkAuthToken)(req);
        if (!user) {
            return res.status(400).send({ error: "Unauthorized" });
        }
        return res.status(200).send({ user });
    }
    catch (e) {
        console.log(e);
        res.status(500).send({ error: "Server error" });
    }
}));
exports.default = router;
