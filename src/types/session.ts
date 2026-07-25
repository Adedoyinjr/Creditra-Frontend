/**
 * Device categories for active sessions.
 *
 * Reflects the platform reported by the user-agent at sign-in time.
 */
export type SessionDeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

/**
 * Represents a single authenticated session.
 *
 * Sessions are created when the user signs in and destroyed when they sign out
 * or when they are explicitly revoked from the Sessions settings page.
 */
export interface Session {
  /** Opaque server-side session identifier */
  id: string;
  /**
   * Whether this is the session currently making the request.
   * Only one session may be current at a time.
   */
  isCurrent: boolean;
  /** Human-readable device/OS/browser label derived from the user-agent */
  deviceLabel: string;
  /** Coarse device category for icon selection */
  deviceType: SessionDeviceType;
  /** IP address recorded at session creation (or most-recent activity) */
  ipAddress: string;
  /**
   * Coarse geolocation label derived from the IP at sign-in.
   * Example: "San Francisco, CA, US"
   */
  location: string;
  /** ISO 8601 timestamp of session creation (sign-in) */
  createdAt: string;
  /** ISO 8601 timestamp of the most-recent authenticated request */
  lastActiveAt: string;
}

/**
 * Possible states for an individual revoke operation.
 *
 * - `idle`    — no operation pending
 * - `loading` — revoke request in-flight
 * - `success` — session was successfully invalidated
 * - `error`   — revoke request failed; user may retry
 */
export type RevokeState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Per-session revoke state map — keyed by session id.
 */
export type RevokeStateMap = Record<string, RevokeState>;
