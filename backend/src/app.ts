import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projectRoutes';
import experienceRoutes from './routes/experienceRoutes';
import educationRoutes from './routes/educationRoutes';

const app = express();

const allowedOrigins = [
  'http://localhost:5173', // Local frontend
  'https://personal-site-frontend-navy.vercel.app', // Correct deployed frontend URL
];

/*
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
*/

app.use(
  cors({
    origin: '*',
  })
);


app.use(express.json());

app.use((req, res, next) => {
  console.log(`Origin: ${req.headers.origin}`);
  next();
});

// Routes
app.use('/api', projectRoutes);
app.use('/api', experienceRoutes);
app.use('/api', educationRoutes);

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

export default app;
