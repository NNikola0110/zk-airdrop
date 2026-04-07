import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.get("/", (_req, res) => {
  res.send("Hello from backend!");
});

app.get("/eligibility/me", (_req, res) => {
  res.json({
    githubLogin: "test_user",
    repo: "owner/repo",
    isContributor: true,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});