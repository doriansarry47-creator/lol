import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  level: integer("level").default(1),
  points: integer("points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Craving entries
export const cravingEntries = pgTable("craving_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  intensity: integer("intensity").notNull(), // 0-10 scale
  triggers: jsonb("triggers").$type<string[]>().default([]),
  emotions: jsonb("emotions").$type<string[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exercise sessions
export const exerciseSessions = pgTable("exercise_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  exerciseId: varchar("exercise_id").notNull(),
  duration: integer("duration"), // in seconds
  completed: boolean("completed").default(false),
  cratingBefore: integer("craving_before"), // 0-10 scale
  cravingAfter: integer("craving_after"), // 0-10 scale
  createdAt: timestamp("created_at").defaultNow(),
});

// Beck column analyses
export const beckAnalyses = pgTable("beck_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  situation: text("situation"),
  automaticThoughts: text("automatic_thoughts"),
  emotions: text("emotions"),
  emotionIntensity: integer("emotion_intensity"),
  rationalResponse: text("rational_response"),
  newFeeling: text("new_feeling"),
  newIntensity: integer("new_intensity"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User badges
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  badgeType: varchar("badge_type").notNull(), // '7_days', '50_exercises', 'craving_reduction'
  earnedAt: timestamp("earned_at").defaultNow(),
});

// User progress/stats
export const userStats = pgTable("user_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  exercisesCompleted: integer("exercises_completed").default(0),
  totalDuration: integer("total_duration").default(0), // in seconds
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  averageCraving: integer("average_craving"), // calculated average
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert schemas
export const insertCravingEntrySchema = createInsertSchema(cravingEntries).omit({
  id: true,
  createdAt: true,
});

export const insertExerciseSessionSchema = createInsertSchema(exerciseSessions).omit({
  id: true,
  createdAt: true,
});

export const insertBeckAnalysisSchema = createInsertSchema(beckAnalyses).omit({
  id: true,
  createdAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CravingEntry = typeof cravingEntries.$inferSelect;
export type InsertCravingEntry = z.infer<typeof insertCravingEntrySchema>;
export type ExerciseSession = typeof exerciseSessions.$inferSelect;
export type InsertExerciseSession = z.infer<typeof insertExerciseSessionSchema>;
export type BeckAnalysis = typeof beckAnalyses.$inferSelect;
export type InsertBeckAnalysis = z.infer<typeof insertBeckAnalysisSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserStats = typeof userStats.$inferSelect;
