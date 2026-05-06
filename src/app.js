import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import helmet from "helmet";
import morgan from "morgan";
import { isTest } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../frontend/dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

if (!isTest) {
  app.use(morgan("combined"));
}

app.use(routes);

if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      return next();
    }

    return res.sendFile(frontendIndexPath);
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
