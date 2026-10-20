"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { isDevelopment, trackPageView, trackEvent } from "../lib/gtag";
import { useCommonSettings } from "../hooks/useCommonSettings";
import { CONFIG } from "../common";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { settings } = useCommonSettings();

  const gaId = settings.googleAnalyticsId || CONFIG.GA_TRACKING_ID;
  const isEnabled = settings.isAnalyticsPublished !== false && Boolean(gaId);

  // Track page views on route changes (strictly not in localhost and only if published)
  useEffect(() => {
    if (isDevelopment() || !isEnabled) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    trackPageView(url);
  }, [pathname, searchParams, isEnabled]);

  // Global listener for automatic monitoring of clicks on buttons, links, tags, and sections
  useEffect(() => {
    if (isDevelopment() || !isEnabled) return;

    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // 1. Check for Link Clicks (<a href="...">)
      const link = target.closest("a");
      if (link) {
        const href = link.getAttribute("href") || "";
        const linkText = link.innerText?.trim() || link.getAttribute("aria-label") || href;
        const isExternal = href.startsWith("http") && !href.includes(window.location.hostname);

        trackEvent({
          action: isExternal ? "external_link_click" : "internal_link_click",
          category: "Navigation",
          label: linkText,
          link_url: href,
          link_id: link.id || undefined,
        });
        return;
      }

      // 2. Check for Button Clicks (<button> or role="button")
      const button = target.closest("button") || target.closest('[role="button"]');
      if (button) {
        const buttonText = button.textContent?.trim() || button.getAttribute("aria-label") || "unlabeled_button";
        const buttonId = button.id || undefined;
        const section = button.closest("section")?.id || "unspecified_section";

        trackEvent({
          action: "button_click",
          category: "User Interaction",
          label: buttonText,
          button_id: buttonId,
          section_name: section,
        });
        return;
      }

      // 3. Check for Clickable Badges / Tags / Chips (e.g. data-tag or tech stack tag)
      const tagElement = target.closest("[data-tag]") || target.closest(".tag") || target.closest(".badge");
      if (tagElement) {
        const tagText = tagElement.textContent?.trim() || "unknown_tag";
        trackEvent({
          action: "tag_click",
          category: "Filter & Tags",
          label: tagText,
        });
        return;
      }
    };

    // IntersectionObserver for tracking when sections become visible (Section views)
    const sections = document.querySelectorAll("section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackEvent({
              action: "section_view",
              category: "Content Visibility",
              label: entry.target.id,
              section_id: entry.target.id,
            });
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach((sec) => observer.observe(sec));
    document.addEventListener("click", handleGlobalClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleGlobalClick, { capture: true });
      observer.disconnect();
    };
  }, [isEnabled]);

  // In development/localhost or if analytics unpublished, do NOT load the gtag scripts at all
  if (process.env.NODE_ENV === "development" || !isEnabled) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Double check localhost prevention on client-side
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
                send_page_view: true
              });
            }
          `,
        }}
      />
    </>
  );
}
