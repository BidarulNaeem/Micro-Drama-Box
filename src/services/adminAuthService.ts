// Admin Authentication Service with Secret PIN Protection & Brute Force Rate Limiting
const ADMIN_PIN_STORAGE_KEY = 'vela_custom_admin_pin';
const ADMIN_SESSION_AUTH_KEY = 'vela_admin_authenticated';
const ADMIN_FAILED_ATTEMPTS_KEY = 'vela_admin_failed_attempts';
const ADMIN_LOCKOUT_UNTIL_KEY = 'vela_admin_lockout_until';

export const DEFAULT_ADMIN_PIN = '76523888';
export const MAX_ADMIN_PIN_ATTEMPTS = 5;
export const ADMIN_LOCKOUT_DURATION_SECONDS = 300; // 5 minutes

export interface PinVerificationResult {
  success: boolean;
  isLockedOut: boolean;
  remainingSeconds: number;
  remainingAttempts: number;
  message?: string;
}

class AdminAuthService {
  /**
   * Get the current configured PIN (defaults to 76523888 if not customized)
   */
  public getAdminPin(): string {
    if (typeof window !== 'undefined') {
      const customPin = localStorage.getItem(ADMIN_PIN_STORAGE_KEY);
      if (customPin && customPin.trim().length >= 4) {
        return customPin.trim();
      }
    }
    return DEFAULT_ADMIN_PIN;
  }

  /**
   * Check if current session is authenticated as admin
   */
  public isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(ADMIN_SESSION_AUTH_KEY) === 'true';
  }

  /**
   * Get remaining lockout seconds if currently locked out
   */
  public getLockoutRemainingSeconds(): number {
    if (typeof window === 'undefined') return 0;
    const lockoutUntilStr = localStorage.getItem(ADMIN_LOCKOUT_UNTIL_KEY);
    if (!lockoutUntilStr) return 0;

    const lockoutUntil = parseInt(lockoutUntilStr, 10);
    if (isNaN(lockoutUntil)) {
      localStorage.removeItem(ADMIN_LOCKOUT_UNTIL_KEY);
      return 0;
    }

    const now = Date.now();
    if (now >= lockoutUntil) {
      // Lockout expired, reset attempts and clear lockout
      this.resetFailedAttempts();
      return 0;
    }

    return Math.max(1, Math.ceil((lockoutUntil - now) / 1000));
  }

  /**
   * Get current failed attempts count
   */
  public getFailedAttempts(): number {
    if (typeof window === 'undefined') return 0;
    const countStr = localStorage.getItem(ADMIN_FAILED_ATTEMPTS_KEY);
    if (!countStr) return 0;
    const count = parseInt(countStr, 10);
    return isNaN(count) ? 0 : count;
  }

  /**
   * Get remaining attempts before lockout
   */
  public getRemainingAttempts(): number {
    const failed = this.getFailedAttempts();
    return Math.max(0, MAX_ADMIN_PIN_ATTEMPTS - failed);
  }

  /**
   * Reset failed attempts and lockout
   */
  public resetFailedAttempts(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_FAILED_ATTEMPTS_KEY);
      localStorage.removeItem(ADMIN_LOCKOUT_UNTIL_KEY);
    }
  }

  /**
   * Verify entered PIN and authenticate the session if valid with brute force protection
   */
  public verifyAndLogin(enteredPin: string): PinVerificationResult {
    // 1. Check if currently locked out
    const remainingSeconds = this.getLockoutRemainingSeconds();
    if (remainingSeconds > 0) {
      return {
        success: false,
        isLockedOut: true,
        remainingSeconds,
        remainingAttempts: 0,
        message: `Too many failed attempts. Locked out for ${Math.ceil(remainingSeconds / 60)} minutes.`,
      };
    }

    const validPin = this.getAdminPin();
    if (enteredPin.trim() === validPin) {
      // Successful login -> Reset failed attempts and set session
      this.resetFailedAttempts();
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(ADMIN_SESSION_AUTH_KEY, 'true');
      }
      return {
        success: true,
        isLockedOut: false,
        remainingSeconds: 0,
        remainingAttempts: MAX_ADMIN_PIN_ATTEMPTS,
      };
    }

    // Failed attempt -> increment counter
    const currentFailed = this.getFailedAttempts() + 1;
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_FAILED_ATTEMPTS_KEY, currentFailed.toString());
    }

    if (currentFailed >= MAX_ADMIN_PIN_ATTEMPTS) {
      // Trigger lockout for 5 minutes (300 seconds)
      const lockoutUntil = Date.now() + ADMIN_LOCKOUT_DURATION_SECONDS * 1000;
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_LOCKOUT_UNTIL_KEY, lockoutUntil.toString());
      }
      return {
        success: false,
        isLockedOut: true,
        remainingSeconds: ADMIN_LOCKOUT_DURATION_SECONDS,
        remainingAttempts: 0,
        message: `Too many failed attempts. Locked out for 5 minutes.`,
      };
    }

    const remainingAttempts = MAX_ADMIN_PIN_ATTEMPTS - currentFailed;
    return {
      success: false,
      isLockedOut: false,
      remainingSeconds: 0,
      remainingAttempts,
      message: `Incorrect PIN. ${remainingAttempts} ${
        remainingAttempts === 1 ? 'attempt' : 'attempts'
      } remaining.`,
    };
  }

  /**
   * Log out admin and revoke session
   */
  public logout(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ADMIN_SESSION_AUTH_KEY);
    }
  }

  /**
   * Change admin PIN (requires current valid PIN)
   */
  public changePin(currentPin: string, newPin: string): { success: boolean; message: string } {
    const verifyRes = this.verifyAndLogin(currentPin);
    if (!verifyRes.success) {
      return { success: false, message: verifyRes.message || 'Current PIN is incorrect.' };
    }
    if (!newPin || newPin.trim().length < 4) {
      return { success: false, message: 'New PIN must be at least 4 digits.' };
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_PIN_STORAGE_KEY, newPin.trim());
      this.resetFailedAttempts();
    }
    return { success: true, message: 'Admin PIN updated successfully.' };
  }

  /**
   * Reset PIN to default (76523888)
   */
  public resetToDefaultPin(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_PIN_STORAGE_KEY);
      this.resetFailedAttempts();
    }
  }
}

export const adminAuthService = new AdminAuthService();
