import { useState } from "react";
import { useFormik } from "formik";
import { adminLoginSchema, adminSignupSchema } from "../lib/validations";
import { CONFIG } from "../common";

export interface AdminAuthFormValues {
  name: string;
  email: string;
  password: string;
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
          }
        : {
            email: values.email.trim(),
            password: values.password,
          };

      try {
        const response = await fetch(`${CONFIG.BACKEND_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || data.error || "Authentication failed",
          );
        }

        if (isSignUp) {
          setSuccessMessage(
            "Account created successfully! You can now log in.",
          );
          setIsSignUp(false);
          formik.resetForm();
        } else {
          // Store token in localStorage
          if (data.token) {
            localStorage.setItem("admin_token", data.token);
          }
          // Store user info including isFirstTime flag if provided
          if (data.user) {
            localStorage.setItem("admin_user", JSON.stringify(data.user));
          }

          setSuccessMessage("Login successful! Redirecting to dashboard...");
          setTimeout(() => {
            window.location.href = "/admin/edit";
          }, 800);
        }
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
