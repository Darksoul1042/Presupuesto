import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { isTest } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

if (!isTest) {
  app.use(morgan("combined"));
}

app.use(routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
