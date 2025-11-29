"use client";
import { auth } from "@/lib/firebase/firebaseConfig";
import { useState } from "react";
import { deleteUserAccount } from "@/lib/firebase/firebase-auth-service";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DeleteAccountModal({
    isOpen,
    onClose,
}: DeleteAccountModalProps) {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    // Check if user is OAuth user or LinkedIn user
    const user = auth.currentUser;
    const isLinkedInUser = user?.uid.startsWith('linkedin_') ||
        (user?.providerData.length === 0) ||
        (!user?.providerData.some(p => p.providerId === 'password' || p.providerId === 'google.com' || p.providerId === 'github.com'));
    const isOAuthUser = !isLinkedInUser && user?.providerData.some(
        provider => provider.providerId !== 'password'
    );
    const providerName = isLinkedInUser ? 'LinkedIn' : (user?.providerData[0]?.providerId?.replace('.com', '') || 'provider');

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsDeleting(true);

        try {
            const user = auth.currentUser;

            if (!user) {
                setError("No user logged in");
                setIsDeleting(false);
                return;
            }

            if (confirmText !== 'DELETE') {
                setError('Please type DELETE to confirm');
                setIsDeleting(false);
                return;
            }

            if (!isLinkedInUser && !isOAuthUser && !password) {
                setError('Password is required');
                setIsDeleting(false);
                return;
            }

            const result = await deleteUserAccount((isLinkedInUser || isOAuthUser) ? undefined : password);

            if (!result.success) {
                setError(result.error?.message || "Failed to delete account");
                setIsDeleting(false);
                return;
            }

            try {
                const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/users/send-deletion-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: user.email,
                        userName: user.displayName || 'User'
                    })
                });

                if (!emailResponse.ok) {
                    console.warn('Failed to send deletion email, but account was deleted');
                }
            } catch (emailError) {
                console.warn('Email send failed:', emailError);
            }

            // Account deletion is handled by deleteUserAccount function
            // It will delete both Firebase user and database records
            router.push("/signin");

        } catch (err: any) {
            setError("An unexpected error occurred");
            console.error("Delete account error:", err);
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Delete Account
                </h2>

                <div className="mb-6 space-y-3">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-sm text-red-800 font-semibold">⚠️ Warning</p>
                        <p className="text-sm text-red-700 mt-1">
                            This action is <strong>immediate and permanent</strong>. All your
                            data will be deleted and cannot be recovered.
                        </p>
                    </div>

                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                        <li>Your account will be permanently deleted</li>
                        <li>All profile information will be removed</li>
                        <li>All application data will be lost</li>
                        <li>You will be immediately logged out</li>
                        <li>This action cannot be undone</li>
                    </ul>
                </div>

                <form onSubmit={handleDelete} className="space-y-4">
                    {/* Password field - only for email/password users */}
                    {!isLinkedInUser && !isOAuthUser && (
                        <div>
                            <Label htmlFor="confirm-password">
                                Enter your password to confirm
                            </Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                disabled={isDeleting}
                                className="mt-1"
                            />
                        </div>
                    )}

                    {/* OAuth users see different message */}
                    {(isLinkedInUser || isOAuthUser) && (
                        <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                            <p className="text-sm text-blue-800">
                                You signed in with <strong>{providerName}</strong>.
                                {isLinkedInUser
                                    ? " Your account will be deleted immediately after confirmation."
                                    : ` You'll need to sign in again with ${providerName} to confirm deletion.`
                                }
                            </p>
                        </div>
                    )}

                    {/* Confirmation text for all users */}
                    <div>
                        <Label htmlFor="confirm-delete">
                            Type <span className="font-bold text-red-600">DELETE</span> to confirm
                        </Label>
                        <Input
                            id="confirm-delete"
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type DELETE"
                            required
                            disabled={isDeleting}
                            className="mt-1"
                        />
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isDeleting || confirmText !== 'DELETE'}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Deleting..." : "Delete Account"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}