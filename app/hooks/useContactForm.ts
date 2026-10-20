import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CONFIG } from "../common";
import { nameValidation, emailValidation } from "../lib/validations";
import {
  parsePhoneNumber,
  CountryCode,
  isValidPhoneNumber,
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js/max";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import mobileExamples from "libphonenumber-js/mobile/examples";

export interface ContactFormValues {
  name: string;
  email: string;
  countryIso: CountryCode; // e.g. "IN", "US", "GB"
  countryCode: string; // e.g. "+91", "+1"
  phone: string; // national number only (e.g. "9876543210")
  reason: string;
  customReason?: string;
  message: string;
}

export interface CountryOption {
  code: CountryCode;
  dialCode: string;
  flagUrl: string;
  mobileLength: number;
}

// Key prioritized countries shown at top of dropdown
const PRIORITY_COUNTRIES: CountryCode[] = [
  "IN",
  "US",
  "GB",
  "AE",
  "SG",
  "CA",
  "AU",
  "DE",
];

// Non-standard ISO territory codes without separate official flags on FlagCDN
const EXCLUDED_OR_SPECIAL_CODES: CountryCode[] = ["AC", "TA"];

// All countries available worldwide from libphonenumber-js, with priority countries first
const allCountryCodes = getCountries().filter(
  (c) => !EXCLUDED_OR_SPECIAL_CODES.includes(c),
);
const sortedCountryCodes = [
  ...PRIORITY_COUNTRIES,
  ...allCountryCodes.filter((c) => !PRIORITY_COUNTRIES.includes(c)),
];

export const COUNTRY_OPTIONS: CountryOption[] = sortedCountryCodes.map(
  (code) => {
    let dialCode = "+1";
    try {
      dialCode = `+${getCountryCallingCode(code)}`;
    } catch {
      // fallback
    }

    const exampleNum = (mobileExamples as Record<string, string>)[code];
    const mobileLength = exampleNum ? exampleNum.length : 10;

    return {
      code,
      dialCode,
      flagUrl: `https://flagcdn.com/w40/${code.toLowerCase()}.png`,
      mobileLength,
    };
  },
);

const initialValues: ContactFormValues = {
  name: "",
  email: "",
  countryIso: "IN",
  countryCode: "+91",
  phone: "",
  reason: "Hiring / Full-Time Role",
  customReason: "",
  message: "",
};

export const REACH_OUT_REASONS = [
  "Hiring / Full-Time Role",
  "Freelance Project",
  "Personal / Open Source Collaboration",
  "UI / UX Design Consultation",
  "Technical Advisory",
  "General Inquiry",
  "Other",
] as const;

export function useContactForm() {
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(80, "Name is too long")
      .required("Name is required"),
    email: Yup.string()
      .trim()
      .email("Enter a valid email address")
      .required("Email is required"),
    countryIso: Yup.string().required(),
    countryCode: Yup.string().required(),
    phone: Yup.string()
      .trim()
      .test(
        "is-valid-country-phone",
        "Enter a valid phone number",
        function (val) {
          if (!val || val.trim() === "") return true; // Phone is optional
          try {
            const parentValues = this.parent as ContactFormValues;
            const countryIso = (parentValues.countryIso || "IN") as CountryCode;
            const cleanDigits = val.replace(/\D/g, "");

            // Find country standard mobile length
            const exampleNum = (mobileExamples as Record<string, string>)[
              countryIso
            ];
            const expectedLength = exampleNum ? exampleNum.length : 10;

            // 1. Exact match with country's national mobile length (e.g. 10 digits for IN, 10 for US, 9 for AE)
            if (cleanDigits.length === expectedLength) {
              return true;
            }

            // 2. Trunk/International prefix for US & CA (11 digits starting with 1: e.g. 14155552671)
            if (
              (countryIso === "US" || countryIso === "CA") &&
              cleanDigits.length === 11 &&
              cleanDigits.startsWith("1")
            ) {
              return true;
            }

            // 3. Leading trunk "0" common in UK, Germany, Australia, UAE (length === expectedLength + 1)
            if (
              cleanDigits.length === expectedLength + 1 &&
              cleanDigits.startsWith("0")
            ) {
              return true;
            }

            // 4. Fallback check with libphonenumber-js standard parser
            if (isValidPhoneNumber(cleanDigits, countryIso)) {
              return true;
            }

            return false;
          } catch {
            return false;
          }
        },
      ),
    reason: Yup.string().required("Please select a reason"),
    customReason: Yup.string().when("reason", {
      is: "Other",
      then: (schema) =>
        schema.trim().required("Please specify your reason for reaching out"),
      otherwise: (schema) => schema.notRequired(),
    }),
    message: Yup.string()
      .trim()
      .min(10, "Minimum 10 characters required")
      .max(3000, "Maximum 3000 characters exceeded")
      .required("Message is required"),
  });

  const formik = useFormik<ContactFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setSubmitError(null);
      try {
        const finalReason =
          values.reason === "Other" && values.customReason?.trim()
            ? `Other: ${values.customReason.trim()}`
            : values.reason;

        // Backend Payload separates countryCode and phone cleanly:
        const payload = {
          name: values.name,
          email: values.email,
          countryCode: values.countryCode, // e.g. "+91"
          phoneNumber: values.phone, // e.g. "9876543210"
          fullPhoneNumber: values.phone
            ? `${values.countryCode}${values.phone}`
            : null,
          reason: finalReason,
          message: values.message,
        };

        const res = await fetch(`${CONFIG.BACKEND_URL}/api/contact`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to send message");
        }

        setIsSubmitted(true);
        resetForm();
      } catch (err: any) {
        setSubmitError(
          err.message || "Failed to send message. Please check your connection and try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const currentCountry =
    COUNTRY_OPTIONS.find((c) => c.code === formik.values.countryIso) ||
    COUNTRY_OPTIONS[0];

  const handleCountryChange = (countryIso: CountryCode) => {
    const found = COUNTRY_OPTIONS.find((c) => c.code === countryIso);
    if (found) {
      formik.setFieldValue("countryIso", found.code);
      formik.setFieldValue("countryCode", found.dialCode);
    }
    // Re-validate phone if it has content
    if (formik.values.phone) {
      setTimeout(() => formik.validateField("phone"), 50);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only accept numeric characters, do not restrict length
    const digitsOnly = e.target.value.replace(/\D/g, "");
    formik.setFieldValue("phone", digitsOnly);
    // Mark as touched so errors appear immediately if length is invalid
    if (!formik.touched.phone) {
      formik.setFieldTouched("phone", true, false);
    }
  };

  const resetSubmission = () => {
    setIsSubmitted(false);
    setSubmitError(null);
  };

  return {
    formik,
    isSubmitting: formik.isSubmitting,
    isSubmitted,
    submitError,
    resetSubmission,
    reasons: REACH_OUT_REASONS,
    countryOptions: COUNTRY_OPTIONS,
    currentCountry,
    handleCountryChange,
    handlePhoneChange,
  };
}
