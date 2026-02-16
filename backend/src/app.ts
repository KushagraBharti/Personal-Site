import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174", // Local frontend MORE RANDOM EDITS
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://personal-site-frontend-navy.vercel.app", // Deployed frontend URL
  "https://personal-site-frontend-kushagras-projects-5d330ca5.vercel.app", // Alternative frontend
  "https://personal-site-frontend-git-main-kushagras-projects-5d330ca5.vercel.app", // Branch frontend
  "https://personal-site-orpin-chi-99.vercel.app", // Current API host (self)
  "https://www.kushagrabharti.com",
  "https://kushagrabharti.com",
];

// More useless edits HAHAHAHHA

const vercelRegex = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
const localLanRegex = /^http:\/\/(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[0-1])\.)[0-9.]+:5173$/i;
const isDev = process.env.NODE_ENV !== "production";

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        isDev ||
        !origin ||
        allowedOrigins.includes(origin) ||
        vercelRegex.test(origin) ||
        localLanRegex.test(origin)
      ) {
        callback(null, true);
      } else {
        console.error(`CORS error: Origin ${origin} not allowed`);
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

/*
app.use(
  cors({
    origin: '*',
  })
);
*/

app.use(express.json());

/*
app.use((req, res, next) => {
  console.log(`Request Origin: ${req.headers.origin}`);
  console.log(`Request Path: ${req.path}`);
  console.log(`Request Method: ${req.method}`);
  next();
});
*/

// Routes
app.use(routes);


app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.use(errorHandler);

export default app;
