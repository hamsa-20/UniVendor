import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { generateOtp, sendOtpEmail } from "./emailService";
import { User, InsertUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "multivend-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      secure: process.env.NODE_ENV === "production"
    }
  };

  app.use(session(sessionSettings));

  // Middleware to enhance req object with authentication helpers
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Add login method
    req.login = (user: User, done: (err: any) => void) => {
      req.session.user = user;
      done(null);
    };

    // Add logout method
    req.logout = (done: (err: any) => void) => {
      req.session.destroy((err) => {
        done(err);
      });
    };

    // Add isAuthenticated method
    req.isAuthenticated = () => {
      return Boolean(req.session.user);
    };

    // Add user property
    if (req.session.user) {
      req.user = req.session.user;
    }

    next();
  });

  // Authentication endpoints
  app.post("/api/auth/request-otp", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Generate OTP code
      const otpCode = generateOtp();
      
      // Set expiration time (10 minutes from now)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      // Save OTP in database
      await storage.createOtp(email, otpCode, expiresAt);
      
      // Send OTP via email
      const emailResult = await sendOtpEmail(email, otpCode);
      
      if (!emailResult.success) {
        return res.status(500).json({ 
          message: "Failed to send verification email"
        });
      }

      // Return email info (in development, include preview URL)
      res.status(200).json({ 
        message: "Verification code sent",
        expiresAt,
        previewUrl: process.env.NODE_ENV !== "production" ? emailResult.previewUrl : undefined
      });
    } catch (err) {
      console.error("Error sending OTP:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ message: "Email and verification code are required" });
      }

      // Get the latest OTP for this email
      const latestOtp = await storage.getLatestOtp(email);
      
      if (!latestOtp) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }
      
      // Check if OTP is valid
      if (latestOtp.code !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      
      // Check if OTP is expired
      if (latestOtp.expiresAt < new Date()) {
        return res.status(400).json({ message: "Verification code has expired" });
      }
      
      // Check if OTP has been used
      if (latestOtp.isUsed) {
        return res.status(400).json({ message: "Verification code has already been used" });
      }
      
      // Mark OTP as used
      await storage.markOtpAsUsed(latestOtp.id);
      
      // Check if user exists
      let user = await storage.getUserByEmail(email);
      let isNewUser = false;
      
      if (!user) {
        // Create a new user with just the email
        user = await storage.createUser({ 
          email, 
          role: "vendor",
          isProfileComplete: false
        });
        isNewUser = true;
      }
      
      // Login the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to log in" });
        }
        
        res.status(200).json({ 
          user, 
          isNewUser
        });
      });
    } catch (err) {
      console.error("Error verifying OTP:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/complete-profile", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { firstName, lastName, phone } = req.body;
      
      if (!firstName || !lastName) {
        return res.status(400).json({ 
          message: "First name and last name are required" 
        });
      }
      
      // Update user profile
      const updatedUser = await storage.updateUser(req.user.id, {
        firstName,
        lastName,
        phone,
        isProfileComplete: true
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update session with new user data
      req.session.user = updatedUser;
      
      res.status(200).json({ user: updatedUser });
    } catch (err) {
      console.error("Error completing profile:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });
}

// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (roles.includes(req.user.role)) {
      return next();
    }
    
    res.status(403).json({ message: "Forbidden" });
  };
}