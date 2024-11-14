import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projectRoutes';
import experienceRoutes from './routes/experienceRoutes';
import educationRoutes from './routes/educationRoutes';

const app = express();

const allowedOrigins = [
  `http://localhost:${process.env.FRONTPORT || 5173}`,          // Development
  'https://personal-site-frontend-navy.vercel.app/',            // Production
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

app.use(express.json());

// Routes
app.use('/api', projectRoutes);
app.use('/api', experienceRoutes);
app.use('/api', educationRoutes);

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

export default app;
