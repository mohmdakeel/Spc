export const BACKEND = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:8081";
export const AUTH_COOKIE = process.env.AUTH_TOKEN_COOKIE || "token";
export const AUTH_MAX_AGE = Number(process.env.AUTH_TOKEN_MAX_AGE || 86400); 
