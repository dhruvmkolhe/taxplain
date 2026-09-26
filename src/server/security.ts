import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

/**
 * -------------------------------------------------------------
 * 1. HTTP SECURITY HEADERS CONFIGURATION
 * -------------------------------------------------------------
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking while permitting legitimate preview embedding in AI Studio / Google Cloud Run
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Cross-Site Scripting filter
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Restrict referrer information sent on navigation
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict hardware access and sensitive APIs
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");

  // Cross-Origin policies
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  // Robust Content-Security-Policy (CSP)
  // Supports Vite scripts, Tailwind/fonts, Google Analytics (consent-gated), and AI Studio preview iframes
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
    "worker-src 'self' blob: https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: wss: ws:",
    "frame-ancestors 'self' https://*.google.com https://*.googleusercontent.com https://*.run.app https://ai.studio",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  res.setHeader("Content-Security-Policy", cspDirectives);

  // If running on HTTPS, enforce HSTS
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

/**
 * -------------------------------------------------------------
 * 2. CSRF PROTECTION SYSTEM
 * -------------------------------------------------------------
 * Implements cryptographic Anti-CSRF token verification and Origin/Referer
 * domain validation to guarantee document evaluation requests only originate
 * from the authentic TaxPlain web application.
 */

// Ephemeral server secret for HMAC signing of CSRF tokens
const CSRF_SERVER_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString("hex");

// Active token registry with expiry timestamps (2 hours TTL)
interface TokenMeta {
  expiresAt: number;
}
const activeCsrfTokens = new Map<string, TokenMeta>();

// Periodic garbage collection of expired tokens every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, meta] of activeCsrfTokens.entries()) {
    if (now > meta.expiresAt) {
      activeCsrfTokens.delete(token);
    }
  }
}, 10 * 60 * 1000);

/**
 * Generates a signed cryptographic anti-CSRF token
 */
export function generateCsrfToken(): string {
  const randomBytes = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", CSRF_SERVER_SECRET)
    .update(`${randomBytes}.${timestamp}`)
    .digest("hex");

  const token = `${randomBytes}.${timestamp}.${signature}`;
  activeCsrfTokens.set(token, { expiresAt: Date.now() + 2 * 60 * 60 * 1000 });
  return token;
}

/**
 * Validates a submitted CSRF token
 */
export function verifyCsrfToken(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [randomBytes, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp) || Date.now() - timestamp > 2 * 60 * 60 * 1000) {
    return false; // Expired (older than 2 hours)
  }

  const expectedSignature = crypto
    .createHmac("sha256", CSRF_SERVER_SECRET)
    .update(`${randomBytes}.${timestampStr}`)
    .digest("hex");

  try {
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
    if (!isSignatureValid) {
      return false;
    }
  } catch {
    return false;
  }

  const registeredMeta = activeCsrfTokens.get(token);
  if (!registeredMeta || Date.now() > registeredMeta.expiresAt) {
    return false;
  }

  return true;
}

/**
 * CSRF Protection Middleware for API routes
 */
export function csrfProtectionMiddleware(req: Request, res: Response, next: NextFunction) {
  // Safe HTTP methods do not modify server state and are exempt
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }

  // 1. Origin & Referer Verification
  const origin = req.headers["origin"] as string | undefined;
  const referer = req.headers["referer"] as string | undefined;
  const host = req.headers["host"] as string | undefined;

  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      const isLocal = originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1";
      const matchesHost = originUrl.host === host;
      const isGooglePreview = originUrl.hostname.endsWith(".run.app") || originUrl.hostname.endsWith(".google.com");

      if (!isLocal && !matchesHost && !isGooglePreview) {
        console.warn(`[Security Alert] CSRF Origin mismatch: origin=${origin}, host=${host}`);
        return res.status(403).json({
          error: "Forbidden",
          code: "CSRF_ORIGIN_INVALID",
          message: "Request blocked: Origin header does not match verified application host.",
        });
      }
    } catch {
      return res.status(403).json({
        error: "Forbidden",
        code: "CSRF_MALFORMED_ORIGIN",
        message: "Request blocked: Malformed Origin header.",
      });
    }
  }

  // 2. Custom Application Header check AND CSRF token validation
  const requestedWith = req.headers["x-requested-with"];
  const customAppHeader = req.headers["x-taxplain-app"];
  const csrfToken = req.headers["x-csrf-token"] as string | undefined;

  // Verify that request is from authenticated browser AJAX/Fetch client with valid token
  const hasCustomHeader = requestedWith === "XMLHttpRequest" || customAppHeader === "true";
  const isCsrfValid = csrfToken ? verifyCsrfToken(csrfToken) : false;

  if (!hasCustomHeader || !isCsrfValid) {
    console.warn(`[Security Alert] CSRF verification failed for ${req.path}. Token missing or invalid.`);
    return res.status(403).json({
      error: "Forbidden",
      code: "CSRF_VERIFICATION_FAILED",
      message: "Access denied: Request missing valid Anti-CSRF verification tokens.",
    });
  }

  next();
}

/**
 * -------------------------------------------------------------
 * 3. ADVANCED TIERED REQUEST RATE LIMITER
 * -------------------------------------------------------------
 * Implements sliding-window rate limiting to protect API keys from quota
 * exhaustion, high billable costs, and DoS attacks.
 */

interface RateTracker {
  burstTimestamps: number[];
  sustainedTimestamps: number[];
}

const rateStore = new Map<string, RateTracker>();

// Clean up stale IP trackers every 3 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, tracker] of rateStore.entries()) {
    tracker.sustainedTimestamps = tracker.sustainedTimestamps.filter((t) => now - t < 60000);
    tracker.burstTimestamps = tracker.burstTimestamps.filter((t) => now - t < 10000);
    if (tracker.sustainedTimestamps.length === 0) {
      rateStore.delete(ip);
    }
  }
}, 3 * 60 * 1000);

export function createRateLimiter(options: {
  burstLimit: number; // e.g. 10 requests per 10 seconds
  sustainedLimit: number; // e.g. 30 requests per 60 seconds
  name?: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Rely on Express trusted IP resolution (configured with app.set('trust proxy', 1))
    const rawIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
    // Normalize IPv6-mapped IPv4 addresses (::ffff:127.0.0.1 -> 127.0.0.1)
    const clientIp = rawIp.replace(/^.*:/, "");
    const now = Date.now();

    let tracker = rateStore.get(clientIp);
    if (!tracker) {
      tracker = { burstTimestamps: [], sustainedTimestamps: [] };
      rateStore.set(clientIp, tracker);
    }

    // Filter windows
    tracker.burstTimestamps = tracker.burstTimestamps.filter((t) => now - t < 10000);
    tracker.sustainedTimestamps = tracker.sustainedTimestamps.filter((t) => now - t < 60000);

    // Check burst limit (protects against rapid-fire script hammering)
    if (tracker.burstTimestamps.length >= options.burstLimit) {
      const oldestBurst = tracker.burstTimestamps[0];
      const retryAfterSec = Math.max(1, Math.ceil((10000 - (now - oldestBurst)) / 1000));

      res.setHeader("Retry-After", retryAfterSec);
      res.setHeader("X-RateLimit-Limit", options.sustainedLimit);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil((oldestBurst + 10000) / 1000));

      return res.status(429).json({
        error: "Too Many Requests",
        code: "RATE_LIMIT_BURST_EXCEEDED",
        message: `Too many rapid requests. Burst limit of ${options.burstLimit} calls per 10s exceeded. Please wait ${retryAfterSec}s.`,
        retryAfter: retryAfterSec,
      });
    }

    // Check sustained limit (protects upstream LLM API tokens and daily costs)
    if (tracker.sustainedTimestamps.length >= options.sustainedLimit) {
      const oldestSustained = tracker.sustainedTimestamps[0];
      const retryAfterSec = Math.max(1, Math.ceil((60000 - (now - oldestSustained)) / 1000));

      res.setHeader("Retry-After", retryAfterSec);
      res.setHeader("X-RateLimit-Limit", options.sustainedLimit);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil((oldestSustained + 60000) / 1000));

      return res.status(429).json({
        error: "Too Many Requests",
        code: "RATE_LIMIT_SUSTAINED_EXCEEDED",
        message: `Hourly query quota guard triggered. Limit is ${options.sustainedLimit} queries per minute to protect API keys. Please wait ${retryAfterSec}s.`,
        retryAfter: retryAfterSec,
      });
    }

    // Record this request
    tracker.burstTimestamps.push(now);
    tracker.sustainedTimestamps.push(now);

    // Standard rate limit telemetry headers
    const remaining = Math.max(0, options.sustainedLimit - tracker.sustainedTimestamps.length);
    res.setHeader("X-RateLimit-Limit", options.sustainedLimit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil((now + 60000) / 1000));

    next();
  };
}
