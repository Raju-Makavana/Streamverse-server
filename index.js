import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import connectDatabase from "./database/db.js";
import routes from './routes/index.js';
import errorMiddleware from './utils/globalErrorHandler.js';
import asyncErrorHandler from "./utils/asyncErrorHandler.js";
import router from "./routes/index.js";
import morgan from "morgan";
import getEnvConfig from "./config/envConfig.js";
import helmet from "helmet";
import limiter from "./middleware/rateLimiter.js";
import sessionHandler from "./config/sessionConfig.js";
import logger from "./utils/logger.js";
import { fileURLToPath } from 'url';
import { upload, setupMediaRoutes } from "./middleware/uploadMiddleware.js";
import path from 'path';
import { streamVideo } from "./controller/media/mediaProvideController.js";
// import mediaUploadRouter from 

const morganFormat = ":method :url :status :response-time ms";
// Create an Express application
const app = express();  
// Set up __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 5001;

// set API rateLimiter
app.use('/api', limiter);

// Use Helmet for security
app.use(helmet({
  hidePoweredBy: true,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "https://stackpath.bootstrapcdn.com"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:", getEnvConfig.get('backendURI')], 
      
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Add this line
  crossOriginEmbedderPolicy: false, // Add this line
  xssFilter: true,
}));

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Setup logger
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

//CORS setup
app.use(
  cors({
    origin: [getEnvConfig.get('frontendURL'),getEnvConfig.get('adminFrontendURL')],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'authtoken'],
    exposedHeaders: ['set-cookie'],
  })
);

// Apply session middleware
app.use(sessionHandler);

// Routes
app.use('/api/v1', router);
setupMediaRoutes(app);

// Test Route
app.get(
  '/',
  asyncErrorHandler(async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  })
);

// Start the server and listen for incoming requests on the specified port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// error handler
app.use(errorMiddleware);