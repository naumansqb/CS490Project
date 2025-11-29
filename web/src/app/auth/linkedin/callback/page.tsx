"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase/firebaseConfig";

export default function LinkedInCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = searchParams.get("token");
        const errorParam = searchParams.get("error");

        if (errorParam) {
            setError(errorParam);
            setTimeout(() => {
                router.push("/signin");
            }, 3000);
            return;
        }

        if (!token) {
            setError("No token received");
            setTimeout(() => {
                router.push("/signin");
            }, 3000);
            return;
        }

        const signIn = async () => {
            try {
                const userCredential = await signInWithCustomToken(auth, token);
                const idToken = await userCredential.user.getIdToken();

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/login`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify({ idToken }),
                    }
                );

                if (response.ok) {
                    router.push("/dashboard");
                } else {
                    const errorData = await response.json();
                    setError(errorData.message || "Login failed");
                    setTimeout(() => {
                        router.push("/signin");
                    }, 3000);
                }
            } catch (err: any) {
                console.error("LinkedIn callback error:", err);
                setError(err.message || "Authentication failed");
                setTimeout(() => {
                    router.push("/signin");
                }, 3000);
            }
        };

        signIn();
    }, [searchParams, router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                {error ? (
                    <>
                        <h1 className="text-2xl font-bold text-red-600">Error</h1>
                        <p className="mt-4 text-gray-600">{error}</p>
                        <p className="mt-2 text-sm text-gray-500">Redirecting to sign in...</p>
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold">Completing sign in...</h1>
                        <p className="mt-4 text-gray-600">Please wait while we sign you in.</p>
                    </>
                )}
            </div>
        </div>
    );
}

