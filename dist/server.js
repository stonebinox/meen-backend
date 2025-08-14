"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
dotenv_1.default.config();
// Connect to MongoDB
(0, db_1.default)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Middleware to parse JSON
app.use(express_1.default.json());
app.use("/api/user", require("./routes/user").default);
app.use("/api/car", require("./routes/car").default);
app.use("/api/star-message", require("./routes/star-message").default);
app.use("/api/voice", require("./routes/voice").default);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
