import express from "express";
import cors from "cors";
import { createChatHandler } from "chat-nest-server";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, ".env") });

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
}));

app.use(express.json());

app.post(
  "/api/chat",
  createChatHandler({
    apiKey: process.env.OPENAI_API_KEY!,
  })
);

app.listen(3001, () => {
  console.log("API running at http://localhost:3001");
});
