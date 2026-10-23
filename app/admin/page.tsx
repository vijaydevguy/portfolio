"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "../hooks/useAdminAuth";

export default function AdminAuthPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    isSignUp,
    showPassword,
    serverError,
    successMessage,
    isLoading,
    formik,
    toggleAuthMode,
    togglePasswordVisibility,
  } = useAdminAuth();

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Brand / Back Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        {/* return to home */}
        {/* <Link
          href="/"
          className="text-xs uppercase tracking-widest text-[#1D4ED8] font-bold px-3 py-1 rounded-full bg-blue-50 border border-blue-100 inline-block mb-3"
        >
          ← Return to Portfolio
        </Link> */}
        <h1 className="text-3xl font-extrabold text-zinc-950 font-heading">
          {isSignUp ? "Create an Account" : "Admin Portal"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isSignUp
            ? "Sign up to manage your custom portfolio workspace"
            : "Sign in with your email to access your management dashboard"}
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full sm:max-w-md bg-white border border-zinc-200/90 rounded-2xl shadow-sm p-6 sm:p-8">
        <form onSubmit={formik.handleSubmit} className="space-y-1" suppressHydrationWarning>
          {/* Optional Name Field (only shown during Sign Up) */}
          {mounted && isSignUp && (
            <>
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. John Doe"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  suppressHydrationWarning
                  className={`form-input ${
                    formik.touched.name && formik.errors.name ? "form-input-error" : ""
                  }`}
                />
                {formik.touched.name && formik.errors.name && (
                  <span className="form-error-msg">{formik.errors.name}</span>
                )}
              </div>

              {/* Role Dropdown (admin / user) */}
              <div className="form-group">
                <label htmlFor="role" className="form-label">
                  Account Role
                </label>
                <div className="relative">
                  <select
                    id="role"
                    name="role"
                    value={formik.values.role}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    suppressHydrationWarning
                    className="form-input appearance-none pr-10 cursor-pointer bg-white"
                  >
                    <option value="admin">Admin (Full Control)</option>
                    <option value="user">User (Standard Profile)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              suppressHydrationWarning
              className={`form-input ${
                formik.touched.email && formik.errors.email ? "form-input-error" : ""
              }`}
            />
            {formik.touched.email && formik.errors.email && (
              <span className="form-error-msg">{formik.errors.email}</span>
            )}
          </div>

          {/* Password Field with Eye Toggle */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                suppressHydrationWarning
                className={`form-input !pr-11 ${
                  formik.touched.password && formik.errors.password ? "form-input-error" : ""
                }`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-zinc-700 transition-colors p-1 rounded-md focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <span className="form-error-msg">{formik.errors.password}</span>
            )}
          </div>

          {/* Zero-Jump Server Response Banner Container (Always reserves space below password) */}
          <div className="min-h-[46px] flex items-center mb-1">
            {serverError && (
              <div className="w-full px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-snug">
                {serverError}
              </div>
            )}
            {successMessage && (
              <div className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold leading-snug">
                {successMessage}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading}
              suppressHydrationWarning
              className="btn-primary w-full !py-3.5 !rounded-xl !text-sm !font-semibold shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing...
                </span>
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>

        {/* Toggle between Login and Sign Up */}
        <div className="mt-6 pt-5 border-t border-zinc-200/80 text-center">
          <p className="text-xs text-slate-500" suppressHydrationWarning>
            {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-[#1D4ED8] font-bold hover:underline ml-1 cursor-pointer"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
