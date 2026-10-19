import { useState } from "react";
import { useFormik } from "formik";
import { adminLoginSchema, adminSignupSchema } from "../lib/validations";
import { CONFIG } from "../common";

export interface AdminAuthFormValues {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
}

export function useAdminAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formik = useFormik<AdminAuthFormValues>({
    initialValues: {
      name: "",
      email: "",
      password: "",
      role: "admin",
    },
    validationSchema: isSignUp ? adminSignupSchema : adminLoginSchema,
    onSubmit: async (values) => {
      setServerError(null);
      setSuccessMessage(null);
      setIsLoading(true);

      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
      const payload = isSignUp
        ? {
            name: values.name.trim() || undefined,
            email: values.email.trim(),
            password: values.password,
            role: values.role,
          }
        : {
            email: values.email.trim(),
            password: values.password,
          };

      try {
        const rawBackendUrl = (CONFIG.BACKEND_URL || "http://localhost:5000")
          .replace(/["';]/g, "")
          .replace(/\/+$/, "");

        const response = await fetch(`${rawBackendUrl}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const contentType = response.headers.get("content-type") || "";
        let data;

        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          throw new Error(
            response.status === 404
              ? "Backend API endpoint not found. Ensure backend server is running on port 5000."
              : `Server returned non-JSON response (${response.status}). ${text.slice(0, 100)}`,
          );
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || data.error || "Authentication failed",
          );
        }

        // Auto-login upon registration or regular login
        if (data.token) {
          localStorage.setItem("admin_token", data.token);
        }
        if (data.user) {
          localStorage.setItem("admin_user", JSON.stringify(data.user));
        }

        setSuccessMessage(
          isSignUp
            ? "Account created successfully! Redirecting to dashboard..."
            : "Login successful! Redirecting to dashboard...",
        );

        setTimeout(() => {
          window.location.href = "/admin/edit";
        }, 600);
      } catch (err: unknown) {
        const error = err as Error;
        setServerError(
          error.message || "An unexpected error occurred. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
  });

  const toggleAuthMode = () => {
    setIsSignUp((prev) => !prev);
    setServerError(null);
    setSuccessMessage(null);
    formik.resetForm();
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return {
    isSignUp,
    showPassword,
    serverError,
    successMessage,
    isLoading,
    formik,
    toggleAuthMode,
    togglePasswordVisibility,
  };
}
