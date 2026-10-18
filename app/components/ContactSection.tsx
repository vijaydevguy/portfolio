"use client";

import { useContactForm } from "../hooks/useContactForm";

export default function ContactSection() {
  const {
    formik,
    isSubmitting,
    isSubmitted,
    submitError,
    resetSubmission,
    reasons,
    countryOptions,
    currentCountry,
    handleCountryChange,
    handlePhoneChange,
  } = useContactForm();

  return (
    <section
      id="contact"
      className="w-full bg-[#F8FAFC] py-20 lg:py-28 relative border-t border-zinc-200/80"
    >
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Heading, Recruiter/HR Pitch, Value Proposition (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs uppercase tracking-widest text-[#1D4ED8] font-bold px-3 py-1 rounded-full bg-blue-50 border border-blue-100 inline-block">
              Opportunities & Hiring
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-950 font-heading leading-tight">
              Looking to hire a{" "}
              <span className="text-[#1D4ED8]">full-stack engineer</span>?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
              I am actively looking for full-time engineering roles, as well
              as freelance and personal project collaborations. Leave your
              details and I will get back to you promptly.
            </p>

            {/* Candidate Highlights for Recruiters / HR */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <span className="w-2 h-2 rounded-full bg-[#1D4ED8] flex-shrink-0" />
                <span>Actively Seeking Full-Time Opportunities</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <span className="w-2 h-2 rounded-full bg-[#1D4ED8] flex-shrink-0" />
                <span>
                  Frontend (React, Next.js, TS) & Backend (Node.js, Express,
                  MongoDB)
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <span className="w-2 h-2 rounded-full bg-[#1D4ED8] flex-shrink-0" />
                <span>
                  Production experience delivering multi-tenant SaaS & web apps
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Formik Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-10 rounded-3xl bg-white border border-zinc-200/80 shadow-md">
              {isSubmitted ? (
                /* Success Feedback State */
                <div className="py-12 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-950 font-heading">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-slate-600 max-w-md text-sm sm:text-base leading-relaxed">
                    Thank you for reaching out. I have received your message and
                    will get in touch with you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={resetSubmission}
                    className="mt-4 px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                /* The Contact Form */
                <form
                  onSubmit={formik.handleSubmit}
                  noValidate
                  className="space-y-6"
                >
                  {submitError && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
                      {submitError}
                    </div>
                  )}

                  {/* 1. Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name Field */}
                    <div className="relative pb-5">
                      <label
                        htmlFor="name"
                        className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5"
                      >
                        Your Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        autoComplete="name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-medium text-zinc-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                          formik.touched.name && formik.errors.name
                            ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200"
                            : "border-zinc-200 bg-zinc-50/40 focus:bg-white focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-100"
                        }`}
                      />
                      {formik.touched.name && formik.errors.name && (
                        <p className="absolute bottom-0 left-0 text-xs text-rose-600 font-medium whitespace-nowrap">
                          {formik.errors.name}
                        </p>
                      )}
                    </div>

                    {/* Email Field (Required) */}
                    <div className="relative pb-5">
                      <label
                        htmlFor="email"
                        className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5"
                      >
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="hr@company.com"
                        autoComplete="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-medium text-zinc-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                          formik.touched.email && formik.errors.email
                            ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200"
                            : "border-zinc-200 bg-zinc-50/40 focus:bg-white focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-100"
                        }`}
                      />
                      {formik.touched.email && formik.errors.email && (
                        <p className="absolute bottom-0 left-0 text-xs text-rose-600 font-medium whitespace-nowrap">
                          {formik.errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 2. Unified Phone Field (Country Code + Phone as a Single Box) & Purpose */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Unified Phone Input */}
                    <div className="relative pb-5">
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="phone"
                          className="block text-xs font-bold uppercase tracking-wider text-zinc-700"
                        >
                          Phone Number
                        </label>
                        <span className="text-[11px] font-medium text-slate-400">
                          Optional
                        </span>
                      </div>

                      {/* Single Border Box housing both Country Select & Number Input */}
                      <div
                        className={`w-full flex items-center rounded-xl border overflow-hidden transition-all ${
                          formik.touched.phone && formik.errors.phone
                            ? "border-rose-400 bg-rose-50/20 focus-within:ring-2 focus-within:ring-rose-200"
                            : "border-zinc-200 bg-zinc-50/40 focus-within:bg-white focus-within:border-[#1D4ED8] focus-within:ring-2 focus-within:ring-blue-100"
                        }`}
                      >
                        {/* Country Code Selector with Flag (No Country Name, Dial Code Only) */}
                        <div className="relative flex items-center bg-zinc-100/70 border-r border-zinc-200 hover:bg-zinc-100 transition-colors">
                          <div className="pl-3 flex items-center justify-center pointer-events-none select-none">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={currentCountry.flagUrl}
                              alt={currentCountry.code}
                              onError={(e) => {
                                // If any flag fails to load, gracefully fallback to transparent 1px gif or hide
                                (
                                  e.currentTarget as HTMLImageElement
                                ).style.display = "none";
                              }}
                              className="w-5 h-3.5 object-cover rounded-[2px] shadow-xs"
                            />
                          </div>
                          <select
                            id="countryIso"
                            name="countryIso"
                            aria-label="Country Code"
                            value={formik.values.countryIso}
                            onChange={(e) =>
                              handleCountryChange(e.target.value as any)
                            }
                            className="appearance-none bg-transparent py-3 pl-2 pr-7 text-xs font-bold text-zinc-800 cursor-pointer focus:outline-none"
                          >
                            {countryOptions.map((country) => (
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

                        {/* National Phone Number Input (Numbers Only, Validates on blur/change without restricting length) */}
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          inputMode="numeric"
                          placeholder={
                            currentCountry.code === "IN"
                              ? "98765 43210"
                              : "Phone number"
                          }
                          value={formik.values.phone}
                          onChange={handlePhoneChange}
                          onBlur={formik.handleBlur}
                          className="flex-1 min-w-0 px-3.5 py-3 text-sm font-medium text-zinc-900 bg-transparent placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>

                      {/* Absolute Error Message */}
                      {formik.touched.phone && formik.errors.phone && (
                        <p className="absolute bottom-0 left-0 text-xs text-rose-600 font-medium whitespace-nowrap">
                          {formik.errors.phone}
                        </p>
                      )}
                    </div>

                    {/* Reason Field */}
                    <div className="relative pb-5">
                      <label
                        htmlFor="reason"
                        className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5"
                      >
                        Purpose <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="reason"
                        name="reason"
                        value={formik.values.reason}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/40 text-sm font-medium text-zinc-900 focus:bg-white focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                      >
                        {reasons.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      {formik.touched.reason && formik.errors.reason && (
                        <p className="absolute bottom-0 left-0 text-xs text-rose-600 font-medium whitespace-nowrap">
                          {formik.errors.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3. Message Field (Required) with strict min-h, max-h, and character count */}
                  <div className="relative pb-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="message"
                        className="block text-xs font-bold uppercase tracking-wider text-zinc-700"
                      >
                        Message / Role Scope{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formik.values.message.length} / 2000
                      </span>
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      placeholder="Share details regarding the role, tech stack, timeline, or opportunity..."
                      value={formik.values.message}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium text-zinc-900 placeholder:text-slate-400 focus:outline-none transition-all resize-y min-h-[140px] max-h-[200px] ${
                        formik.touched.message && formik.errors.message
                          ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200"
                          : "border-zinc-200 bg-zinc-50/40 focus:bg-white focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-100"
                      }`}
                    />
                    {formik.touched.message && formik.errors.message && (
                      <p className="absolute bottom-0 left-0 text-xs text-rose-600 font-medium whitespace-nowrap">
                        {formik.errors.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#1D4ED8] hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed group"
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Inquiry</span>
                          <svg
                            className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
