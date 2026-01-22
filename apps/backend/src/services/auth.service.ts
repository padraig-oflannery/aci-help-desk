/**
 * Auth Service
 * 
 * Business logic for authentication operations.
 */

import { eq, and, isNull, gt } from 'drizzle-orm';
import { db, users, userSessions, passwordResetTokens } from '../db';
import type { UserRole } from '../db/schema';
import { hashPassword, verifyPassword, generateToken, hashToken, validatePassword } from '../lib/crypto';
import { generateAccessToken, generateRefreshToken } from '../lib/jwt';
import type { FastifyInstance } from 'fastify';

// ============================================
// User Operations
// ============================================

export async function findUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return user || null;
}

export async function findUserById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
}

// ============================================
// Login
// ============================================

interface LoginResult {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
    };
    error?: string;
}

export async function login(
    app: FastifyInstance,
    email: string,
    password: string,
    deviceLabel?: string
): Promise<LoginResult> {
    // Find user
    const user = await findUserByEmail(email);

    if (!user) {
        return { success: false, error: 'Invalid email or password' };
    }

    // Check if user is active
    if (!user.isActive) {
        return { success: false, error: 'Account is disabled' };
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.passwordHash);

    if (!validPassword) {
        return { success: false, error: 'Invalid email or password' };
    }

    // Generate refresh token
    const refreshTokenRaw = generateToken(48);
    const refreshTokenHash = hashToken(refreshTokenRaw);

    // Calculate expiry (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create session
    const [session] = await db.insert(userSessions).values({
        userId: user.id,
        refreshTokenHash,
        deviceLabel: deviceLabel || 'Unknown Device',
        expiresAt,
    }).returning();

    // Generate tokens
    const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: session.id,
    };

    const accessToken = generateAccessToken(app, tokenPayload);
    // Note: refreshTokenRaw is returned directly, generateRefreshToken is for JWT-based refresh which we don't use
    void generateRefreshToken; // Mark as intentionally available

    return {
        success: true,
        accessToken,
        refreshToken: refreshTokenRaw, // Return the raw token to store on client
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    };
}

// ============================================
// Token Refresh
// ============================================

interface RefreshResult {
    success: boolean;
    accessToken?: string;
    error?: string;
}

export async function refreshAccessToken(
    app: FastifyInstance,
    refreshToken: string
): Promise<RefreshResult> {
    const tokenHash = hashToken(refreshToken);

    // Find valid session
    const [session] = await db
        .select()
        .from(userSessions)
        .where(
            and(
                eq(userSessions.refreshTokenHash, tokenHash),
                isNull(userSessions.revokedAt),
                gt(userSessions.expiresAt, new Date())
            )
        )
        .limit(1);

    if (!session) {
        return { success: false, error: 'Invalid or expired refresh token' };
    }

    // Find user
    const user = await findUserById(session.userId);

    if (!user || !user.isActive) {
        return { success: false, error: 'User not found or inactive' };
    }

    // Generate new access token
    const accessToken = generateAccessToken(app, {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: session.id,
    });

    return { success: true, accessToken };
}

// ============================================
// Logout
// ============================================

export async function logout(sessionId: string) {
    await db
        .update(userSessions)
        .set({ revokedAt: new Date() })
        .where(eq(userSessions.id, sessionId));
}

export async function logoutAllSessions(userId: string, exceptSessionId?: string) {
    if (exceptSessionId) {
        await db
            .update(userSessions)
            .set({ revokedAt: new Date() })
            .where(
                and(
                    eq(userSessions.userId, userId),
                    isNull(userSessions.revokedAt)
                )
            );
    } else {
        await db
            .update(userSessions)
            .set({ revokedAt: new Date() })
            .where(eq(userSessions.userId, userId));
    }
}

// ============================================
// Password Reset
// ============================================

export async function createPasswordResetToken(email: string) {
    const user = await findUserByEmail(email);

    if (!user) {
        // Don't reveal if user exists
        return { success: true };
    }

    // Generate token
    const tokenRaw = generateToken(48);
    const tokenHash = hashToken(tokenRaw);

    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save token
    await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt,
    });

    // Return token (to be sent via email)
    return {
        success: true,
        token: tokenRaw,
        userName: user.name,
        email: user.email,
    };
}

export async function resetPassword(token: string, newPassword: string) {
    // Validate password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
        return { success: false, errors: validation.errors };
    }

    const tokenHash = hashToken(token);

    // Find valid token
    const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
            and(
                eq(passwordResetTokens.tokenHash, tokenHash),
                isNull(passwordResetTokens.usedAt),
                gt(passwordResetTokens.expiresAt, new Date())
            )
        )
        .limit(1);

    if (!resetToken) {
        return { success: false, errors: ['Invalid or expired reset token'] };
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, resetToken.userId));

    // Mark token as used
    await db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetToken.id));

    // Revoke all sessions (security)
    await logoutAllSessions(resetToken.userId);

    return { success: true };
}

// ============================================
// Session Management
// ============================================

export async function getUserSessions(userId: string) {
    return db
        .select({
            id: userSessions.id,
            deviceLabel: userSessions.deviceLabel,
            createdAt: userSessions.createdAt,
            expiresAt: userSessions.expiresAt,
        })
        .from(userSessions)
        .where(
            and(
                eq(userSessions.userId, userId),
                isNull(userSessions.revokedAt),
                gt(userSessions.expiresAt, new Date())
            )
        )
        .orderBy(userSessions.createdAt);
}

export async function revokeSession(userId: string, sessionId: string) {
    const result = await db
        .update(userSessions)
        .set({ revokedAt: new Date() })
        .where(
            and(
                eq(userSessions.id, sessionId),
                eq(userSessions.userId, userId)
            )
        )
        .returning();

    return result.length > 0;
}
