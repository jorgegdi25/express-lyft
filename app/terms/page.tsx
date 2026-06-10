import React from 'react'
import Link from 'next/link'

export default function TermsOfService() {
  return (
    <main style={{ background: '#111111', minHeight: '100vh', color: '#FFFFFF' }} className="py-20 px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <Link href="/" className="text-[#B8960C] hover:underline text-sm font-bold uppercase tracking-wider">
          ← Back to Booking
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Terms of Service & Cancellation Policy
        </h1>
        <div className="flex flex-col gap-6 text-[#CCCCCC] leading-relaxed">
          <p><em>Last updated: June 6, 2026</em></p>
          
          <section>
            <h2 className="text-2xl font-bold mb-3 text-white">1. Cancellation Policy</h2>
            <p>
              Cancellations made 24 hours or more before the scheduled pickup time will receive a full refund. Cancellations made within 24 hours of the scheduled pickup are subject to a cancellation fee or are non-refundable depending on the service tier.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-3 text-white">2. Vehicle Rules</h2>
            <p>
              Smoking and consumption of alcohol are strictly prohibited in all vehicles. Passengers are responsible for any damages or excessive cleaning fees caused during the ride.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 text-white">3. Waiting Time & Delays</h2>
            <p>
              We offer 60 minutes of complimentary wait time for airport pickups (starting from flight arrival time) and 15 minutes of complimentary wait time for hotel and residential pickups. Additional wait time will be billed at standard hourly rates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 text-white">4. Liability</h2>
            <p>
              Express Lyft is not liable for delays caused by extreme weather, heavy traffic, road closures, or unforeseen mechanical failures. In such rare events, we will make every effort to provide an alternative solution or a full refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 text-white">5. Licensing & Insurance</h2>
            <p className="mb-3">
              Express Lyft represents that it operates with all required licenses, insurance coverage, and bonding applicable to the services provided. This means we maintain proper authorization to perform our work, carry insurance intended to protect against covered risks, and, where required, maintain bonding to provide additional protection for clients.
            </p>
            <p>
              Insurance and bonding coverage may be subject to policy limits, exclusions, deductibles, and claim requirements. Being licensed, insured, and bonded does not guarantee payment for every loss or claim. Customers should contact Express Lyft directly if they need proof of license, insurance, or bonding before service begins.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 text-white">6. Website Terms of Use</h2>
            <p className="mb-3">
              By accessing this web site, you are agreeing to be bound by these web site Terms and Conditions of Use, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this web site are protected by applicable copyright and trade mark law.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2 text-white">Use License</h3>
            <p className="mb-2">Permission is granted to temporarily download one copy of the materials (information or software) on Express Lyft's web site for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="list-disc pl-6 mb-3 flex flex-col gap-1">
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>attempt to decompile or reverse engineer any software contained on Express Lyft's web site;</li>
              <li>remove any copyright or other proprietary notations from the materials; or</li>
              <li>transfer the materials to another person or 'mirror' the materials on any other server.</li>
            </ul>
            <p className="mb-3">This license shall automatically terminate if you violate any of these restrictions and may be terminated by Express Lyft at any time. Upon terminating your viewing of these materials or upon the termination of this license, you must destroy any downloaded materials in your possession whether in electronic or printed format.</p>

            <h3 className="text-xl font-bold mt-6 mb-2 text-white">Disclaimer</h3>
            <p className="mb-3">The materials on Express Lyft's web site are provided "as is". Express Lyft makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights. Further, Express Lyft does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its Internet web site or otherwise relating to such materials or on any sites linked to this site.</p>

            <h3 className="text-xl font-bold mt-6 mb-2 text-white">Limitations</h3>
            <p className="mb-3">In no event shall Express Lyft or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption,) arising out of the use or inability to use the materials on Express Lyft's Internet site, even if Express Lyft or a Express Lyft authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.</p>

            <h3 className="text-xl font-bold mt-6 mb-2 text-white">Revisions and Errata</h3>
            <p className="mb-3">The materials appearing on Express Lyft's web site could include technical, typographical, or photographic errors. Express Lyft does not warrant that any of the materials on its web site are accurate, complete, or current. Express Lyft may make changes to the materials contained on its web site at any time without notice. Express Lyft does not, however, make any commitment to update the materials.</p>

            <h3 className="text-xl font-bold mt-6 mb-2 text-white">Links</h3>
            <p className="mb-3">Express Lyft has not reviewed all of the sites linked to its Internet web site and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Express Lyft of the site. Use of any such linked web site is at the user's own risk.</p>

            <h3 className="text-xl font-bold mt-6 mb-2 text-white">Site Terms of Use Modifications</h3>
            <p className="mb-3">Express Lyft may revise these terms of use for its web site at any time without notice. By using this web site you are agreeing to be bound by the then current version of these Terms and Conditions of Use.</p>

            <h3 className="text-xl font-bold mt-6 mb-2 text-white">Governing Law</h3>
            <p className="mb-3">Any claim relating to Express Lyft's web site shall be governed by the laws of Express Lyft's operating state without regard to its conflict of law provisions.</p>
            <p>General Terms and Conditions applicable to Use of a Web Site.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
