import { NextRequest, NextResponse } from 'next/server';

interface AuthResult {
  authorized: boolean;
  userId?: string;
  userRole?: string;
  userName?: string;
  error?: string;
}

export function requireAuth(request: NextRequest): AuthResult {
  // For now, check for x-user-id and x-user-role headers
  // In production, this would verify JWT tokens
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  const userName = request.headers.get('x-user-name');
  
  if (!userId || !userRole) {
    return { authorized: false, error: 'Unauthorized' };
  }
  
  return { authorized: true, userId, userRole, userName };
}

export function requireRole(request: NextRequest, allowedRoles: string[]): AuthResult {
  const auth = requireAuth(request);
  if (!auth.authorized) return auth;
  
  if (!allowedRoles.includes(auth.userRole!)) {
    return { authorized: false, error: 'Forbidden: Insufficient permissions' };
  }
  
  return auth;
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}
