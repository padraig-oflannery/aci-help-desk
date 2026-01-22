/**
 * Crypto Utilities
 * 
 * Password hashing and token generation.
 */

import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';

const SALT_ROUNDS = 10;

// ============================================
// Password Hashing
// ============================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
        return await bcrypt.compare(password, hash);
    } catch {
        return false;
    }
}

// ============================================
// Token Generation
// ============================================

/**
 * Generate a cryptographically secure random token
 */
export function generateToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
}

/**
 * Hash a token for storage (using SHA-256)
 */
export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

// ============================================
// Password Validation
// ============================================

interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
