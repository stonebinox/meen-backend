import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db";

dotenv.config();

// Connect to MongoDB
connectDB();

const app: Application = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Middleware to parse JSON
app.use(express.json());

app.use("/api/user", require("./routes/user").default);
app.use("/api/car", require("./routes/car").default);
app.use("/api/star-message", require("./routes/star-message").default);
app.use("/api/voice", require("./routes/voice").default);

app.get("/healthcheck", (req, res) => {
  res.status(200).json({ status: "ok", message: "Service is healthy" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
