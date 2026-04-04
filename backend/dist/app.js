"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const allowedOrigins = [
    "http://localhost:5173",
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
const localLanRegex = /^http:\/\/(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[0-1])\.)[0-9.]+:5173$/i;
const isDev = process.env.NODE_ENV !== "production";
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (isDev ||
            !origin ||
            allowedOrigins.includes(origin) ||
            vercelRegex.test(origin) ||
            localLanRegex.test(origin)) {
            callback(null, true);
        }
        else {
            console.error(`CORS error: Origin ${origin} not allowed`);
            callback(new Error("Not allowed by CORS"));
        }
    },
}));
/*
app.use(
  cors({
    origin: '*',
  })
);
*/
app.use(express_1.default.json());
/*
app.use((req, res, next) => {
  console.log(`Request Origin: ${req.headers.origin}`);
  console.log(`Request Path: ${req.path}`);
  console.log(`Request Method: ${req.method}`);
  next();
});
*/
// Routes
app.use(routes_1.default);
app.get('/', (req, res) => {
    res.send('Backend server is running!');
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
