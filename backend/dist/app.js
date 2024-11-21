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
    'http://localhost:5173', // Local development frontend
    'https://personal-site-frontend-navy.vercel.app' // Replace with your deployed frontend URL
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
}));
app.use(express_1.default.json());
// Routes
app.use('/api', projectRoutes_1.default);
app.use('/api', experienceRoutes_1.default);
app.use('/api', educationRoutes_1.default);
app.get('/', (req, res) => {
    res.send('Backend server is running!');
});
exports.default = app;
