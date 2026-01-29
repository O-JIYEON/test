import express from 'express';
import corsMiddleware from './middlewares/cors.js';
import healthRouter from './routes/health/index.js';
import overviewRouter from './routes/overview/index.js';
import customersRouter from './routes/customers/index.js';
import customerContactsRouter from './routes/customerContacts/index.js';
import lookupCategoriesRouter from './routes/lookupCategories/index.js';
import lookupValuesRouter from './routes/lookupValues/index.js';
import activityLogsRouter from './routes/activityLogs/index.js';
import goalsRouter from './routes/goals/index.js';
import dealsRouter from './routes/deals/index.js';
import leadsRouter from './routes/leads/index.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(corsMiddleware);

app.use('/health', healthRouter);
app.use('/api/overview', overviewRouter);
app.use('/api/customers', customersRouter);
app.use('/api/customer-contacts', customerContactsRouter);
app.use('/api/lookup-categories', lookupCategoriesRouter);
app.use('/api/lookup-values', lookupValuesRouter);
app.use('/api/activity-logs', activityLogsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/leads', leadsRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Customers management backend listening on port ${PORT}`);
});
