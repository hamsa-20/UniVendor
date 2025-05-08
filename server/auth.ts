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
    rolling: true, // Refresh cookie expiration on activity
    name: 'multivend.sid', // Give a specific name to our session cookie
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days for longer sessions
      sameSite: "lax",
      httpOnly: true,
      path: "/"
    }
  };
  
  // Log session configuration for debugging
  console.log('Setting up auth with session store type:', 
    storage.sessionStore.constructor?.name || 'Unknown store');
  console.log('Cookie settings:', {
    secure: sessionSettings.cookie?.secure,
    maxAge: sessionSettings.cookie?.maxAge,
    sameSite: sessionSettings.cookie?.sameSite
  });

  // Trust first proxy for secure cookies if in production
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(session(sessionSettings));

  // Add login and logout to Request
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.login = (user: User, done: (err: any) => void) => {
      // Store user in session
      req.session.user = user;
      req.session.lastAccess = new Date();
      
      // Save explicitly to ensure cookie is sent back
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
        }
        done(err);
      });
    };
    
    req.logout = (done: (err: any) => void) => {
      // Clear the session and regenerate a new one
      req.session.destroy((err) => {
        done(err);
      });
    };
    
    next();
  });

  // Establish isAuthenticated method on Request with better logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Log request path and session info for debugging (in development only)
    if (process.env.NODE_ENV === 'development' && req.path.startsWith('/api/auth')) {
      console.log(`Auth request to ${req.path}, session exists: ${!!req.session.user}, session ID: ${req.sessionID}`);
    }
    
    req.isAuthenticated = () => {
      const isAuth = req.session.user != null;
      return isAuth;
    };
    
    // Provide user object if authenticated
    if (req.session.user) {
      // If user is impersonating, use the impersonated user but keep original user info
      if (req.session.impersonating && req.session.impersonatedUser) {
        req.user = req.session.impersonatedUser;
        // Add a flag to indicate impersonation mode
        req.user._impersonated = true;
        // Store original user ID for reference
        req.user._impersonatedBy = req.session.user.id;
      } else {
        req.user = req.session.user;
      }
      
      // Update last access time
      req.session.lastAccess = new Date();
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

  // Check session status with improved logging
  app.get("/api/auth/session", (req, res) => {
    // Debug logs for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Session check - Session ID: ${req.sessionID}`);
      console.log(`Session data:`, req.session);
      console.log(`Is authenticated: ${req.isAuthenticated()}`);
    }
    
    if (req.isAuthenticated()) {
      // Ensure the session is kept alive by touching it
      req.session.touch();
      // Update last access time
      req.session.lastAccess = new Date();
      
      // Save the session to ensure cookie expiry is updated
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        return res.status(200).json(req.user);
      });
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

  // Start impersonating a vendor (Admin only)
  app.post("/api/auth/impersonate/:userId", async (req, res) => {
    try {
      // Check if user is authenticated and has admin role
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only administrators can impersonate users" });
      }

      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Fetch the user to be impersonated
      const userToImpersonate = await storage.getUser(userId);
      if (!userToImpersonate) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't allow impersonating another admin
      if (userToImpersonate.role === 'super_admin') {
        return res.status(403).json({ message: "Cannot impersonate another administrator" });
      }

      // Store original user and impersonated user in session
      req.session.impersonating = true;
      req.session.originalUser = req.user;
      req.session.impersonatedUser = userToImpersonate;

      // Save session changes
      req.session.save((err) => {
        if (err) {
          console.error("Session save error during impersonation:", err);
          return res.status(500).json({ message: "Failed to save impersonation state" });
        }

        // Return the impersonated user
        const responseUser = { 
          ...userToImpersonate,
          _impersonated: true,
          _impersonatedBy: req.user.id
        };
        
        return res.status(200).json(responseUser);
      });
    } catch (err) {
      console.error("Error during impersonation:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Stop impersonating and return to original user
  app.post("/api/auth/stop-impersonating", (req, res) => {
    try {
      // Check if user is actually impersonating
      if (!req.session.impersonating || !req.session.originalUser) {
        return res.status(400).json({ message: "You are not currently impersonating anyone" });
      }

      // Restore original user
      const originalUser = req.session.originalUser;
      req.session.impersonating = false;
      req.session.impersonatedUser = null;
      
      // Save session changes
      req.session.save((err) => {
        if (err) {
          console.error("Session save error during stop impersonation:", err);
          return res.status(500).json({ message: "Failed to save session state" });
        }
        
        return res.status(200).json(originalUser);
      });
    } catch (err) {
      console.error("Error stopping impersonation:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
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