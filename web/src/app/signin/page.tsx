"use client";

import { SignInForm } from "../../components/signInPage";

export default function SignInPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
        <a href="#" className="flex items-center gap-2 font-semibold text-slate-800">
            <img src="/Logo/favicon-32x32.png" alt="JobBuddy" className="h-7 w-auto" />
            JobBuddy
        </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="mx-auto w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <SignInForm />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block bg-gradient-to-br from-[#E0F7F7] to-[#CDE4FF]">
        <img
           src="/Logo/Logo.svg"
           alt="JobBuddy"
           className="absolute inset-0 m-auto h-auto w-3/4 object-contain"
        />
      </div>
    </div>
  );
}
