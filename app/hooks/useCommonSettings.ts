"use client";

import { useState, useEffect, useCallback } from "react";
import { CONFIG } from "../common";

export interface CommonSettingsData {
  _id?: string;
  calComLink: string;
  calComNamespace: string;
  isCalComPublished: boolean;
  phoneNumber: string;
  phoneDisplay: string;
  phoneCountryIso: string;
  phoneCountryCode: string;
  phoneNational: string;
  isPhonePublished: boolean;
  email: string;
  isEmailPublished: boolean;
  whatsappNumber: string;
  whatsappCountryIso: string;
  whatsappCountryCode: string;
  whatsappNational: string;
  whatsappPrefilledMessage: string;
  isWhatsappPublished: boolean;
  googleAnalyticsId: string;
  isAnalyticsPublished: boolean;
}

export const DEFAULT_COMMON_SETTINGS: CommonSettingsData = {
  calComLink: CONFIG.CAL_COM_LINK,
  calComNamespace: CONFIG.CAL_COM_NAMESPACE,
  isCalComPublished: true,
  phoneNumber: CONFIG.PHONE_NUMBER,
  phoneDisplay: CONFIG.PHONE_DISPLAY,
  phoneCountryIso: "IN",
  phoneCountryCode: "+91",
  phoneNational: "9876543210",
  isPhonePublished: true,
  email: "vijaydevguy@gmail.com",
  isEmailPublished: true,
  whatsappNumber: CONFIG.WHATSAPP_NUMBER,
  whatsappCountryIso: "IN",
  whatsappCountryCode: "+91",
  whatsappNational: "9876543210",
  whatsappPrefilledMessage: CONFIG.WHATSAPP_PREFILLED_MESSAGE,
  isWhatsappPublished: true,
  googleAnalyticsId: CONFIG.GA_TRACKING_ID || "G-GY8ENHWSSB",
  isAnalyticsPublished: true,
};

export function useCommonSettings() {
  const [settings, setSettings] = useState<CommonSettingsData>(DEFAULT_COMMON_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/settings/common`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSettings({
            calComLink: json.data.calComLink || DEFAULT_COMMON_SETTINGS.calComLink,
            calComNamespace: json.data.calComNamespace || DEFAULT_COMMON_SETTINGS.calComNamespace,
            isCalComPublished:
              json.data.isCalComPublished !== undefined
                ? Boolean(json.data.isCalComPublished)
                : true,
            phoneNumber: json.data.phoneNumber || DEFAULT_COMMON_SETTINGS.phoneNumber,
            phoneDisplay: json.data.phoneDisplay || DEFAULT_COMMON_SETTINGS.phoneDisplay,
            phoneCountryIso: json.data.phoneCountryIso || DEFAULT_COMMON_SETTINGS.phoneCountryIso,
            phoneCountryCode: json.data.phoneCountryCode || DEFAULT_COMMON_SETTINGS.phoneCountryCode,
            phoneNational: json.data.phoneNational || DEFAULT_COMMON_SETTINGS.phoneNational,
            isPhonePublished:
              json.data.isPhonePublished !== undefined
                ? Boolean(json.data.isPhonePublished)
                : true,
            email: json.data.email || DEFAULT_COMMON_SETTINGS.email,
            isEmailPublished:
              json.data.isEmailPublished !== undefined
                ? Boolean(json.data.isEmailPublished)
                : true,
            whatsappNumber: json.data.whatsappNumber || DEFAULT_COMMON_SETTINGS.whatsappNumber,
            whatsappCountryIso:
              json.data.whatsappCountryIso || DEFAULT_COMMON_SETTINGS.whatsappCountryIso,
            whatsappCountryCode:
              json.data.whatsappCountryCode || DEFAULT_COMMON_SETTINGS.whatsappCountryCode,
            whatsappNational:
              json.data.whatsappNational || DEFAULT_COMMON_SETTINGS.whatsappNational,
            whatsappPrefilledMessage:
              json.data.whatsappPrefilledMessage || DEFAULT_COMMON_SETTINGS.whatsappPrefilledMessage,
            isWhatsappPublished:
              json.data.isWhatsappPublished !== undefined
                ? Boolean(json.data.isWhatsappPublished)
                : true,
            googleAnalyticsId:
              json.data.googleAnalyticsId || DEFAULT_COMMON_SETTINGS.googleAnalyticsId,
            isAnalyticsPublished:
              json.data.isAnalyticsPublished !== undefined
                ? Boolean(json.data.isAnalyticsPublished)
                : true,
          });
        }
      }
    } catch (err: any) {
      console.error("Error fetching common settings:", err);
      setError(err?.message || "Failed to load common settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
  };
}
