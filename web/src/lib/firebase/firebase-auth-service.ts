import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  User,
  UserCredential,
  AuthError,
  AuthProvider,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "./firebaseConfig";

/**
 * Custom error class for authentication errors with user-friendly messages
 */
export class AuthenticationError extends Error {
  code: string;
  originalError: AuthError;

  constructor(error: AuthError) {
    super(AuthenticationError.getUserFriendlyMessage(error.code));
    this.name = "AuthenticationError";
    this.code = error.code;
    this.originalError = error;
  }

  /**
   * Converts Firebase error codes to user-friendly messages
   */
  private static getUserFriendlyMessage(code: string): string {
    const errorMessages: Record<string, string> = {
      // Email/Password errors
      "auth/email-already-in-use":
        "This email is already registered. Please sign in instead.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/weak-password":
        "Password is too weak. Please use at least 6 characters.",
      "auth/password-does-not-meet-requirements":
        "Password must be at least 8 characters long with at least 1 uppercase letter and 1 number.",
      "auth/operation-not-allowed":
        "This sign-in method is not enabled. Please contact support.",
      "auth/user-disabled":
        "This account has been disabled. Please contact support.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/too-many-requests":
        "Too many failed attempts. Please try again later.",
      "auth/network-request-failed":
        "Network error. Please check your connection and try again.",

      // OAuth errors
      "auth/account-exists-with-different-credential":
        "An account already exists with this email using a different sign-in method.",
      "auth/popup-blocked":
        "Sign-in popup was blocked. Please allow popups and try again.",
      "auth/popup-closed-by-user": "Sign-in was cancelled. Please try again.",
      "auth/cancelled-popup-request":
        "Sign-in was cancelled. Please try again.",
      "auth/unauthorized-domain":
        "This domain is not authorized for OAuth operations.",
      "auth/invalid-credential": "Invalid credentials. Please try again.",

      // Generic fallback
      default: "An unexpected error occurred. Please try again.",
    };

    return errorMessages[code] || errorMessages["default"];
  }

  static isCancelledPopup(error: AuthenticationError): boolean {
    return (
      error.message === "cancelled" ||
      error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request"
    );
  }
}

/**
 * Result type for authentication operations
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: AuthenticationError;
}

/**
 * Sign up a new user with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      success: false,
      error: new AuthenticationError(error as AuthError),
    };
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error) {
    console.error("Sign in error:", error);
    return {
      success: false,
      error: new AuthenticationError(error as AuthError),
    };
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  const provider = new GoogleAuthProvider();
  // Optional: Add custom parameters
  provider.addScope("profile");
  provider.addScope("email");

  return await signInWithProvider(provider);
}

/**
 * Sign in with GitHub OAuth
 */
export async function signInWithGithub(): Promise<AuthResult> {
  const provider = new GithubAuthProvider();
  // Optional: Add custom scopes
  provider.addScope("user:email");

  return await signInWithProvider(provider);
}

/**
 * Generic sign in with OAuth provider
 */
async function signInWithProvider(provider: AuthProvider): Promise<AuthResult> {
  try {
    const result: UserCredential = await signInWithPopup(auth, provider);
    return {
      success: true,
      user: result.user,
    };
  } catch (error) {
    console.error("OAuth sign in error:", error);
    return {
      success: false,
      error: new AuthenticationError(error as AuthError),
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<{
  success: boolean;
  error?: AuthenticationError;
}> {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return {
      success: false,
      error: new AuthenticationError(error as AuthError),
    };
  }
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Validate password meets requirements
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
/**
 * Send password reset email
 */
export async function sendPasswordReset(
  email: string
): Promise<{ success: boolean; error?: AuthenticationError }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      success: false,
      error: new AuthenticationError(error as AuthError),
    };
  }
}
/**
 * Verify password reset code is valid
 */
export async function verifyPasswordResetToken(
  code: string
): Promise<{ success: boolean; email?: string; error?: AuthenticationError }> {
  try {
    const email = await verifyPasswordResetCode(auth, code);
    return { success: true, email };
  } catch (error) {
    console.error("Verify reset code error:", error);
    return {
      success: false,
      error: new AuthenticationError(error as AuthError),
    };
  }
}

/**
 * Complete password reset with new password
 */
export async function completePasswordReset(
  code: string,
  newPassword: string
): Promise<{ success: boolean; error?: AuthenticationError }> {
  try {
    await confirmPasswordReset(auth, code, newPassword);
    return { success: true };
  } catch (error) {
    console.error("Complete password reset error:", error);
    return {
      success: false,
      error: new AuthenticationError(error as AuthError),
    };
  }
}
