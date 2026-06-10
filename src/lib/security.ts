// Simple rate limiter (in-memory, for demo purposes)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function checkLoginRateLimit(email: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const record = loginAttempts.get(email);
  
  if (!record) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
    return { allowed: true, retryAfterMs: 0 };
  }
  
  // Reset after 15 minutes
  if (now - record.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
    return { allowed: true, retryAfterMs: 0 };
  }
  
  if (record.count >= 5) {
    const retryAfterMs = 15 * 60 * 1000 - (now - record.lastAttempt);
    return { allowed: false, retryAfterMs };
  }
  
  record.count++;
  record.lastAttempt = now;
  return { allowed: true, retryAfterMs: 0 };
}

export function recordFailedLogin(email: string) {
  const record = loginAttempts.get(email);
  if (record) {
    record.count++;
    record.lastAttempt = Date.now();
  } else {
    loginAttempts.set(email, { count: 1, lastAttempt: Date.now() });
  }
}

export function clearLoginAttempts(email: string) {
  loginAttempts.delete(email);
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}
