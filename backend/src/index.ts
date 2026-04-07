import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth";
import eligibilityRoutes from "./routes/eligibility";
import commitmentRoutes from "./routes/commitments";
import claimRoutes from "./routes/claim";
import distributionRoutes from "./routes/distributions";
import roundRoutes from "./routes/rounds";
import campaignRoutes from "./routes/campaigns";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

const PORT = Number(process.env.PORT) || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Hello from backend!");
});

app.use("/auth", authRoutes);
app.use("/eligibility", eligibilityRoutes);
app.use("/commitments", commitmentRoutes);
app.use("/claim", claimRoutes);
app.use("/distributions", distributionRoutes);
app.use("/rounds", roundRoutes);
app.use("/campaigns", campaignRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
