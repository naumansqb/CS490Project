"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    verifyPasswordResetToken,
    completePasswordReset,
    validatePassword,
    signInWithEmail,
} from "@/lib/firebase/firebase-auth-service";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [code, setCode] = useState<string | null>(null);
    const [email, setEmail] = useState<string>("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [error, setError] = useState("");
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [tokenError, setTokenError] = useState("");

    useEffect(() => {
        const resetCode = searchParams.get("oobCode");

        if (!resetCode) {
            setTokenError("Invalid or missing reset link.");
            setIsVerifying(false);
            return;
        }

        setCode(resetCode);
        verifyToken(resetCode);
    }, [searchParams]);

    const verifyToken = async (resetCode: string) => {
        const result = await verifyPasswordResetToken(resetCode);

        if (result.success && result.email) {
            setEmail(result.email);
            setIsVerifying(false);
        } else {
            setTokenError(
                result.error?.message || "This reset link is invalid or has expired."
            );
            setIsVerifying(false);
        }
    };

    const handlePasswordChange = (value: string) => {
        setNewPassword(value);
        const validation = validatePassword(value);
        setPasswordErrors(validation.errors);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const validation = validatePassword(newPassword);
        if (!validation.isValid) {
            setPasswordErrors(validation.errors);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!code) {
            setError("Invalid reset code");
            return;
        }

        setIsLoading(true);

        try {
            const result = await completePasswordReset(code, newPassword);

            if (result.success) {
                const signInResult = await signInWithEmail(email, newPassword);

                if (signInResult.success) {
                    router.push("/dashboard");
                } else {
                    router.push("/signin");
                }
            } else {
                setError(result.error?.message || "Failed to reset password");
            }
        } catch (err: any) {
            setError("An unexpected error occurred");
            console.error("Password reset error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    <p className="mt-4 text-gray-600">Verifying reset link...</p>
                </div>
            </div>
        );
    }

    if (tokenError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
                <div className="w-full max-w-md space-y-8 text-center">
                    <div>
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                            Invalid Reset Link
                        </h2>
                        <p className="mt-2 text-sm text-red-600">{tokenError}</p>
                        <p className="mt-4 text-sm text-gray-600">
                            The link may have expired or already been used.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <Link href="/forgot-password">
                            <Button className="w-full">Request New Reset Link</Button>
                        </Link>
                        <Link href="/signin">
                            <Button variant="outline" className="w-full">
                                Back to Sign In
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Set New Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your new password for {email}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                name="new-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={newPassword}
                                onChange={(e) => handlePasswordChange(e.target.value)}
                                placeholder="Enter new password"
                                disabled={isLoading}
                                className="mt-1"
                            />
                            {passwordErrors.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {passwordErrors.map((err, index) => (
                                        <p key={index} className="text-xs text-red-600">
                                            • {err}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                disabled={isLoading}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Button
                            type="submit"
                            disabled={isLoading || passwordErrors.length > 0}
                            className="w-full"
                        >
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </Button>

                        <div className="text-center">
                            <Link
                                href="/signin"
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                                Back to sign in
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}