import * as Yup from "yup";

/**
 * Reusable Field Validations for Forms Across the Application
 */
export const emailValidation = Yup.string()
  .trim()
  .email("Enter a valid email address")
  .required("Email is required");

export const passwordValidation = Yup.string()
  .min(6, "Password must be at least 6 characters")
  .required("Password is required");

export const nameValidation = Yup.string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name is too long")
  .required("Name is required");

export const requiredText = (fieldName: string, min = 2, max = 100) =>
  Yup.string()
    .trim()
    .min(min, `${fieldName} must be at least ${min} characters`)
    .max(max, `${fieldName} must be at most ${max} characters`)
    .required(`${fieldName} is required`);

export const urlValidation = Yup.string()
  .trim()
  .url("Enter a valid URL (e.g. https://...)");

export const nameOptionalValidation = Yup.string()
  .trim()
  .max(80, "Name is too long");

/**
 * Shared Form Schemas
 */
export const adminLoginSchema = Yup.object().shape({
  email: emailValidation,
  password: passwordValidation,
});

export const adminSignupSchema = Yup.object().shape({
  name: nameOptionalValidation,
  email: emailValidation,
  password: passwordValidation,
});
