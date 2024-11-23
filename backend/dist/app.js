"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const experienceRoutes_1 = __importDefault(require("./routes/experienceRoutes"));
const educationRoutes_1 = __importDefault(require("./routes/educationRoutes"));
const app = (0, express_1.default)();
const allowedOrigins = [
    'http://localhost:5173', // Local frontend
    'https://personal-site-frontend-navy.vercel.app', // Deployed frontend URL
    'https://personal-site-frontend-kushagras-projects-5d330ca5.vercel.app', // Alternative frontend
    'https://personal-site-frontend-git-main-kushagras-projects-5d330ca5.vercel.app', // Branch frontend
    'https://www.kushagrabharti.com',
    'https://kushagrabharti.com'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.error(`CORS error: Origin ${origin} not allowed`);
            callback(new Error('Not allowed by CORS'));
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
app.use('/api', projectRoutes_1.default);
app.use('/api', experienceRoutes_1.default);
app.use('/api', educationRoutes_1.default);
app.get('/', (req, res) => {
    res.send('Backend server is running!');
});
exports.default = app;
