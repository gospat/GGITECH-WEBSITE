"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, Check } from "lucide-react";
import Link from "next/link";

type CookieCategory = "essential" | "preferences" | "analytics" | "advertising";

interface CookiePreferences {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
  advertising: boolean;
}

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    preferences: false,
    analytics: false,
    advertising: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const savedPreferences = localStorage.getItem("cookiePreferences");
    if (!savedPreferences) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setShowSettings(true);
    };
    window.addEventListener("openCookieSettings", handleOpen);
    return () => window.removeEventListener("openCookieSettings", handleOpen);
  }, []);

  const handleAcceptAll = () => {
    const allEnabled = {
      essential: true,
      preferences: true,
      analytics: true,
      advertising: true,
    };
    savePreferences(allEnabled);
  };

  const handleRejectAll = () => {
    const allDisabled = {
      essential: true,
      preferences: false,
      analytics: false,
      advertising: false,
    };
    savePreferences(allDisabled);
  };

  const handleConfirmChoices = () => {
    savePreferences(preferences);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem("cookiePreferences", JSON.stringify(prefs));
    setPreferences(prefs);
    setIsOpen(false);
  };

  const togglePreference = (category: CookieCategory) => {
    if (category === "essential") return;
    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              {!showSettings ? (
                // Initial View
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-white mb-4">Choose your cookies</h2>
                  <p className="text-gray-400 mb-8 leading-relaxed">
                    To provide the best experiences, we use technologies like cookies to store and/or access device information. Consenting to these technologies will allow us to process data such as browsing behavior on this site.
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleAcceptAll}
                        className="py-3 px-4 bg-primary hover:bg-blue-600 text-white font-medium rounded-full transition-colors"
                      >
                        Accept all
                      </button>
                      <button
                        onClick={handleRejectAll}
                        className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-full transition-colors"
                      >
                        Reject all
                      </button>
                    </div>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="py-3 px-4 text-gray-400 hover:text-white font-medium transition-colors text-sm"
                    >
                      View Cookie Settings
                    </button>
                  </div>
                </div>
              ) : (
                // Settings View
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => setShowSettings(false)}
                      className="flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 mr-1" />
                      Back
                    </button>
                    <h2 className="text-xl font-bold text-white">Cookie Settings</h2>
                    <div className="w-16" /> {/* Spacer for centering */}
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <p className="text-gray-400 text-sm">
                      Cookies help us to enhance your experience, tailor ads to your interests, and improve our website.
                    </p>

                    {/* Toggles */}
                    <div className="space-y-4">
                      <CookieToggle
                        label="Essential cookies"
                        description="Strictly necessary for the website to function."
                        checked={preferences.essential}
                        onChange={() => {}}
                        disabled
                        activeLabel="Always Active"
                      />
                      <CookieToggle
                        label="Preferences cookies"
                        description="Enable the website to provide enhanced functionality and personalization."
                        checked={preferences.preferences}
                        onChange={() => togglePreference("preferences")}
                      />
                      <CookieToggle
                        label="Analytics cookies"
                        description="Help us understand how visitors interact with the website."
                        checked={preferences.analytics}
                        onChange={() => togglePreference("analytics")}
                      />
                      <CookieToggle
                        label="Advertising cookies"
                        description="Used to deliver relevant ads and track ad campaign performance."
                        checked={preferences.advertising}
                        onChange={() => togglePreference("advertising")}
                      />
                    </div>
                  </div>

                  <div className="p-6 border-t border-white/10 bg-[#0B0F1A]/50 gap-3 grid grid-cols-2">
                    <button
                      onClick={handleConfirmChoices}
                      className="py-3 px-4 bg-primary hover:bg-blue-600 text-white font-medium rounded-full transition-colors"
                    >
                      Confirm choices
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-full transition-colors"
                    >
                      Accept all
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CookieToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  activeLabel,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  activeLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="pr-4">
        <h3 className="font-semibold text-white mb-1">{label}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex flex-col items-end">
        {activeLabel && (
          <span className="text-xs font-medium text-primary mb-2">{activeLabel}</span>
        )}
        <button
          onClick={onChange}
          disabled={disabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            checked ? "bg-primary" : "bg-gray-700"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`${
              checked ? "translate-x-6" : "translate-x-1"
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </button>
      </div>
    </div>
  );
}
