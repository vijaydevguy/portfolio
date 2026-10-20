"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CONFIG } from "../../common";
import toast from "react-hot-toast";
import {
  LuCalendar,
  LuPhone,
  LuMail,
  LuMessageCircle,
  LuSave,
  LuExternalLink,
  LuCheck,
  LuActivity,
  LuEye,
  LuEyeOff,
} from "react-icons/lu";
import {
  CountryCode,
  isValidPhoneNumber,
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js/max";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import mobileExamples from "libphonenumber-js/mobile/examples";

export interface CountryOption {
  code: CountryCode;
  dialCode: string;
  flagUrl: string;
  mobileLength: number;
}

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

const EXCLUDED_OR_SPECIAL_CODES: CountryCode[] = ["AC", "TA"];

const allCountryCodes = getCountries().filter(
  (c) => !EXCLUDED_OR_SPECIAL_CODES.includes(c),
);

const sortedCountryCodes = [
  ...PRIORITY_COUNTRIES,
  ...allCountryCodes.filter((c) => !PRIORITY_COUNTRIES.includes(c)),
];

const COUNTRY_OPTIONS: CountryOption[] = sortedCountryCodes.map((code) => {
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
});

interface CommonSettingsState {
  // Cal.com
  calComLink: string;
  calComNamespace: string;
  isCalComPublished: boolean;

  // Direct Phone
  phoneNumber: string;
  phoneDisplay: string;
  phoneCountryIso: CountryCode;
  phoneCountryCode: string;
  phoneNational: string;
  isPhonePublished: boolean;

  // WhatsApp Phone
  whatsappNumber: string;
  whatsappCountryIso: CountryCode;
  whatsappCountryCode: string;
  whatsappNational: string;
  whatsappPrefilledMessage: string;
  isWhatsappPublished: boolean;

  // Email
  email: string;
  isEmailPublished: boolean;

  // Google Analytics
  googleAnalyticsId: string;
  isAnalyticsPublished: boolean;
}

export default function AdminSettingsManager() {
  const [formData, setFormData] = useState<CommonSettingsState>({
    calComLink: "vijay-kumar/30min",
    calComNamespace: "quick-chat",
    isCalComPublished: true,

    phoneNumber: "+919876543210",
    phoneDisplay: "+91 98765 43210",
    phoneCountryIso: "IN",
    phoneCountryCode: "+91",
    phoneNational: "9876543210",
    isPhonePublished: true,

    whatsappNumber: "919876543210",
    whatsappCountryIso: "IN",
    whatsappCountryCode: "+91",
    whatsappNational: "9876543210",
    whatsappPrefilledMessage:
      "Hi Vijay, I came across your portfolio and would like to discuss an opportunity with you!",
    isWhatsappPublished: true,

    email: "vijaydevguy@gmail.com",
    isEmailPublished: true,

    googleAnalyticsId: CONFIG.GA_TRACKING_ID || "G-GY8ENHWSSB",
    isAnalyticsPublished: true,
  });

  // Direct Phone validation states
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState<boolean>(false);

  // WhatsApp Phone validation states
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [whatsappTouched, setWhatsappTouched] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Selected country details for Direct Phone
  const currentPhoneCountry = useMemo(() => {
    return (
      COUNTRY_OPTIONS.find((c) => c.code === formData.phoneCountryIso) ||
      COUNTRY_OPTIONS[0]
    );
  }, [formData.phoneCountryIso]);

  // Selected country details for WhatsApp Phone
  const currentWhatsappCountry = useMemo(() => {
    return (
      COUNTRY_OPTIONS.find((c) => c.code === formData.whatsappCountryIso) ||
      COUNTRY_OPTIONS[0]
    );
  }, [formData.whatsappCountryIso]);

  // Validate phone number strictly using the exact landing page algorithm
  const validatePhone = (digits: string, countryIso: CountryCode): string | null => {
    const cleanDigits = digits.replace(/\D/g, "");
    if (!cleanDigits) {
      return "Phone number is required";
    }

    try {
      const exampleNum = (mobileExamples as Record<string, string>)[countryIso];
      const expectedLength = exampleNum ? exampleNum.length : 10;

      // 1. Exact match with country's national mobile length
      if (cleanDigits.length === expectedLength) {
        return null;
      }

      // 2. Trunk/International prefix for US & CA (11 digits starting with 1)
      if (
        (countryIso === "US" || countryIso === "CA") &&
        cleanDigits.length === 11 &&
        cleanDigits.startsWith("1")
      ) {
        return null;
      }

      // 3. Leading trunk "0" common in UK, Germany, Australia, UAE
      if (cleanDigits.length === expectedLength + 1 && cleanDigits.startsWith("0")) {
        return null;
      }

      // 4. Fallback check with libphonenumber-js standard parser
      if (isValidPhoneNumber(cleanDigits, countryIso)) {
        return null;
      }

      return `Enter a valid ${countryIso} phone number (${expectedLength} digits)`;
    } catch {
      return "Invalid phone number format";
    }
  };

  // Fetch current settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/settings/common`);
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          const d = json.data;

          // Parse Direct Phone
          let rawPhoneIso: CountryCode = (d.phoneCountryIso as CountryCode) || "IN";
          let phoneDial = d.phoneCountryCode || "+91";
          let phoneNational = d.phoneNational || "";

          if (!phoneNational && d.phoneNumber) {
            const raw = d.phoneNumber.trim();
            if (raw.startsWith("+91")) {
              rawPhoneIso = "IN";
              phoneDial = "+91";
              phoneNational = raw.replace("+91", "").replace(/\D/g, "");
            } else if (raw.startsWith("+1")) {
              rawPhoneIso = "US";
              phoneDial = "+1";
              phoneNational = raw.replace("+1", "").replace(/\D/g, "");
            } else {
              phoneNational = raw.replace(/\D/g, "");
            }
          }

          // Parse WhatsApp Phone
          let rawWhatsappIso: CountryCode = (d.whatsappCountryIso as CountryCode) || "IN";
          let whatsappDial = d.whatsappCountryCode || "+91";
          let whatsappNational = d.whatsappNational || "";

          if (!whatsappNational && d.whatsappNumber) {
            const raw = d.whatsappNumber.trim().replace(/\D/g, "");
            if (raw.startsWith("91") && raw.length >= 12) {
              rawWhatsappIso = "IN";
              whatsappDial = "+91";
              whatsappNational = raw.slice(2);
            } else if (raw.startsWith("1") && raw.length >= 11) {
              rawWhatsappIso = "US";
              whatsappDial = "+1";
              whatsappNational = raw.slice(1);
            } else {
              whatsappNational = raw;
            }
          }

          const combinedWhatsappApiNumber = `${whatsappDial.replace(/\+/g, "")}${whatsappNational}`;

          setFormData({
            calComLink: d.calComLink || "vijay-kumar/30min",
            calComNamespace: d.calComNamespace || "quick-chat",
            isCalComPublished: d.isCalComPublished !== false,

            phoneNumber: d.phoneNumber || `${phoneDial}${phoneNational}`,
            phoneDisplay: d.phoneDisplay || `${phoneDial} ${phoneNational}`,
            phoneCountryIso: rawPhoneIso,
            phoneCountryCode: phoneDial,
            phoneNational: phoneNational,
            isPhonePublished: d.isPhonePublished !== false,

            whatsappNumber: d.whatsappNumber || combinedWhatsappApiNumber,
            whatsappCountryIso: rawWhatsappIso,
            whatsappCountryCode: whatsappDial,
            whatsappNational: whatsappNational,
            whatsappPrefilledMessage:
              d.whatsappPrefilledMessage ||
              "Hi Vijay, I came across your portfolio and would like to discuss an opportunity with you!",
            isWhatsappPublished: d.isWhatsappPublished !== false,

            email: d.email || "vijaydevguy@gmail.com",
            isEmailPublished: d.isEmailPublished !== false,

            googleAnalyticsId: d.googleAnalyticsId || CONFIG.GA_TRACKING_ID || "G-GY8ENHWSSB",
            isAnalyticsPublished: d.isAnalyticsPublished !== false,
          });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // --- Handlers for Direct Phone ---
  const handlePhoneCountryChange = (newIso: CountryCode) => {
    const selected = COUNTRY_OPTIONS.find((c) => c.code === newIso);
    const dial = selected ? selected.dialCode : "+1";
    const newNational = formData.phoneNational;
    const combinedE164 = `${dial}${newNational.replace(/\D/g, "")}`;
    const display = `${dial} ${newNational}`;

    setFormData((prev) => ({
      ...prev,
      phoneCountryIso: newIso,
      phoneCountryCode: dial,
      phoneNumber: combinedE164,
      phoneDisplay: display,
    }));

    if (phoneTouched) {
      setPhoneError(validatePhone(newNational, newIso));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanDigits = e.target.value.replace(/\D/g, "");
    const dial = formData.phoneCountryCode;
    const combinedE164 = `${dial}${cleanDigits}`;
    const display = `${dial} ${cleanDigits}`;

    setFormData((prev) => ({
      ...prev,
      phoneNational: cleanDigits,
      phoneNumber: combinedE164,
      phoneDisplay: display,
    }));

    if (phoneTouched) {
      setPhoneError(validatePhone(cleanDigits, formData.phoneCountryIso));
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    setPhoneError(validatePhone(formData.phoneNational, formData.phoneCountryIso));
  };

  // --- Handlers for WhatsApp Phone ---
  const handleWhatsappCountryChange = (newIso: CountryCode) => {
    const selected = COUNTRY_OPTIONS.find((c) => c.code === newIso);
    const dial = selected ? selected.dialCode : "+1";
    const newNational = formData.whatsappNational;
    const dialNoPlus = dial.replace(/\+/g, "");
    const combinedWhatsappNumber = `${dialNoPlus}${newNational.replace(/\D/g, "")}`;

    setFormData((prev) => ({
      ...prev,
      whatsappCountryIso: newIso,
      whatsappCountryCode: dial,
      whatsappNumber: combinedWhatsappNumber,
    }));

    if (whatsappTouched) {
      setWhatsappError(validatePhone(newNational, newIso));
    }
  };

  const handleWhatsappNationalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanDigits = e.target.value.replace(/\D/g, "");
    const dial = formData.whatsappCountryCode;
    const dialNoPlus = dial.replace(/\+/g, "");
    const combinedWhatsappNumber = `${dialNoPlus}${cleanDigits}`;

    setFormData((prev) => ({
      ...prev,
      whatsappNational: cleanDigits,
      whatsappNumber: combinedWhatsappNumber,
    }));

    if (whatsappTouched) {
      setWhatsappError(validatePhone(cleanDigits, formData.whatsappCountryIso));
    }
  };

  const handleWhatsappBlur = () => {
    setWhatsappTouched(true);
    setWhatsappError(validatePhone(formData.whatsappNational, formData.whatsappCountryIso));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check Direct Phone validation if published or filled
    if (formData.isPhonePublished || formData.phoneNational) {
      const pErr = validatePhone(formData.phoneNational, formData.phoneCountryIso);
      if (pErr) {
        setPhoneTouched(true);
        setPhoneError(pErr);
        toast.error(`Phone validation error: ${pErr}`);
        return;
      }
    }

    // Check WhatsApp validation if published or filled
    if (formData.isWhatsappPublished || formData.whatsappNational) {
      const wErr = validatePhone(formData.whatsappNational, formData.whatsappCountryIso);
      if (wErr) {
        setWhatsappTouched(true);
        setWhatsappError(wErr);
        toast.error(`WhatsApp validation error: ${wErr}`);
        return;
      }
    }

    const token = localStorage.getItem("admin_token");
    if (!token) {
      toast.error("You must be logged in as an admin to save settings.");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/settings/common`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("All settings and publish statuses saved successfully!");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        toast.error(json.message || "Failed to update settings");
      }
    } catch (err: any) {
      toast.error(err?.message || "Network error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 space-y-4">
          <div className="h-6 w-48 bg-zinc-200 rounded-lg" />
          <div className="h-4 w-96 bg-zinc-100 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white border border-zinc-200/80 rounded-2xl p-6" />
          <div className="h-64 bg-white border border-zinc-200/80 rounded-2xl p-6" />
          <div className="h-64 bg-white border border-zinc-200/80 rounded-2xl p-6" />
          <div className="h-64 bg-white border border-zinc-200/80 rounded-2xl p-6" />
          <div className="h-64 bg-white border border-zinc-200/80 rounded-2xl p-6 md:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 font-heading">
            Common Settings & Integrations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centrally manage your Cal.com scheduling link, WhatsApp, phone numbers, contact email, and Google Analytics.
            Both Phone and WhatsApp fields utilize the exact unified country flag component and validation from the landing page.
          </p>
        </div>

        {saveSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-fadeIn self-start sm:self-auto">
            <LuCheck className="w-3.5 h-3.5" />
            Changes saved
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Cal.com Integration */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <LuCalendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 font-heading">
                      Cal.com Meeting Link
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Embeddable modal booking for visitors to schedule calls.
                    </p>
                  </div>
                </div>

                {/* Publish Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isCalComPublished}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isCalComPublished: !prev.isCalComPublished,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isCalComPublished ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                  title={
                    formData.isCalComPublished
                      ? "Published (Visible on landing page & contact widget)"
                      : "Unpublished (Hidden from visitors)"
                  }
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.isCalComPublished ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    formData.isCalComPublished
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                  }`}
                >
                  {formData.isCalComPublished ? (
                    <>
                      <LuEye className="w-3 h-3 text-emerald-600" /> Published
                    </>
                  ) : (
                    <>
                      <LuEyeOff className="w-3 h-3 text-zinc-400" /> Unpublished (Hidden)
                    </>
                  )}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="form-label font-semibold text-zinc-800">
                    Cal.com Event Link <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs select-none">
                      cal.com/
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.calComLink}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          calComLink: e.target.value.replace(/^https?:\/\/cal\.com\//, ""),
                        })
                      }
                      placeholder="vijay-kumar/30min"
                      className="form-input bg-zinc-50/60 pl-20 font-mono text-xs"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Example: <code className="text-zinc-600">vijay-kumar/30min</code>
                  </p>
                </div>

                <div>
                  <label className="form-label font-semibold text-zinc-800">
                    Cal.com Namespace (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.calComNamespace}
                    onChange={(e) =>
                      setFormData({ ...formData, calComNamespace: e.target.value })
                    }
                    placeholder="quick-chat"
                    className="form-input bg-zinc-50/60 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {formData.calComLink && (
              <div className="pt-2 border-t border-zinc-100">
                <a
                  href={`https://cal.com/${formData.calComLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  <span>Test booking page</span>
                  <LuExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Card 2: WhatsApp Settings (With EXACT Same Landing Page Phone Component) */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <LuMessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 font-heading">
                      WhatsApp Direct Chat
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Direct WhatsApp chat launch with country flag selector & validation.
                    </p>
                  </div>
                </div>

                {/* Publish Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isWhatsappPublished}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isWhatsappPublished: !prev.isWhatsappPublished,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isWhatsappPublished ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                  title={
                    formData.isWhatsappPublished
                      ? "Published (Visible on floating contact menu)"
                      : "Unpublished (Hidden from visitors)"
                  }
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.isWhatsappPublished ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    formData.isWhatsappPublished
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                  }`}
                >
                  {formData.isWhatsappPublished ? (
                    <>
                      <LuEye className="w-3 h-3 text-emerald-600" /> Published
                    </>
                  ) : (
                    <>
                      <LuEyeOff className="w-3 h-3 text-zinc-400" /> Unpublished (Hidden)
                    </>
                  )}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Unified Landing Page Phone Field for WhatsApp */}
                <div className="relative pb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="adminWhatsappPhone"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-700"
                    >
                      WhatsApp Phone Number <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">
                      Standard E.164
                    </span>
                  </div>

                  {/* Single Border Box housing both Country Select & Number Input */}
                  <div
                    className={`w-full flex items-center rounded-xl border overflow-hidden transition-all ${
                      whatsappTouched && whatsappError
                        ? "border-rose-400 bg-rose-50/20 focus-within:ring-2 focus-within:ring-rose-200"
                        : "border-zinc-200 bg-zinc-50/40 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100"
                    }`}
                  >
                    {/* Country Code Selector with Flag (Dial Code Only) */}
                    <div className="relative flex items-center bg-zinc-100/70 border-r border-zinc-200 hover:bg-zinc-100 transition-colors">
                      <div className="pl-3 flex items-center justify-center pointer-events-none select-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentWhatsappCountry.flagUrl}
                          alt={currentWhatsappCountry.code}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                          className="w-5 h-3.5 object-cover rounded-[2px] shadow-xs"
                        />
                      </div>
                      <select
                        id="adminWhatsappCountryIso"
                        aria-label="WhatsApp Country Code"
                        value={formData.whatsappCountryIso}
                        onChange={(e) => handleWhatsappCountryChange(e.target.value as CountryCode)}
                        className="appearance-none bg-transparent py-2.5 pl-2 pr-7 text-xs font-bold text-zinc-800 cursor-pointer focus:outline-none"
                      >
                        {COUNTRY_OPTIONS.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.code} ({country.dialCode})
                          </option>
                        ))}
                      </select>
                      {/* Dropdown Arrow */}
                      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* National Phone Number Input */}
                    <input
                      id="adminWhatsappPhone"
                      type="tel"
                      inputMode="numeric"
                      placeholder={
                        currentWhatsappCountry.code === "IN"
                          ? "98765 43210"
                          : "National phone number"
                      }
                      value={formData.whatsappNational}
                      onChange={handleWhatsappNationalChange}
                      onBlur={handleWhatsappBlur}
                      className="flex-1 min-w-0 px-3.5 py-2.5 text-xs font-medium text-zinc-900 bg-transparent placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>

                  {/* Absolute Error Message */}
                  {whatsappTouched && whatsappError && (
                    <p className="absolute bottom-0 left-0 text-[11px] text-rose-600 font-medium whitespace-nowrap">
                      {whatsappError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label font-semibold text-zinc-800">
                    Prefilled Chat Message
                  </label>
                  <textarea
                    rows={3}
                    value={formData.whatsappPrefilledMessage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsappPrefilledMessage: e.target.value,
                      })
                    }
                    placeholder="Hi Vijay, I came across your portfolio..."
                    className="form-input bg-zinc-50/60 text-xs resize-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    API Link Target: <code className="text-zinc-600">wa.me/{formData.whatsappNumber}</code>
                  </p>
                </div>
              </div>
            </div>

            {formData.whatsappNumber && (
              <div className="pt-2 border-t border-zinc-100">
                <a
                  href={`https://wa.me/${formData.whatsappNumber}?text=${encodeURIComponent(
                    formData.whatsappPrefilledMessage,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 hover:underline"
                >
                  <span>Test WhatsApp chat ({formData.whatsappNumber})</span>
                  <LuExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Card 3: Phone Number Settings (Uses EXACT same component & validation as landing page) */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <LuPhone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 font-heading">
                      Phone Number & Dialer
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Direct phone call action for visitors with exact landing page validation.
                    </p>
                  </div>
                </div>

                {/* Publish Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isPhonePublished}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isPhonePublished: !prev.isPhonePublished,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isPhonePublished ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                  title={
                    formData.isPhonePublished
                      ? "Published (Visible on floating contact menu)"
                      : "Unpublished (Hidden from visitors)"
                  }
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.isPhonePublished ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    formData.isPhonePublished
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                  }`}
                >
                  {formData.isPhonePublished ? (
                    <>
                      <LuEye className="w-3 h-3 text-emerald-600" /> Published
                    </>
                  ) : (
                    <>
                      <LuEyeOff className="w-3 h-3 text-zinc-400" /> Unpublished (Hidden)
                    </>
                  )}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Landing page identical phone component */}
                <div className="relative pb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="adminPhone"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-700"
                    >
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">
                      Standard E.164
                    </span>
                  </div>

                  {/* Single Border Box housing both Country Select & Number Input */}
                  <div
                    className={`w-full flex items-center rounded-xl border overflow-hidden transition-all ${
                      phoneTouched && phoneError
                        ? "border-rose-400 bg-rose-50/20 focus-within:ring-2 focus-within:ring-rose-200"
                        : "border-zinc-200 bg-zinc-50/40 focus-within:bg-white focus-within:border-[#1D4ED8] focus-within:ring-2 focus-within:ring-blue-100"
                    }`}
                  >
                    {/* Country Code Selector with Flag (Dial Code Only) */}
                    <div className="relative flex items-center bg-zinc-100/70 border-r border-zinc-200 hover:bg-zinc-100 transition-colors">
                      <div className="pl-3 flex items-center justify-center pointer-events-none select-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentPhoneCountry.flagUrl}
                          alt={currentPhoneCountry.code}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                          className="w-5 h-3.5 object-cover rounded-[2px] shadow-xs"
                        />
                      </div>
                      <select
                        id="adminPhoneCountryIso"
                        aria-label="Country Code"
                        value={formData.phoneCountryIso}
                        onChange={(e) => handlePhoneCountryChange(e.target.value as CountryCode)}
                        className="appearance-none bg-transparent py-2.5 pl-2 pr-7 text-xs font-bold text-zinc-800 cursor-pointer focus:outline-none"
                      >
                        {COUNTRY_OPTIONS.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.code} ({country.dialCode})
                          </option>
                        ))}
                      </select>
                      {/* Dropdown Arrow */}
                      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* National Phone Number Input */}
                    <input
                      id="adminPhone"
                      type="tel"
                      inputMode="numeric"
                      placeholder={
                        currentPhoneCountry.code === "IN"
                          ? "98765 43210"
                          : "National phone number"
                      }
                      value={formData.phoneNational}
                      onChange={handlePhoneChange}
                      onBlur={handlePhoneBlur}
                      className="flex-1 min-w-0 px-3.5 py-2.5 text-xs font-medium text-zinc-900 bg-transparent placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>

                  {/* Absolute Error Message */}
                  {phoneTouched && phoneError && (
                    <p className="absolute bottom-0 left-0 text-[11px] text-rose-600 font-medium whitespace-nowrap">
                      {phoneError}
                    </p>
                  )}
                </div>

                {/* Auto-formatted Phone Display Preview (Disabled/Read-only to prevent confusion) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="form-label !mb-0 font-semibold text-zinc-700">
                      Display Preview
                    </label>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/60">
                      Auto-Formatted
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={formData.phoneDisplay || `${formData.phoneCountryCode} ${formData.phoneNational}`}
                    className="form-input bg-zinc-100/80 border-zinc-200 text-zinc-600 font-mono text-xs cursor-not-allowed select-none opacity-80"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Automatically formatted from country dial code and national digits.
                  </p>
                </div>
              </div>
            </div>

            {formData.phoneNumber && (
              <div className="pt-2 border-t border-zinc-100">
                <a
                  href={`tel:${formData.phoneNumber}`}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <span>Test dialer link ({formData.phoneNumber})</span>
                  <LuExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Card 4: Primary Email Settings */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <LuMail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 font-heading">
                      Contact Email
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Primary inbox for notifications and quick replies.
                    </p>
                  </div>
                </div>

                {/* Publish Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isEmailPublished}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isEmailPublished: !prev.isEmailPublished,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isEmailPublished ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                  title={
                    formData.isEmailPublished
                      ? "Published (Used in contact forms and email triggers)"
                      : "Unpublished (Hidden)"
                  }
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.isEmailPublished ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    formData.isEmailPublished
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                  }`}
                >
                  {formData.isEmailPublished ? (
                    <>
                      <LuEye className="w-3 h-3 text-emerald-600" /> Published
                    </>
                  ) : (
                    <>
                      <LuEyeOff className="w-3 h-3 text-zinc-400" /> Unpublished (Hidden)
                    </>
                  )}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="form-label font-semibold text-zinc-800">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="vijaydevguy@gmail.com"
                    className="form-input bg-zinc-50/60 text-xs"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/70 text-[11px] text-slate-500 space-y-1">
                  <p className="font-semibold text-zinc-700">Quick Reply Integration:</p>
                  <p>
                    This email is prefilled as sender or reference when sending email responses from the contact inquiries manager.
                  </p>
                </div>
              </div>
            </div>

            {formData.email && (
              <div className="pt-2 border-t border-zinc-100">
                <a
                  href={`mailto:${formData.email}`}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 hover:text-amber-800 hover:underline"
                >
                  <span>Compose test email ({formData.email})</span>
                  <LuExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Card 5: Google Analytics (Full Width) */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-5 md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                    <LuActivity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 font-heading">
                      Google Analytics 4 (GA4) Tracking
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Measurement ID for tracking traffic, button clicks, section views, and interactions.
                    </p>
                  </div>
                </div>

                {/* Publish Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isAnalyticsPublished}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isAnalyticsPublished: !prev.isAnalyticsPublished,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isAnalyticsPublished ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                  title={
                    formData.isAnalyticsPublished
                      ? "Published (Google Analytics scripts active in production)"
                      : "Unpublished (Analytics tracking paused)"
                  }
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.isAnalyticsPublished ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    formData.isAnalyticsPublished
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                  }`}
                >
                  {formData.isAnalyticsPublished ? (
                    <>
                      <LuEye className="w-3 h-3 text-emerald-600" /> Tracking Active (Published)
                    </>
                  ) : (
                    <>
                      <LuEyeOff className="w-3 h-3 text-zinc-400" /> Tracking Paused (Unpublished)
                    </>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div>
                  <label className="form-label font-semibold text-zinc-800">
                    Google Analytics Measurement ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.googleAnalyticsId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        googleAnalyticsId: e.target.value.trim().toUpperCase(),
                      })
                    }
                    placeholder="G-GY8ENHWSSB"
                    className="form-input bg-zinc-50/60 font-mono text-xs uppercase"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Standard GA4 Measurement ID starts with <code className="text-zinc-600">G-</code> followed by alphanumeric characters.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-[11px] text-slate-600 space-y-1">
                  <p className="font-semibold text-purple-900">Where to find your ID:</p>
                  <p>
                    In your Google Analytics dashboard, navigate to <strong>Admin &gt; Data Streams &gt; Web Stream Details</strong> and copy the <strong>Measurement ID</strong> (e.g. <code>G-GY8ENHWSSB</code>).
                  </p>
                  <p className="text-[10px] text-slate-400 pt-1">
                    * Scripts are automatically skipped on localhost to avoid polluting live analytics data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            Changes and toggle states will immediately synchronize with the live portfolio, floating contact triggers, and analytics scripts.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary !text-xs !py-2.5 !px-6 font-semibold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <LuSave className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save All Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
