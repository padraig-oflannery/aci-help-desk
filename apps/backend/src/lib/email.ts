/**
 * Email Service
 * 
 * Handles email sending via Resend.
 */

import { Resend } from 'resend';
import { APP_CONFIG } from '@helpdesk/shared';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_api_key_replace_me');
const EMAIL_FROM = process.env.EMAIL_FROM || `${APP_CONFIG.APP_NAME} <noreply@yourdomain.com>`;

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName: string
): Promise<boolean> {
    try {
        const resetUrl = `${process.env.API_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        await resend.emails.send({
            from: EMAIL_FROM,
            to,
            subject: 'Password Reset Request',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>Hi ${userName},</p>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
          <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
          <p style="color: #666;">This link will expire in 1 hour.</p>
          <p style="color: #666;">If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #999; font-size: 12px;">${APP_CONFIG.APP_NAME} - ${APP_CONFIG.APP_TAGLINE}</p>
        </div>
      `,
        });

        return true;
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        return false;
    }
}

/**
 * Send welcome email with temporary password
 */
export async function sendWelcomeEmail(
    to: string,
    userName: string,
    temporaryPassword: string
): Promise<boolean> {
    try {
        await resend.emails.send({
            from: EMAIL_FROM,
            to,
            subject: `Welcome to ${APP_CONFIG.APP_NAME}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to ${APP_CONFIG.APP_NAME}</h2>
          <p>Hi ${userName},</p>
          <p>Your account has been created. Here are your login credentials:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Email:</strong> ${to}</p>
            <p style="margin: 8px 0 0;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
          </div>
          <p style="color: #dc2626;"><strong>Please log in and change your password immediately.</strong></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #999; font-size: 12px;">${APP_CONFIG.APP_NAME} - ${APP_CONFIG.APP_TAGLINE}</p>
        </div>
      `,
        });

        return true;
    } catch (error) {
        console.error('Failed to send welcome email:', error);
        return false;
    }
}
