import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './src/config/env.js';
import apiRoutes from './src/routes/index.js';
import { swaggerUi, swaggerDocument } from './src/config/swagger.js';
import { apiRateLimiter } from './src/middleware/rateLimiter.middleware.js';
import { errorHandler } from './src/middleware/error.middleware.js';
import { ApiError } from './src/utils/ApiError.js';

const app = express();

// Security Headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.env === 'production' ? config.frontendUrl : true,
    credentials: true,
  })
);

// Body Parsers & Cookie Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global API Rate Limiter
app.use('/api', apiRateLimiter);

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.env,
  });
});

// API Routes
app.use('/api/v1', apiRoutes);

// Handle 404 Routes
app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;