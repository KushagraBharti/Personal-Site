import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

const allowedOrigins = [
  "http://localhost:5173", // Local frontend
  "http://localhost:5174", // Local frontend
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://personal-site-frontend-navy.vercel.app", // Deployed frontend URL
  "https://personal-site-frontend-kushagras-projects-5d330ca5.vercel.app", // Alternative frontend
  "https://personal-site-frontend-git-main-kushagras-projects-5d330ca5.vercel.app", // Branch frontend
  "https://personal-site-orpin-chi-99.vercel.app", // Current API host (self)
  "https://www.kushagrabharti.com",
  "https://kushagrabharti.com",
];

const vercelRegex = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
const localLanRegex =
  /^http:\/\/(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[0-1])\.)[0-9.]+:5173$/i;
const isDev = process.env.NODE_ENV !== "production";
const allowVercelPreviewOrigins =
  process.env.ALLOW_VERCEL_PREVIEW_ORIGINS === "1";

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        isDev ||
        !origin ||
        allowedOrigins.includes(origin) ||
        (allowVercelPreviewOrigins && vercelRegex.test(origin)) ||
        (isDev && localLanRegex.test(origin))
      ) {
        callback(null, true);
      } else {
        console.error(`CORS error: Origin ${origin} not allowed`);
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);

app.use(express.json());

app.use(routes);

app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

app.use(errorHandler);

export default app;
