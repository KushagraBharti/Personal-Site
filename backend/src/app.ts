import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projectRoutes';
import experienceRoutes from './routes/experienceRoutes';
import educationRoutes from './routes/educationRoutes';

const app = express();
const FRONTPORT = process.env.FRONTPORT || 5173;

app.use(cors({
  origin: `http://localhost:${FRONTPORT}`,
}));
app.use(express.json());

// Routes
app.use('/api', projectRoutes);
app.use('/api', experienceRoutes);
app.use('/api', educationRoutes);

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

export default app;
