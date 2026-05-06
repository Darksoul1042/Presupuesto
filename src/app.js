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
const publicPath = path.resolve(__dirname, "../public");
const publicIndexPath = path.join(publicPath, "index.html");

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

if (!isTest) {
  app.use(morgan("combined"));
}

app.use(routes);
app.use("/api", routes);

if (fs.existsSync(publicIndexPath)) {
  app.use(express.static(publicPath));
  app.get("*", (req, res, next) => {
    if (req.method !== "GET" || !req.accepts("html")) {
      return next();
    }

    return res.sendFile(publicIndexPath);
  });
} else {
  app.get("/", (req, res) => {
    res.status(503).type("html").send(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Alloca Presupuesto</title>
          <style>
            body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #f5f7fa; color: #172033; }
            main { width: min(720px, calc(100% - 32px)); border: 1px solid #e4e8ef; border-radius: 8px; background: white; padding: 28px; }
            code { background: #edf0f5; border-radius: 6px; padding: 2px 6px; }
            h1 { color: #0b2c5f; }
          </style>
        </head>
        <body>
          <main>
            <h1>Frontend no compilado</h1>
            <p>La API esta funcionando, pero falta la carpeta <code>public</code>.</p>
            <p>Revisa que exista <code>public/index.html</code>.</p>
          </main>
        </body>
      </html>
    `);
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
