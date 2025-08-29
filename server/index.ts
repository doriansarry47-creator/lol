import 'dotenv/config'
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import memorystore from "memorystore";
import cors from "cors";
import { createServer } from "http";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";

const app = express();
const server = createServer(app);

app.use(
  cors({
    origin: true, // Reflects the request origin
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (app.get("env") === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in production");
}

const MemoryStore = memorystore(session);
app.use(
  session({
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      // secure: app.get("env") === "production",
      // httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  }),
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Register API routes
registerRoutes(app);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(err);
  res.status(status).json({ message });
});

if (process.env.NODE_ENV === "development") {
  setupVite(app, server);
} else {
  // Static file serving for production
  serveStatic(app);
}

const port = process.env.PORT || 3000;
server.listen(port, () => {
  log(`Server listening on port ${port}`);
});


export default app;
