import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import { z } from "zod";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { generateOtp, sendOtpEmail } from "./emailService";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax"
    }
  };

  app.use(session(sessionSettings));

  // Add login and logout to Request
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.login = (user: User, done: (err: any) => void) => {
      req.session.user = user;
      done(null);
    };
    
    req.logout = (done: (err: any) => void) => {
      req.session.destroy((err) => {
        done(err);
      });
    };
    
    next();
  });

  // Establish isAuthenticated method on Request
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.isAuthenticated = () => {
      return req.session.user != null;
    };
    
    // Provide user object if authenticated
    if (req.session.user) {
      req.user = req.session.user;
    }
    
    next();
  });

  // Set up OTP request endpoint
  app.post("/api/auth/request-otp", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Validate email format
      const emailSchema = z.string().email();
      const validationResult = emailSchema.safeParse(email);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Create OTP code
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await storage.createOtp(email, otp, expiresAt);
      
      // Send email with OTP
      const emailResult = await sendOtpEmail(email, otp);
      
      if (!emailResult.success) {
        return res.status(500).json({ message: "Failed to send OTP email" });
      }
      
      // Return success with ephemeral preview URL for development
      return res.status(200).json({ 
        message: "OTP sent to email",
        previewUrl: process.env.NODE_ENV !== "production" ? emailResult.previewUrl : undefined
      });
    } catch (err) {
      console.error("Error requesting OTP:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Set up OTP verification endpoint
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
      }
      
      // Check if OTP exists and is valid
      const latestOtp = await storage.getLatestOtp(email);
      
      if (!latestOtp) {
        return res.status(400).json({ message: "No valid OTP found for this email" });
      }
      
      if (latestOtp.code !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
      
      if (latestOtp.expiresAt < new Date()) {
        return res.status(400).json({ message: "OTP has expired" });
      }
      
      if (latestOtp.isUsed) {
        return res.status(400).json({ message: "OTP has already been used" });
      }
      
      // Mark OTP as used
      await storage.markOtpAsUsed(latestOtp.id);
      
      // Check if user exists, if not create a new user
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user with email only, profile will be completed later
        user = await storage.createUser({
          email,
          role: "vendor", // Default role
          isProfileComplete: false
        });
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Failed to log in" });
        }
        
        return res.status(200).json(user);
      });
    } catch (err) {
      console.error("Error verifying OTP:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check session status
  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
      return res.status(200).json(req.user);
    } else {
      return res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to log out" });
      }
      
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ message: "Authentication required" });
}

// Middleware to check if user has required role
export function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    return next();
  };
}