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
const Car_1 = __importDefault(require("../models/Car"));
const generate_otp_1 = require("../helpers/generate-otp");
const User_1 = __importDefault(require("../models/User"));
const car_service_1 = require("../services/car-service");
const token_service_1 = require("../services/token-service");
const router = express_1.default.Router();
// these routes need protection and should be accessed only via our admin tool, whatever it is
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const modelName = req.body.modelName;
        if (!modelName || modelName.trim() === "") {
            return res.status(406).send({ error: "Invalid car model name" });
        }
        const userId = req.body.userId;
        if (!userId || userId.trim() === "") {
            return res.status(406).send({ error: "Invalid user ID" });
        }
        const existingCar = yield Car_1.default.findOne({
            modelName,
            userId,
        });
        if (existingCar !== null) {
            yield Car_1.default.updateOne({
                _id: existingCar._id,
            }, {
                verificationCode: (0, generate_otp_1.generateOtp)(),
                updatedTs: new Date().getTime(),
            });
            return res.status(200).send({ car: existingCar });
        }
        const existingUser = yield User_1.default.findOne({
            _id: userId,
            delTs: null,
        });
        if (!existingUser) {
            return res.status(406).send({ error: "Invalid user ID" });
        }
        const newCar = new Car_1.default({
            modelName,
            userId,
            verificationCode: (0, generate_otp_1.generateOtp)(),
        });
        const car = yield newCar.save();
        res.status(200).send({ car });
    }
    catch (e) {
        console.log(e);
        res.status(500).send({ error: "Server error" });
    }
}));
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const carId = req.query.carId;
        if (!carId) {
            return res.status(402).send({ error: "Invalid car ID" });
        }
        const car = yield (0, car_service_1.getCarById)(carId.toString());
        if (!car) {
            return res.status(402).send({ error: "Invalid car ID" });
        }
        let token = null;
        if (car.verifiedTs) {
            const { userId } = car;
            token = (0, token_service_1.generateAuthToken)(userId);
        }
        res.status(200).send({ car, token });
    }
    catch (e) {
        console.log(e);
        res.status(500).send({ error: "Server error" });
    }
}));
exports.default = router;
