import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { createUserWithEmailAndPassword, GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { auth } from "../../firebaseConfig";
import { useRouter } from "next/navigation";


export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [matchError, setMatchError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [githubError, setGithubError] = useState("");

    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError("");
        setPasswordError("");

        if (password !== confirmPassword) {
            setMatchError("Passwords do not match");
            return;
        }
        setMatchError("");  
        
        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up 
            const user = userCredential.user;
            router.push("/dashboard");
        })
        .catch((error) => {
            console.log(error.code);
            if (error.code === 'auth/email-already-in-use') {
                setEmailError("Email already in use");
            }
            else if (error.code === 'auth/invalid-email') {
                setEmailError("Invalid email address");
            }
            else if (error.code === 'auth/password-does-not-meet-requirements') {
                setPasswordError("Invalid password. ");
            }
        });
    }

    const gitHubProvider = new GithubAuthProvider();
    const handleGitHubSignUp = () => {
        setGithubError("");

        signInWithPopup(auth, gitHubProvider)
        .then((result) => {
            const credential = GithubAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;
            const user = result.user;
            router.push("/dashboard");
        }).catch((error) => {
            const errorCode = error.code;
            console.log(errorCode);
            if (errorCode === 'auth/account-exists-with-different-credential')
            {
                setGithubError("An account already exists with the same email address!.");
            }
        });
    }


    return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className) } {...props}>
        <FieldGroup >
            <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-sm text-balance">
                Fill in the form below to create your account
                </p>
            </div>
            <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input id="name" type="text" placeholder="John Doe" required />
            </Field>
            <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    onChange={(e) => setEmail(e.target.value)}
                    className={emailError ? "border-destructive" : ""}  
                    required
                 />
                <FieldDescription>{emailError ? emailError : ""}</FieldDescription>
            </Field>
            <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input 
                    id="password" 
                    type="password" 
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    className={matchError ? "border-destructive" : passwordError ? "border-destructive" : ""}  
                />
                <FieldDescription>{passwordError ? passwordError : ""}Least 8 characters long, with at least 1 uppercase letter and 1 number.</FieldDescription>
            </Field>
            <Field>
                <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                <Input 
                    id="confirm-password" 
                    type="password" 
                    required
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className={matchError ? "border-destructive" : ""}
                />
                <FieldDescription className={`${matchError ? "font-bold" : ""}`}>{matchError ? matchError : "Please confirm your password"}</FieldDescription>
            </Field>
            <Field>
                <Button 
                type="submit" className="cursor-pointer">Create Account
                </Button>
            </Field>
            <FieldSeparator>Or continue with</FieldSeparator>
            <Field>
                <Button variant="outline" type="button" className="cursor-pointer">
                    <Image src="/Google.svg" alt="Google icon" width={20} height={20} />
                    Sign up with Google
                </Button>
                <FieldDescription>{githubError ? "This email is already in use. Try again." : ""}</FieldDescription>
                <Button variant="outline" type="button" onClick={handleGitHubSignUp} className={githubError ? "border-destructive cursor-pointer" : "cursor-pointer"}>
                    <Image src="/github.svg" alt="Github Logo" width={20} height={20} />
                    Sign up with GitHub
                </Button>
                <FieldDescription className="px-6 text-center">
                    Already have an account? <a href="#">Sign in</a>
                </FieldDescription>
            </Field>
        </FieldGroup>
    </form>
    )
}
