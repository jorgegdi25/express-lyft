import React from 'react'
import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <main style={{ background: '#111111', minHeight: '100vh', color: '#FFFFFF' }} className="py-20 px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <Link href="/" className="text-[#B8960C] hover:underline text-sm font-bold uppercase tracking-wider">
          ← Back to Booking
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Privacy Policy
        </h1>
        <div className="flex flex-col gap-6 text-[#CCCCCC] leading-relaxed">
          <p><em>Last updated: June 6, 2026</em></p>
          
          <p>
            Your privacy is very important to us. Accordingly, we have developed this Policy in order for you to understand how we collect, use, communicate and disclose and make use of personal information. The following outlines our privacy policy.
          </p>

          <ul className="list-disc pl-6 flex flex-col gap-4">
            <li>Before or at the time of collecting personal information, we will identify the purposes for which information is being collected.</li>
            <li>We will collect and use personal information solely with the objective of fulfilling those purposes specified by us and for other compatible purposes, unless we obtain the consent of the individual concerned or as required by law.</li>
            <li>We will only retain personal information as long as necessary for the fulfillment of those purposes.</li>
            <li>We will collect personal information by lawful and fair means and, where appropriate, with the knowledge or consent of the individual concerned.</li>
            <li>Personal data should be relevant to the purposes for which it is to be used, and, to the extent necessary for those purposes, should be accurate, complete, and up-to-date.</li>
            <li>We will protect personal information by reasonable security safeguards against loss or theft, as well as unauthorized access, disclosure, copying, use or modification.</li>
            <li>We will make readily available to customers information about our policies and practices relating to the management of personal information.</li>
          </ul>

          <section className="mt-8 pt-8 border-t border-[#1e1e1e]">
            <h2 className="text-2xl font-bold mb-3 text-white">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:info@explyft.com" className="underline hover:text-[#B8960C] transition-colors">info@explyft.com</a> or call us at <a href="tel:+18889737896" className="underline hover:text-[#B8960C] transition-colors">+1 (888) 973-7896</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
