"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCalApi } from "@calcom/embed-react";
import { RiWhatsappFill, RiChatSmile3Line } from "react-icons/ri";
import { FiPhoneCall } from "react-icons/fi";
import { LuCalendarCheck } from "react-icons/lu";
import { IoClose } from "react-icons/io5";
import { usePathname } from "next/navigation";
import { CONFIG } from "../common";
import { useCommonSettings } from "../hooks/useCommonSettings";

export default function FloatingContactMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { settings } = useCommonSettings();

  // Hide FloatingContactMenu completely on admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Initialize Cal.com embed with portfolio branding (#1D4ED8)
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: settings.calComNamespace || CONFIG.CAL_COM_NAMESPACE });
      cal("ui", {
        theme: "light",
        styles: {
          branding: { brandColor: "#1D4ED8" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, [settings.calComNamespace]);

  // WhatsApp click handler with prefilled message
  const handleWhatsAppClick = () => {
    const rawNumber = settings.whatsappNumber || CONFIG.WHATSAPP_NUMBER || "";
    // Clean all non-digit characters (+, spaces, hyphens, brackets)
    const cleanNumber = rawNumber.replace(/\D/g, "");
    const encodedMessage = encodeURIComponent(
      settings.whatsappPrefilledMessage || CONFIG.WHATSAPP_PREFILLED_MESSAGE,
    );
    // api.whatsapp.com/send works reliably across both mobile app and WhatsApp Web
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  // Direct Phone Call handler
  const handlePhoneClick = () => {
    window.location.href = `tel:${settings.phoneNumber || CONFIG.PHONE_NUMBER}`;
    setIsOpen(false);
  };

  const hasAnyChannel =
    settings.isWhatsappPublished !== false ||
    settings.isPhonePublished !== false ||
    settings.isCalComPublished !== false;

  if (!hasAnyChannel) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto select-none">
      {/* Expanded: Contact Channel Cards */}
      <AnimatePresence>
        {isOpen && (
          <div className="mb-3 flex flex-col items-end space-y-2 font-heading">
            {/* Card 1: WhatsApp Card */}
            {settings.isWhatsappPublished !== false && (() => {
              const rawNumber = settings.whatsappNumber || CONFIG.WHATSAPP_NUMBER || "";
              const cleanNumber = rawNumber.replace(/\D/g, "");
              const encodedMessage = encodeURIComponent(
                settings.whatsappPrefilledMessage || CONFIG.WHATSAPP_PREFILLED_MESSAGE,
              );
              const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMessage}`;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.16, delay: 0.06 }}
                >
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-zinc-200 shadow-md hover:bg-zinc-50 active:bg-zinc-100 transition-all cursor-pointer group text-left min-w-[190px]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                      <RiWhatsappFill className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 group-hover:text-emerald-600 transition-colors">
                        WhatsApp Chat
                      </p>
                    </div>
                  </a>
                </motion.div>
              );
            })()}

            {/* Card 2: Phone Call Card */}
            {settings.isPhonePublished !== false && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.16, delay: 0.03 }}
              >
                <button
                  type="button"
                  onClick={handlePhoneClick}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-zinc-200 shadow-md hover:bg-zinc-50 active:bg-zinc-100 transition-all cursor-pointer group text-left min-w-[190px]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1D4ED8] text-white flex items-center justify-center flex-shrink-0">
                    <FiPhoneCall className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 group-hover:text-[#1D4ED8] transition-colors">
                      Direct Call
                    </p>
                    <p className="text-[11px] text-slate-500 font-sans truncate">
                      {settings.phoneDisplay || CONFIG.PHONE_DISPLAY}
                    </p>
                  </div>
                </button>
              </motion.div>
            )}

            {/* Card 3: Cal.com Meeting Booking Card */}
            {settings.isCalComPublished !== false && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.16 }}
              >
                <button
                  type="button"
                  data-cal-namespace={settings.calComNamespace || CONFIG.CAL_COM_NAMESPACE}
                  data-cal-link={settings.calComLink || CONFIG.CAL_COM_LINK}
                  data-cal-config='{"layout":"month_view"}'
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-zinc-200 shadow-md hover:bg-zinc-50 active:bg-zinc-100 transition-all cursor-pointer group text-left min-w-[190px]"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                    <LuCalendarCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                      Cal.com Meeting
                    </p>
                  </div>
                </button>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Floating Main Contact Trigger Button (Clean, Simple, Elegant) */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Contact and reach out"
        className="w-14 h-14 rounded-full bg-[#1D4ED8] hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-100 relative group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <IoClose className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="contact-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <RiChatSmile3Line className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
