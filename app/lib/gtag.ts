import { CONFIG } from "../common";

// Declare gtag on window for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const GA_TRACKING_ID = CONFIG.GA_TRACKING_ID;

/**
 * Checks if current environment is localhost or development
 */
export const isDevelopment = (): boolean => {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "development";
  }
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".local") ||
    process.env.NODE_ENV === "development"
  );
};

/**
 * Track custom page views
 */
export const trackPageView = (url: string) => {
  if (isDevelopment()) return;
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

export interface TrackEventParams {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

/**
 * Universal Event Tracker
 * Strictly disabled on localhost
 */
export const trackEvent = ({
  action,
  category,
  label,
  value,
  ...customParams
}: TrackEventParams) => {
  if (isDevelopment()) return;
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
      ...customParams,
    });
  }
};
