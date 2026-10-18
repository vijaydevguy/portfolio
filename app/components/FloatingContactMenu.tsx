"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCalApi } from "@calcom/embed-react";
import { RiWhatsappFill, RiChatSmile3Line } from "react-icons/ri";
import { FiPhoneCall } from "react-icons/fi";
import { LuCalendarCheck } from "react-icons/lu";
import { IoClose } from "react-icons/io5";
import { CONFIG } from "../common";

export default function FloatingContactMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Initialize Cal.com embed with portfolio branding (#1D4ED8)
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: CONFIG.CAL_COM_NAMESPACE });
      cal("ui", {
        theme: "light",
        styles: {
          branding: { brandColor: "#1D4ED8" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  // WhatsApp click handler with prefilled message
  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(
      CONFIG.WHATSAPP_PREFILLED_MESSAGE,
    );
    const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  // Direct Phone Call handler
  const handlePhoneClick = () => {
    window.location.href = `tel:${CONFIG.PHONE_NUMBER}`;
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto select-none">
      {/* Expanded: 3 Separate Clean Cards */}
      <AnimatePresence>
        {isOpen && (
          <div className="mb-3 flex flex-col items-end space-y-2 font-heading">
            {/* Card 1: WhatsApp Card */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.16, delay: 0.06 }}
            >
              <button
                type="button"
                onClick={handleWhatsAppClick}
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
              </button>
            </motion.div>

            {/* Card 2: Phone Call Card */}
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
                    {CONFIG.PHONE_DISPLAY}
                  </p>
                </div>
              </button>
            </motion.div>

            {/* Card 3: Cal.com Meeting Booking Card */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.16 }}
            >
              <button
                type="button"
                data-cal-namespace={CONFIG.CAL_COM_NAMESPACE}
                data-cal-link={CONFIG.CAL_COM_LINK}
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
