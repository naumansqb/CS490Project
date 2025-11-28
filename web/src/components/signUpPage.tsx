"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  signUpWithEmail,
  signInWithGoogle,
  signInWithGithub,
  signInWithLinkedIn,
  validatePassword,
  validateEmail,
  AuthenticationError,
} from "../lib/firebase/firebase-auth-service";

interface FormErrors {
  email: string;
  password: string;
  confirmPassword: string;
  google: string;
  github: string;
  linkedin: string;
}

const initialErrors: FormErrors = {
  email: "",
  password: "",
  confirmPassword: "",
  google: "",
  github: "",
  linkedin: "",
};

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>(initialErrors);
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [oAuthLoading, setOAuthLoading] = useState<{
    google: boolean;
    github: boolean;
    linkedin: boolean;
  }>({ google: false, github: false, linkedin: false });

  const router = useRouter();

  /**
   * Clear specific error or all errors
   */
  const clearErrors = (field?: keyof FormErrors) => {
    if (field) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    } else {
      setErrors(initialErrors);
    }
  };

  /**
   * Validate form inputs before submission
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = { ...initialErrors };
    let isValid = true;

    // Validate email
    if (!email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Validate password
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
        isValid = false;
      }
    }

    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Handle email/password sign up
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUpWithEmail(email, password, firstName, lastName);

      if (result.success && result.user) {
        // Successfully signed up - redirect to dashboard
        router.push("/dashboard");
      } else if (result.error) {
        // Handle specific error types
        handleAuthError(result.error);
      }
    } catch (error) {
      console.error("Unexpected error during sign up:", error);
      setErrors((prev) => ({
        ...prev,
        email: "An unexpected error occurred. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle authentication errors and map them to form fields
   */
  const handleAuthError = (error: AuthenticationError) => {
    const newErrors: FormErrors = { ...initialErrors };

    // Map error codes to specific form fields
    switch (error.code) {
      case "auth/email-already-in-use":
      case "auth/invalid-email":
        newErrors.email = error.message;
        break;
      case "auth/weak-password":
      case "auth/password-does-not-meet-requirements":
        newErrors.password = error.message;
        break;
      default:
        newErrors.email = error.message;
    }

    setErrors(newErrors);
  };

  /**
   * Handle Google OAuth sign in
   */
  const handleGoogleSignIn = async () => {
    clearErrors("google");
    setOAuthLoading((prev) => ({ ...prev, google: true }));

    try {
      const result = await signInWithGoogle();

      if (result.success && result.user) {
        router.push("/dashboard");
      } else if (result.error) {
        // Check if popup was cancelled - don't show error
        if (
          result.error.code === "auth/popup-closed-by-user" ||
          result.error.code === "auth/cancelled-popup-request"
        ) {
          // User cancelled - silently return without error
          return;
        }

        setErrors((prev) => ({
          ...prev,
          google: result.error!.message,
        }));
      }
    } catch (error) {
      console.error("Unexpected error during Google sign in:", error);
      setErrors((prev) => ({
        ...prev,
        google: "An unexpected error occurred. Please try again.",
      }));
    } finally {
      setOAuthLoading((prev) => ({ ...prev, google: false }));
    }
  };

  /**
   * Handle GitHub OAuth sign in
   */
  const handleGitHubSignIn = async () => {
    clearErrors("github");
    setOAuthLoading((prev) => ({ ...prev, github: true }));

    try {
      const result = await signInWithGithub();

      if (result.success && result.user) {
        router.push("/dashboard");
      } else if (result.error) {
        // Check if popup was cancelled - don't show error
        if (
          result.error.code === "auth/popup-closed-by-user" ||
          result.error.code === "auth/cancelled-popup-request"
        ) {
          // User cancelled - silently return without error
          return;
        }

        setErrors((prev) => ({
          ...prev,
          github: result.error!.message,
        }));
      }
    } catch (error) {
      console.error("Unexpected error during GitHub sign in:", error);
      setErrors((prev) => ({
        ...prev,
        github: "An unexpected error occurred. Please try again.",
      }));
    } finally {
      setOAuthLoading((prev) => ({ ...prev, github: false }));
    }
  };

  /**
   * Handle LinkedIn OAuth sign in
   */
  const handleLinkedInSignIn = async () => {
    clearErrors("linkedin");
    setOAuthLoading((prev) => ({ ...prev, linkedin: true }));

    try {
      const result = await signInWithLinkedIn();

      if (result.success && result.user) {
        router.push("/dashboard");
      } else if (result.error) {
        // Check if popup was cancelled - don't show error
        if (
          result.error.code === "auth/popup-closed-by-user" ||
          result.error.code === "auth/cancelled-popup-request"
        ) {
          // User cancelled - silently return without error
          return;
        }

        setErrors((prev) => ({
          ...prev,
          linkedin: result.error!.message,
        }));
      }
    } catch (error) {
      console.error("Unexpected error during LinkedIn sign in:", error);
      setErrors((prev) => ({
        ...prev,
        linkedin: "An unexpected error occurred. Please try again.",
      }));
    } finally {
      setOAuthLoading((prev) => ({ ...prev, linkedin: false }));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="name">First Name</FieldLabel>
          <Input 
            id="name" 
            type="text" 
            placeholder="John" 
            required 
            onChange={(e) => {
              setFirstName(e.target.value);
            }}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="name">Last Name</FieldLabel>
          <Input 
            id="name" 
            type="text" 
            placeholder="Doe" 
            required
            onChange={(e) => {
              setLastName(e.target.value);
            }} 
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) clearErrors("email");
            }}
            className={errors.email ? "border-destructive" : ""}
            disabled={isLoading}
            required
          />
          {errors.email && (
            <FieldDescription className="text-destructive">
              {errors.email}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) clearErrors("password");
            }}
            className={errors.password ? "border-destructive" : ""}
            disabled={isLoading}
            required
          />

          <div className="mt-2 space-y-1 text-sm">
            <div className={password.length >= 8 ? "text-green-600" : "text-gray-500"}>
              {password.length >= 8 ? "✓" : "○"} At least 8 characters
            </div>
            <div className={/[A-Z]/.test(password) ? "text-green-600" : "text-gray-500"}>
              {/[A-Z]/.test(password) ? "✓" : "○"} At least 1 uppercase letter
            </div>
            <div className={/[a-z]/.test(password) ? "text-green-600" : "text-gray-500"}>
              {/[a-z]/.test(password) ? "✓" : "○"} At least 1 lowercase letter
            </div>
            <div className={/[0-9]/.test(password) ? "text-green-600" : "text-gray-500"}>
              {/[0-9]/.test(password) ? "✓" : "○"} At least 1 number
            </div>
          </div>

          {errors.password && (
            <FieldDescription className="text-destructive">
              {errors.password}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) clearErrors("confirmPassword");
            }}
            className={errors.confirmPassword ? "border-destructive" : ""}
            disabled={isLoading}
            required
          />
          <FieldDescription
            className={
              errors.confirmPassword ? "text-destructive font-bold" : ""
            }
          >
            {errors.confirmPassword || "Please confirm your password"}
          </FieldDescription>
        </Field>

        <Field>
          <Button
            type="submit"
            className="w-full text-white cursor-pointer bg-[#3bafba] hover:bg-[#34a0ab] disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoading || oAuthLoading.google || oAuthLoading.github || oAuthLoading.linkedin}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleSignIn}
            className={
              errors.google
                ? "border-destructive cursor-pointer"
                : "cursor-pointer"
            }
            disabled={isLoading || oAuthLoading.google || oAuthLoading.github || oAuthLoading.linkedin}
          >
            <Image src="/Google.svg" alt="Google icon" width={20} height={20} />
            {oAuthLoading.google ? "Signing in..." : "Sign up with Google"}
          </Button>
          {errors.google && (
            <FieldDescription className="text-destructive">
              {errors.google}
            </FieldDescription>
          )}

          <Button
            variant="outline"
            type="button"
            onClick={handleGitHubSignIn}
            className={
              errors.github
                ? "border-destructive cursor-pointer"
                : "cursor-pointer"
            }
            disabled={isLoading || oAuthLoading.google || oAuthLoading.github || oAuthLoading.linkedin}
          >
            <Image src="/github.svg" alt="Github Logo" width={20} height={20} />
            {oAuthLoading.github ? "Signing in..." : "Sign up with GitHub"}
          </Button>
          {errors.github && (
            <FieldDescription className="text-destructive">
              {errors.github}
            </FieldDescription>
          )}

          <Button
            variant="outline"
            type="button"
            onClick={handleLinkedInSignIn}
            className={
              errors.linkedin
                ? "border-destructive cursor-pointer"
                : "cursor-pointer"
            }
            disabled={isLoading || oAuthLoading.google || oAuthLoading.github || oAuthLoading.linkedin}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            {oAuthLoading.linkedin ? "Signing in..." : "Sign up with LinkedIn"}
          </Button>
          {errors.linkedin && (
            <FieldDescription className="text-destructive">
              {errors.linkedin}
            </FieldDescription>
          )}

          <FieldDescription className="px-6 text-center">
            Already have an account? <a href="/signin">Sign in</a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
