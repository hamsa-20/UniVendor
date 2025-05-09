import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import { z } from "zod";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { generateOtp, sendOtpEmail } from "./emailService";

declare global {
  namespace Express {
    interface User extends User {
      originalUserId?: number; // Used for impersonation
    }
    
    interface Session {
      originalUser?: User; // Store the original user when impersonating
    }
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
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days for longer sessions
      sameSite: "lax",
      httpOnly: true,
      path: "/"
    }
  };

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
        // Determine the appropriate role based on request
        const role = req.body.isCustomer ? "customer" : "vendor";
        
        // Create new user with email only, profile will be completed later
        user = await storage.createUser({
          email,
          role,
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
      // Ensure the session is kept alive by touching it
      req.session.touch();
      // Save the session to ensure cookie expiry is updated
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        }
        return res.status(200).json(req.user);
      });
    } else {
      return res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    // Check if user is impersonating someone
    if (req.session.originalUser) {
      // Restore the original user
      const originalUser = req.session.originalUser;
      delete req.session.originalUser;
      
      // Log in as the original user
      req.login(originalUser, (err) => {
        if (err) {
          console.error("Error returning to original user:", err);
          return res.status(500).json({ message: "Failed to return to original account" });
        }
        
        return res.status(200).json({ 
          message: "Returned to original account", 
          user: originalUser,
          impersonationEnded: true
        });
      });
    } else {
      // Normal logout
      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ message: "Failed to log out" });
        }
        
        return res.status(200).json({ message: "Logged out successfully" });
      });
    }
  });
  
  // Start impersonation (Super Admin only)
  app.post("/api/auth/impersonate/:userId", hasRole(["super_admin"]), async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get the target user
      const targetUser = await storage.getUser(parseInt(userId));
      
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Store original user in session
      req.session.originalUser = req.user;
      
      // Add impersonation flags to target user
      const impersonatedUser = {
        ...targetUser,
        originalUserId: req.user.id,
        isImpersonated: true
      };
      
      // Login as the target user
      req.login(impersonatedUser, (err) => {
        if (err) {
          console.error("Impersonation login error:", err);
          return res.status(500).json({ message: "Failed to impersonate user" });
        }
        
        return res.status(200).json({ 
          message: "Impersonation started", 
          user: impersonatedUser,
          impersonationStarted: true
        });
      });
    } catch (error) {
      console.error("Error during impersonation:", error);
      return res.status(500).json({ message: "Failed to impersonate user" });
    }
  });
  
  // Check impersonation status
  app.get("/api/auth/impersonation-status", isAuthenticated, (req, res) => {
    const isImpersonating = Boolean(req.session.originalUser);
    const originalUser = req.session.originalUser || null;
    
    return res.status(200).json({
      isImpersonating,
      originalUser: isImpersonating ? {
        id: originalUser.id,
        email: originalUser.email,
        role: originalUser.role,
        firstName: originalUser.firstName,
        lastName: originalUser.lastName
      } : null
    });
  });
  
  // Traditional user registration endpoint (for vendor creation)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, firstName, lastName, password, role } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Create the user
      const user = await storage.createUser({
        email,
        firstName,
        lastName,
        password,
        role: role || 'vendor',
        isProfileComplete: true
      });
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ message: "User created but failed to log in" });
        }
        
        return res.status(200).json(user);
      });
      
    } catch (err) {
      console.error("Error during user registration:", err);
      return res.status(500).json({ message: "Failed to register user" });
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