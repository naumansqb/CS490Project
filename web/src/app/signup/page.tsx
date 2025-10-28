"use client";

import { SignupForm } from "@/components/signUpPage";

export default function signUpPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-semibold text-slate-800">
            <img src="/Logo/favicon-32x32.png" alt="JobBuddy" className="h-7 w-auto" />
            JobBuddy
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="mx-auto w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <SignupForm />
          </div>
        </div>
      </div>
        <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-[#E0F7F7] to-[#CDE4FF]">
         <img src="/Logo/Logo.svg" alt="JobBuddy" className="w-3/4 max-w-[520px] object-contain" />
        </div>
    </div>
  );
}
