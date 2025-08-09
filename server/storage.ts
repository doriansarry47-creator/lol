import {
  users,
  cravingEntries,
  exerciseSessions,
  beckAnalyses,
  userBadges,
  userStats,
  type User,
  type InsertUser,
  type CravingEntry,
  type InsertCravingEntry,
  type ExerciseSession,
  type InsertExerciseSession,
  type BeckAnalysis,
  type InsertBeckAnalysis,
  type UserBadge,
  type InsertUserBadge,
  type UserStats,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStats(userId: string, stats: Partial<UserStats>): Promise<UserStats>;

  // Craving operations
  createCravingEntry(entry: InsertCravingEntry): Promise<CravingEntry>;
  getCravingEntries(userId: string, limit?: number): Promise<CravingEntry[]>;
  getCravingStats(userId: string, days?: number): Promise<{ average: number; trend: number }>;

  // Exercise operations
  createExerciseSession(session: InsertExerciseSession): Promise<ExerciseSession>;
  getExerciseSessions(userId: string, limit?: number): Promise<ExerciseSession[]>;
  getUserStats(userId: string): Promise<UserStats | undefined>;

  // Beck analysis operations
  createBeckAnalysis(analysis: InsertBeckAnalysis): Promise<BeckAnalysis>;
  getBeckAnalyses(userId: string, limit?: number): Promise<BeckAnalysis[]>;

  // Badge operations
  getUserBadges(userId: string): Promise<UserBadge[]>;
  awardBadge(badge: InsertUserBadge): Promise<UserBadge>;
  checkAndAwardBadges(userId: string): Promise<UserBadge[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private cravingEntries: Map<string, CravingEntry> = new Map();
  private exerciseSessions: Map<string, ExerciseSession> = new Map();
  private beckAnalyses: Map<string, BeckAnalysis> = new Map();
  private userBadges: Map<string, UserBadge> = new Map();
  private userStats: Map<string, UserStats> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      level: 1,
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    
    // Initialize user stats
    const stats: UserStats = {
      id: randomUUID(),
      userId: id,
      exercisesCompleted: 0,
      totalDuration: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageCraving: null,
      updatedAt: new Date(),
    };
    this.userStats.set(id, stats);
    
    return user;
  }

  async updateUserStats(userId: string, statsUpdate: Partial<UserStats>): Promise<UserStats> {
    const currentStats = this.userStats.get(userId);
    const updatedStats: UserStats = {
      ...currentStats,
      ...statsUpdate,
      userId,
      id: currentStats?.id || randomUUID(),
      updatedAt: new Date(),
    } as UserStats;
    
    this.userStats.set(userId, updatedStats);
    return updatedStats;
  }

  async createCravingEntry(insertEntry: InsertCravingEntry): Promise<CravingEntry> {
    const id = randomUUID();
    const entry: CravingEntry = {
      ...insertEntry,
      id,
      createdAt: new Date(),
    };
    this.cravingEntries.set(id, entry);
    
    // Update average craving
    await this.updateAverageCraving(insertEntry.userId);
    
    return entry;
  }

  async getCravingEntries(userId: string, limit = 50): Promise<CravingEntry[]> {
    const entries = Array.from(this.cravingEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
    return entries;
  }

  async getCravingStats(userId: string, days = 30): Promise<{ average: number; trend: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const entries = Array.from(this.cravingEntries.values())
      .filter(entry => entry.userId === userId && entry.createdAt! > cutoffDate)
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());

    if (entries.length === 0) return { average: 0, trend: 0 };

    const average = entries.reduce((sum, entry) => sum + entry.intensity, 0) / entries.length;
    
    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(entries.length / 2);
    const firstHalf = entries.slice(0, midPoint);
    const secondHalf = entries.slice(midPoint);
    
    const firstAvg = firstHalf.reduce((sum, entry) => sum + entry.intensity, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, entry) => sum + entry.intensity, 0) / secondHalf.length;
    const trend = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    return { average: Math.round(average * 10) / 10, trend: Math.round(trend) };
  }

  private async updateAverageCraving(userId: string): Promise<void> {
    const stats = await this.getCravingStats(userId);
    await this.updateUserStats(userId, { averageCraving: Math.round(stats.average) });
  }

  async createExerciseSession(insertSession: InsertExerciseSession): Promise<ExerciseSession> {
    const id = randomUUID();
    const session: ExerciseSession = {
      ...insertSession,
      id,
      createdAt: new Date(),
    };
    this.exerciseSessions.set(id, session);

    if (session.completed) {
      // Update user stats
      const currentStats = this.userStats.get(session.userId);
      if (currentStats) {
        await this.updateUserStats(session.userId, {
          exercisesCompleted: currentStats.exercisesCompleted + 1,
          totalDuration: currentStats.totalDuration + (session.duration || 0),
        });
      }

      // Update user points and level
      const user = this.users.get(session.userId);
      if (user) {
        const newPoints = user.points + 10; // 10 points per completed exercise
        const newLevel = Math.floor(newPoints / 100) + 1; // Level up every 100 points
        
        const updatedUser = { ...user, points: newPoints, level: newLevel, updatedAt: new Date() };
        this.users.set(session.userId, updatedUser);
      }

      // Check and award badges
      await this.checkAndAwardBadges(session.userId);
    }

    return session;
  }

  async getExerciseSessions(userId: string, limit = 50): Promise<ExerciseSession[]> {
    const sessions = Array.from(this.exerciseSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
    return sessions;
  }

  async getUserStats(userId: string): Promise<UserStats | undefined> {
    return this.userStats.get(userId);
  }

  async createBeckAnalysis(insertAnalysis: InsertBeckAnalysis): Promise<BeckAnalysis> {
    const id = randomUUID();
    const analysis: BeckAnalysis = {
      ...insertAnalysis,
      id,
      createdAt: new Date(),
    };
    this.beckAnalyses.set(id, analysis);
    return analysis;
  }

  async getBeckAnalyses(userId: string, limit = 20): Promise<BeckAnalysis[]> {
    const analyses = Array.from(this.beckAnalyses.values())
      .filter(analysis => analysis.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
    return analyses;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return Array.from(this.userBadges.values())
      .filter(badge => badge.userId === userId)
      .sort((a, b) => b.earnedAt!.getTime() - a.earnedAt!.getTime());
  }

  async awardBadge(insertBadge: InsertUserBadge): Promise<UserBadge> {
    // Check if badge already exists
    const existingBadge = Array.from(this.userBadges.values())
      .find(badge => badge.userId === insertBadge.userId && badge.badgeType === insertBadge.badgeType);
    
    if (existingBadge) return existingBadge;

    const id = randomUUID();
    const badge: UserBadge = {
      ...insertBadge,
      id,
      earnedAt: new Date(),
    };
    this.userBadges.set(id, badge);
    return badge;
  }

  async checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
    const newBadges: UserBadge[] = [];
    const stats = this.userStats.get(userId);
    const sessions = await this.getExerciseSessions(userId);
    
    if (!stats) return newBadges;

    // 7 days streak badge
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = sessions.filter(session => 
      session.completed && session.createdAt! > sevenDaysAgo
    );
    
    if (recentSessions.length >= 7) {
      const badge = await this.awardBadge({ userId, badgeType: '7_days' });
      if (badge) newBadges.push(badge);
    }

    // 50 exercises badge
    if (stats.exercisesCompleted >= 50) {
      const badge = await this.awardBadge({ userId, badgeType: '50_exercises' });
      if (badge) newBadges.push(badge);
    }

    // Craving reduction badge
    const cravingStats = await this.getCravingStats(userId);
    if (cravingStats.trend < -20) { // 20% reduction
      const badge = await this.awardBadge({ userId, badgeType: 'craving_reduction' });
      if (badge) newBadges.push(badge);
    }

    return newBadges;
  }
}

export const storage = new MemStorage();
