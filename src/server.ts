import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db";

dotenv.config();

// Connect to MongoDB
connectDB();

const app: Application = express();
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

app.use("/api/user", require("./routes/user").default);
app.use("/api/car", require("./routes/car").default);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
