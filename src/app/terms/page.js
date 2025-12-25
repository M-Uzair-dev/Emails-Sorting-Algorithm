"use client";

import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors mb-8 group"
        >
          <svg
            className="w-5 h-5 transition-transform group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-purple-100/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-12 text-white">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h1 className="text-4xl font-bold">Terms of Service</h1>
            </div>
            <p className="text-purple-100 text-lg">Effective Date: December 25, 2025</p>
          </div>

          {/* Content */}
          <div className="px-8 py-10 space-y-8">
            {/* Introduction */}
            <section className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-l-4 border-purple-600">
              <p className="text-gray-700 leading-relaxed text-lg">
                By using [Your App Name] ("we", "our", "us"), you agree to the following terms:
              </p>
            </section>

            {/* Term 1: Use of Service */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 font-bold text-lg flex-shrink-0">
                  1
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Use of Service</h2>
              </div>
              <div className="ml-13 space-y-3">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-700">You must have a valid QuickBooks Online account to use our app.</p>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-700">You are responsible for any activity performed through your account.</p>
                </div>
              </div>
            </section>

            {/* Term 2: Access and Account Security */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold text-lg flex-shrink-0">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Access and Account Security</h2>
              </div>
              <div className="ml-13 space-y-3">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-gray-700">Do not share your OAuth credentials.</p>
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-gray-700">Notify us immediately if you suspect unauthorized access.</p>
                </div>
              </div>
            </section>

            {/* Term 3: Data and Privacy */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 font-bold text-lg flex-shrink-0">
                  3
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Data and Privacy</h2>
              </div>
              <div className="ml-13">
                <div className="p-5 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <p className="text-gray-700 leading-relaxed">
                    Our <Link href="/privacy" className="text-green-600 hover:text-green-700 font-semibold underline">Privacy Policy</Link> explains how your data is collected and used. By using the app, you consent to this.
                  </p>
                </div>
              </div>
            </section>

            {/* Term 4: Liability */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600 font-bold text-lg flex-shrink-0">
                  4
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Liability</h2>
              </div>
              <div className="ml-13">
                <div className="p-5 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-gray-700 leading-relaxed">
                      We provide the app "as is." We are not responsible for errors in your QuickBooks data or losses resulting from app usage.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Term 5: Modifications */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg flex-shrink-0">
                  5
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Modifications</h2>
              </div>
              <div className="ml-13">
                <div className="p-5 bg-indigo-50 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    We may update these terms or the app at any time. Continued use constitutes acceptance.
                  </p>
                </div>
              </div>
            </section>

            {/* Term 6: Contact */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-100 text-pink-600 font-bold text-lg flex-shrink-0">
                  6
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Contact</h2>
              </div>
              <div className="ml-13">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center">
                  <p className="text-gray-700 mb-4">Questions about our terms?</p>
                  <a
                    href="mailto:contact@yourapp.com"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    contact@yourapp.com
                  </a>
                </div>
              </div>
            </section>

            {/* Agreement Notice */}
            <section className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white text-center">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">
                By using our service, you acknowledge that you have read and agree to these Terms of Service.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p>Last updated: December 25, 2025</p>
        </div>
      </div>
    </div>
  );
}
