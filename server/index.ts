import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { domainMiddleware } from "./middleware/domainMiddleware";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import cors from "cors";

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') 
    : ['http://localhost:5000', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add domain routing middleware
app.use(domainMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ 
    server,
    path: "/v2",
    // Enable CORS for WebSocket
    verifyClient: (info, callback) => {
      const origin = info.origin || info.req.headers.origin;
      const allowedOrigins = process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',')
        : ['http://localhost:5000', 'http://localhost:3000'];
      
      if (!origin || allowedOrigins?.includes(origin)) {
        callback(true);
      } else {
        callback(false, 403, 'Forbidden');
      }
    }
  });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected from:', req.socket.remoteAddress);
    
    ws.on('message', (message) => {
      console.log('Received:', message.toString());
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`Error: ${err.stack || err.message || err}`);
    res.status(status).json({ message });
  });

  // Setup Vite in development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server
  const startServer = (port: number) => {
    server.listen(port, () => {
      log(`Server running on port ${port}`);
      log(`WebSocket server available at ws://localhost:${port}/v2`);
    }).on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        log(`Port ${port} is in use, trying port ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error("Server error:", err);
      }
    });
  };
  
  startServer(5000);
})();
