import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { AuthService, requireAuth, requireAdmin } from "./auth.js";
import { insertCravingEntrySchema, insertExerciseSessionSchema, insertBeckAnalysisSchema, insertUserSchema, insertExerciseSchema, insertPsychoEducationContentSchema } from "../shared/schema.js";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Routes d'authentification
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
      }

      const user = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        role,
      });

      req.session.user = user;
      res.json({ user, message: "Inscription réussie" });
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erreur lors de l'inscription" 
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
      }

      const user = await AuthService.login(email, password);
      req.session.user = user;
      res.json({ user, message: "Connexion réussie" });
    } catch (error) {
      res.status(401).json({ 
        message: error instanceof Error ? error.message : "Erreur de connexion" 
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erreur lors de la déconnexion" });
      }
      res.json({ message: "Déconnexion réussie" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ message: "Session non valide" });
      }
      const user = await AuthService.getUserById(req.session.user.id);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du profil" });
    }
  });

  // Routes pour les exercices (admin seulement pour création/modification)
  app.get("/api/exercises", async (req, res) => {
    try {
      const exercises = await storage.getExercises();
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des exercices" });
    }
  });

  app.post("/api/exercises", requireAdmin, async (req, res) => {
    try {
      const data = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise(data);
      res.json(exercise);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Validation échouée" });
    }
  });

  // Routes pour le contenu psychoéducatif
  app.get("/api/psycho-education", async (req, res) => {
    try {
      const content = await storage.getPsychoEducationContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du contenu" });
    }
  });

  app.post("/api/psycho-education", requireAdmin, async (req, res) => {
    try {
      const data = insertPsychoEducationContentSchema.parse(req.body);
      const content = await storage.createPsychoEducationContent(data);
      res.json(content);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Validation échouée" });
    }
  });
  
  // Craving entries routes
  app.post("/api/cravings", requireAuth, async (req, res) => {
    try {
      if (!req.session || !req.session.user) return res.status(401).json({ message: "Session non valide" });
      const data = insertCravingEntrySchema.parse({
        ...req.body,
        userId: req.session.user.id
      });
      const entry = await storage.createCravingEntry(data);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Validation failed" });
    }
  });

  app.get("/api/cravings", requireAuth, async (req, res) => {
    try {
      if (!req.session || !req.session.user) return res.status(401).json({ message: "Session non valide" });
      const userId = req.session.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const entries = await storage.getCravingEntries(userId, limit);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch craving entries" });
    }
  });

  app.get("/api/cravings/stats", requireAuth, async (req, res) => {
    try {
      if (!req.session || !req.session.user) return res.status(401).json({ message: "Session non valide" });
      const userId = req.session.user.id;
      const days = req.query.days ? parseInt(req.query.days as string) : undefined;
      const stats = await storage.getCravingStats(userId, days);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch craving stats" });
    }
  });

  // Exercise sessions routes
  app.post("/api/exercise-sessions", requireAuth, async (req, res) => {
    try {
      if (!req.session || !req.session.user) return res.status(401).json({ message: "Session non valide" });
      const data = insertExerciseSessionSchema.parse({
        ...req.body,
        userId: req.session.user.id
      });
      const session = await storage.createExerciseSession(data);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Validation failed" });
    }
  });

  app.get("/api/exercise-sessions", requireAuth, async (req, res) => {
    try {
      if (!req.session || !req.session.user) return res.status(401).json({ message: "Session non valide" });
      const userId = req.session.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const sessions = await storage.getExerciseSessions(userId, limit);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise sessions" });
    }
  });

  // Beck analysis routes
  app.post("/api/beck-analyses", requireAuth, async (req, res) => {
    try {
      if (!req.session || !req.session.user) return res.status(401).json({ message: "Session non valide" });
      const data = insertBeckAnalysisSchema.parse({
        ...req.body,
        userId: req.session.user.id
      });
      const analysis = await storage.createBeckAnalysis(data);
      res.json(analysis);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Validation failed" });
    }
  });

  app.get("/api/beck-analyses", requireAuth, async (req, res) => {
    try {
      if (!req.session || !req.session.user) return res.status(401).json({ message: "Session non valide" });
      const userId = req.session.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const analyses = await storage.getBeckAnalyses(userId, limit);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Beck analyses" });
    }
  });

  // User stats and badges routes
  app.get("/api/users/stats", requireAuth, async (req, res) => {
    try {
      if (!req.session || !req.session.user) return res.status(401).json({ message: "Session non valide" });
      const userId = req.session.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get("/api/users/badges", requireAuth, async (req, res) => {
    try {
      if (!req.session || !req.session.user) return res.status(401).json({ message: "Session non valide" });
      const userId = req.session.user.id;
      const badges = await storage.getUserBadges(userId);
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  app.get("/api/users/profile", requireAuth, async (req, res) => {
    try {
      if (!req.session || !req.session.user) return res.status(401).json({ message: "Session non valide" });
      const userId = req.session.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create demo user for development
  app.post("/api/demo-user", async (req, res) => {
    try {
      const user = await storage.createUser({
        email: "demo@example.com",
        password: "demo123",
        firstName: "Utilisateur",
        lastName: "Demo",
        role: "patient",
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create demo user" });
    }
  });

  // Route pour initialiser les données d'exemple
  app.post("/api/seed-data", requireAdmin, async (req, res) => {
    try {
      const { seedData } = await import("./seed-data.js");
      await seedData();
      res.json({ message: "Données d'exemple créées avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création des données d'exemple" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
