import { LegalEmail } from "@/components/legal/LegalEmail";
import { getSiteUpdatedDate } from "@/lib/legal/site-updated";

export function PrivacyPolicyContent() {
  const updatedDate = getSiteUpdatedDate();

  return (
    <>
      <div className="space-y-1 border-b border-cyan-500/10 pb-6">
        <p className="text-sm text-ni-muted/80">
          <strong className="text-white/90">Northside Intelligence</strong>
        </p>
        <p className="text-sm text-ni-muted/80">northsideintelligence.com</p>
        <p className="text-sm text-ni-muted/80">
          <strong className="text-white/90">Last Updated:</strong> {updatedDate}
        </p>
        <p className="text-sm text-ni-muted/80">
          <strong className="text-white/90">Effective Date:</strong> {updatedDate}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">1. Introduction</h2>
        <p>
          Northside Intelligence (&quot;NI,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), a product of{" "}
          <strong className="text-white/90">Northside Ventures Group LLC</strong>, respects your privacy and is
          committed to protecting your personal information. This Privacy Policy explains what information we
          collect, how we use it, who we share it with, and your rights regarding your data when you use:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            The <strong className="text-white/90">northsideintelligence.com</strong> website and NI Portal
          </li>
          <li>
            <strong className="text-white/90">Intelligence Tools</strong>
          </li>
          <li>
            The <strong className="text-white/90">Smart Store</strong>
          </li>
          <li>
            <strong className="text-white/90">Intelligence Services</strong>
          </li>
          <li>Any related products, apps, or communications</li>
        </ul>
        <p className="mt-3">
          By using our Services, you consent to the practices described in this Privacy Policy. If you do not
          agree, please discontinue use of the Services.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">2. Information We Collect</h2>

        <h3 className="mb-2 text-base font-medium text-white/90">2.1 Information You Provide Directly</h3>

        <p className="mb-2 font-medium text-white/80">Account Registration:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>Full name</li>
          <li>Email address</li>
          <li>Password (stored in hashed form — we never store plaintext passwords)</li>
          <li>Optional profile details</li>
        </ul>

        <p className="mb-2 font-medium text-white/80">Payments and Billing:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>
            Payment card information is handled exclusively by <strong className="text-white/90">Stripe</strong>{" "}
            and is not stored on NI servers. We receive only a tokenized payment reference and the last four
            digits of your card.
          </li>
          <li>Billing address</li>
        </ul>

        <p className="mb-2 font-medium text-white/80">Smart Store Orders:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>Shipping name and address</li>
          <li>Order details and purchase history</li>
        </ul>

        <p className="mb-2 font-medium text-white/80">Intelligence Services:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>Business or organization name</li>
          <li>Contact information</li>
          <li>Project scope, goals, and workflow information you share during engagements</li>
          <li>Communications, documents, and files you provide</li>
        </ul>

        <p className="mb-2 font-medium text-white/80">Tool Inputs (User Content):</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>
            Text, data, prompts, files, or other content you submit to Intelligence Tools for processing (e.g.,
            customer messages submitted to ReplyFlow, grant ideas submitted to GrantBot, market signals submitted
            to Signal Desk)
          </li>
        </ul>

        <p className="mb-2 font-medium text-white/80">Communications:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>Support requests, feedback submissions, bug reports, and ideas submitted through in-platform forms</li>
          <li>Email correspondence with NI</li>
        </ul>

        <h3 className="mb-2 text-base font-medium text-white/90">2.2 Information We Collect Automatically</h3>
        <p className="mb-3">When you use the Services, we automatically collect:</p>

        <p className="mb-2 font-medium text-white/80">Usage and Analytics Data:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>Pages visited, features used, tools opened, time spent</li>
          <li>Tool usage counts (for free tier limit tracking)</li>
          <li>Click paths and navigation behavior</li>
        </ul>

        <p className="mb-2 font-medium text-white/80">Technical Data:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>IP address</li>
          <li>Browser type, version, and language</li>
          <li>Device type and operating system</li>
          <li>Referral URL</li>
        </ul>

        <p className="mb-2 font-medium text-white/80">Cookies and Tracking Technologies:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>Session cookies (required for login state)</li>
          <li>Functional cookies (remembering your preferences, e.g., monthly vs. annual pricing toggle)</li>
          <li>Analytics cookies (measuring aggregate usage — see Section 6)</li>
        </ul>
        <p>We do not use advertising cookies or sell data to advertisers.</p>

        <h3 className="mb-2 mt-4 text-base font-medium text-white/90">2.3 Information From Third Parties</h3>
        <p className="mb-2">We may receive limited information from:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white/90">Stripe</strong> — payment confirmation and dispute status
          </li>
          <li>
            <strong className="text-white/90">Third-party suppliers (Smart Store)</strong> — order fulfillment
            and shipping status updates
          </li>
          <li>
            <strong className="text-white/90">Authentication providers</strong> — if you sign in via Google or
            another OAuth provider (email and profile basics only)
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">3. How We Use Your Information</h2>
        <p className="mb-3">We use your information for the following purposes:</p>

        <h3 className="mb-2 text-base font-medium text-white/90">3.1 To Provide and Operate the Services</h3>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>Authenticate and manage your NI Portal account</li>
          <li>Track free tier usage limits and enforce subscription entitlements</li>
          <li>Process payments and manage subscriptions through Stripe</li>
          <li>Fulfill Smart Store orders and communicate shipping status</li>
          <li>Deliver Intelligence Services engagements</li>
          <li>Process tool inputs through AI models and return outputs to you</li>
        </ul>

        <h3 className="mb-2 text-base font-medium text-white/90">3.2 To Improve the Services</h3>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>
            Analyze aggregate usage patterns to identify popular features, bottlenecks, and improvement
            opportunities
          </li>
          <li>Monitor system performance and uptime</li>
          <li>Debug errors and investigate support tickets</li>
        </ul>

        <h3 className="mb-2 text-base font-medium text-white/90">3.3 To Communicate With You</h3>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>
            Send transactional emails: account confirmations, order receipts, subscription renewals, payment
            failures
          </li>
          <li>
            Send service announcements: new tools, feature updates, policy changes (you cannot opt out of
            transactional and policy emails)
          </li>
          <li>
            Send optional marketing emails: NI newsletters, product launches, promotions (you may opt out at any
            time via the unsubscribe link)
          </li>
        </ul>

        <h3 className="mb-2 text-base font-medium text-white/90">3.4 For Security and Fraud Prevention</h3>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>Detect and prevent unauthorized access, fraudulent transactions, and abuse of free tier limits</li>
          <li>Monitor for violations of our Acceptable Use Policy</li>
        </ul>

        <h3 className="mb-2 text-base font-medium text-white/90">3.5 Legal Compliance</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>Comply with applicable laws, regulations, and legal process</li>
          <li>Enforce our Terms of Service</li>
          <li>Respond to lawful requests from government authorities</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">4. How Your Tool Inputs Are Handled</h2>
        <p className="mb-3">
          When you submit content to Intelligence Tools (e.g., a customer email to ReplyFlow, a grant description
          to GrantBot, market signals to Signal Desk):
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white/90">Your input is transmitted to our AI infrastructure</strong> —
            currently powered by <strong className="text-white/90">Anthropic&apos;s Claude API</strong> — for
            processing.
          </li>
          <li>
            <strong className="text-white/90">AI outputs are returned to you</strong> — the result is displayed
            in your browser and may be temporarily stored to support session continuity.
          </li>
          <li>
            <strong className="text-white/90">We do not train AI models on your User Content</strong> without your
            explicit, separate consent.
          </li>
          <li>
            <strong className="text-white/90">Anthropic&apos;s data handling</strong> for API calls is governed by
            Anthropic&apos;s own API data usage policies. NI does not control how Anthropic processes data at the
            API level. You should review Anthropic&apos;s privacy practices at{" "}
            <a
              href="https://www.anthropic.com"
              className="text-cyan-400 hover:text-cyan-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              anthropic.com
            </a>
            .
          </li>
          <li>
            <strong className="text-white/90">Retention:</strong> Tool inputs and outputs are retained for a
            limited period (up to 90 days) for debugging and session recovery, then deleted unless you have saved
            them to your account.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">5. Information Sharing and Disclosure</h2>
        <p className="mb-3">
          We <strong className="text-white/90">do not sell your personal information</strong>. We share your data
          only in the following limited circumstances:
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">5.1 Service Providers (Processors)</h3>
        <p className="mb-3">We share data with trusted third-party vendors who process data on our behalf:</p>
        <div className="overflow-x-auto">
          <table className="legal-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Purpose</th>
                <th>Data Shared</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong className="text-white/90">Stripe</strong>
                </td>
                <td>Payment processing</td>
                <td>Billing info, transaction amounts</td>
              </tr>
              <tr>
                <td>
                  <strong className="text-white/90">Anthropic</strong>
                </td>
                <td>AI model API</td>
                <td>Tool inputs/prompts</td>
              </tr>
              <tr>
                <td>
                  <strong className="text-white/90">Supabase</strong>
                </td>
                <td>Database</td>
                <td>Account data, usage records</td>
              </tr>
              <tr>
                <td>
                  <strong className="text-white/90">Vercel</strong>
                </td>
                <td>Hosting / CDN</td>
                <td>Request logs, IP addresses</td>
              </tr>
              <tr>
                <td>
                  <strong className="text-white/90">Smart Store Suppliers</strong>
                </td>
                <td>Order fulfillment</td>
                <td>Name, shipping address, order details</td>
              </tr>
              <tr>
                <td>
                  <strong className="text-white/90">Email Service Provider</strong>
                </td>
                <td>Transactional email</td>
                <td>Email address, name</td>
              </tr>
              <tr>
                <td>
                  <strong className="text-white/90">Analytics</strong>
                </td>
                <td>Usage analytics</td>
                <td>Anonymized/aggregated usage data</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          All service providers are contractually required to protect your data and use it only for the purposes
          we specify.
        </p>

        <h3 className="mb-2 mt-4 text-base font-medium text-white/90">5.2 Legal Requirements</h3>
        <p>
          We may disclose your information if required to do so by law, court order, or lawful government
          authority, or if we believe in good faith that disclosure is necessary to protect the rights, property,
          or safety of NI, our users, or the public.
        </p>

        <h3 className="mb-2 mt-4 text-base font-medium text-white/90">5.3 Business Transfers</h3>
        <p>
          In the event of a merger, acquisition, reorganization, or sale of assets involving Northside Ventures
          Group LLC, your information may be transferred to the successor entity. We will notify you before your
          data is transferred and becomes subject to a different privacy policy.
        </p>

        <h3 className="mb-2 mt-4 text-base font-medium text-white/90">5.4 With Your Consent</h3>
        <p>We may share your information in other circumstances with your explicit consent.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">6. Cookies and Tracking</h2>

        <h3 className="mb-2 text-base font-medium text-white/90">6.1 What We Use</h3>
        <div className="overflow-x-auto">
          <table className="legal-table">
            <thead>
              <tr>
                <th>Cookie Type</th>
                <th>Purpose</th>
                <th>Can Opt Out?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong className="text-white/90">Session / Authentication</strong>
                </td>
                <td>Keep you logged in</td>
                <td>No (required)</td>
              </tr>
              <tr>
                <td>
                  <strong className="text-white/90">Functional</strong>
                </td>
                <td>Remember preferences (plan toggle, tool filters)</td>
                <td>Limited</td>
              </tr>
              <tr>
                <td>
                  <strong className="text-white/90">Analytics</strong>
                </td>
                <td>Measure usage patterns (aggregate, not personal)</td>
                <td>Yes</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="mb-2 mt-4 text-base font-medium text-white/90">6.2 Managing Cookies</h3>
        <p className="mb-3">
          You can manage cookie preferences through your browser settings. Disabling session cookies will prevent
          you from logging in. Disabling analytics cookies has no effect on Service functionality.
        </p>
        <p>
          We honor <strong className="text-white/90">Do Not Track (DNT)</strong> browser signals for analytics
          tracking. We do not serve behavioral advertising cookies.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">7. Data Retention</h2>
        <div className="overflow-x-auto">
          <table className="legal-table">
            <thead>
              <tr>
                <th>Data Type</th>
                <th>Retention Period</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Account data</td>
                <td>Until account deletion + 30 days</td>
              </tr>
              <tr>
                <td>Payment records</td>
                <td>7 years (tax/legal compliance)</td>
              </tr>
              <tr>
                <td>Smart Store orders</td>
                <td>5 years</td>
              </tr>
              <tr>
                <td>Tool inputs / AI outputs</td>
                <td>Up to 90 days from submission</td>
              </tr>
              <tr>
                <td>Support communications</td>
                <td>2 years</td>
              </tr>
              <tr>
                <td>Usage logs (anonymized)</td>
                <td>Up to 2 years</td>
              </tr>
              <tr>
                <td>Server logs (IP, technical)</td>
                <td>90 days</td>
              </tr>
              <tr>
                <td>Intelligence Services project data</td>
                <td>Per service agreement, minimum 1 year</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          After the applicable retention period, data is securely deleted or anonymized. Account deletion
          requests are processed within <strong className="text-white/90">30 days</strong>, subject to legal
          retention obligations.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">8. Security</h2>
        <p className="mb-3">
          We implement commercially reasonable technical and organizational security measures to protect your data,
          including:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white/90">Encryption in transit:</strong> All data transmitted between your
            browser and our servers uses TLS/HTTPS.
          </li>
          <li>
            <strong className="text-white/90">Encryption at rest:</strong> Database contents are encrypted at
            rest via Supabase&apos;s infrastructure.
          </li>
          <li>
            <strong className="text-white/90">Password hashing:</strong> Passwords are hashed using
            industry-standard algorithms; we never store plaintext passwords.
          </li>
          <li>
            <strong className="text-white/90">Access controls:</strong> Internal access to personal data is
            restricted to authorized personnel with a legitimate business need.
          </li>
          <li>
            <strong className="text-white/90">Payment security:</strong> All payment data is handled by Stripe
            (PCI-DSS Level 1 certified). NI does not store raw card numbers.
          </li>
        </ul>
        <p className="mt-3">
          No system is 100% secure. In the event of a data breach that affects your personal information, we will
          notify you as required by applicable law.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">9. Children&apos;s Privacy</h2>
        <p>
          Our Services are not directed to children under <strong className="text-white/90">13 years of age</strong>
          . We do not knowingly collect personal information from children under 13. If you believe we have
          inadvertently collected such information, please contact us at <LegalEmail /> and we will promptly delete
          it.
        </p>
        <p className="mt-3">
          Users between 13 and 17 may use the Services only with verified parental or guardian consent.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">10. Your Privacy Rights</h2>

        <h3 className="mb-2 text-base font-medium text-white/90">10.1 All Users</h3>
        <p className="mb-2">Regardless of location, you have the right to:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white/90">Access</strong> — request a copy of the personal data we hold about
            you
          </li>
          <li>
            <strong className="text-white/90">Correction</strong> — request correction of inaccurate or
            incomplete data
          </li>
          <li>
            <strong className="text-white/90">Deletion</strong> — request deletion of your account and associated
            personal data (subject to legal retention requirements)
          </li>
          <li>
            <strong className="text-white/90">Data portability</strong> — request your data in a common
            machine-readable format
          </li>
          <li>
            <strong className="text-white/90">Withdraw consent</strong> — opt out of optional processing (e.g.,
            marketing emails) at any time
          </li>
        </ul>
        <p>
          To exercise these rights, email <LegalEmail /> with your request. We will respond within{" "}
          <strong className="text-white/90">30 days</strong>.
        </p>

        <h3 className="mb-2 mt-4 text-base font-medium text-white/90">10.2 California Residents (CCPA/CPRA)</h3>
        <p className="mb-3">
          If you are a California resident, you have additional rights under the California Consumer Privacy Act
          (CCPA) as amended by the California Privacy Rights Act (CPRA):
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white/90">Right to Know:</strong> Request disclosure of the categories and
            specific pieces of personal information collected about you, the sources of that information, and the
            purposes for collection.
          </li>
          <li>
            <strong className="text-white/90">Right to Delete:</strong> Request deletion of your personal
            information, subject to legal exceptions.
          </li>
          <li>
            <strong className="text-white/90">Right to Correct:</strong> Request correction of inaccurate personal
            information.
          </li>
          <li>
            <strong className="text-white/90">Right to Opt Out of Sale or Sharing:</strong> We do not sell or
            share your personal information for cross-context behavioral advertising.
          </li>
          <li>
            <strong className="text-white/90">Right to Limit Use of Sensitive Personal Information:</strong> We do
            not process sensitive personal information beyond what is necessary to provide the Services.
          </li>
          <li>
            <strong className="text-white/90">Non-Discrimination:</strong> We will not discriminate against you
            for exercising your CCPA rights.
          </li>
        </ul>
        <p className="mb-3">
          To submit a verifiable consumer request, contact us at <LegalEmail /> or use our in-app data request
          feature. We will respond within <strong className="text-white/90">45 days</strong> (extendable by 45 days
          with notice).
        </p>
        <p className="mb-3">
          <strong className="text-white/90">Authorized Agent:</strong> You may designate an authorized agent to
          submit requests on your behalf. We may require verification of the agent&apos;s authority.
        </p>
        <p className="mb-2">
          <strong className="text-white/90">Categories of Personal Information Collected (CCPA):</strong>
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Identifiers (name, email, IP address)</li>
          <li>Commercial information (purchase records, subscription history)</li>
          <li>Internet or electronic network activity (usage logs, browser data)</li>
          <li>
            Inferences drawn from the above (usage preferences for personalized Smart Store recommendations, if
            enabled)
          </li>
        </ul>

        <h3 className="mb-2 mt-4 text-base font-medium text-white/90">
          10.3 EEA, UK, and Swiss Residents (GDPR/UK GDPR)
        </h3>
        <p className="mb-3">
          If you are located in the European Economic Area, United Kingdom, or Switzerland, you have rights under
          the General Data Protection Regulation (GDPR) or applicable national equivalent:
        </p>
        <p className="mb-2">
          <strong className="text-white/90">Lawful Basis:</strong> We process your data under the following bases:
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white/90">Contract:</strong> Processing necessary to provide Services you have
            requested
          </li>
          <li>
            <strong className="text-white/90">Legitimate interests:</strong> Security, fraud prevention, service
            improvement (always balanced against your rights)
          </li>
          <li>
            <strong className="text-white/90">Consent:</strong> Marketing emails and optional analytics (you may
            withdraw consent at any time)
          </li>
          <li>
            <strong className="text-white/90">Legal obligation:</strong> Compliance with applicable law
          </li>
        </ul>
        <p className="mb-2">
          <strong className="text-white/90">Additional Rights:</strong>
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
          <li>Right to restrict processing</li>
          <li>Right to object to processing based on legitimate interests</li>
          <li>Right to lodge a complaint with your local supervisory authority</li>
        </ul>
        <p className="mb-3">
          <strong className="text-white/90">Data Transfers:</strong> Your data is processed and stored on servers
          in the United States. We use standard contractual clauses (SCCs) and other appropriate safeguards for
          international data transfers where required.
        </p>
        <p>
          To exercise GDPR rights, contact <LegalEmail />. We will respond within{" "}
          <strong className="text-white/90">30 days</strong>.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">11. Smart Store and Personalized Recommendations</h2>
        <p className="mb-3">
          If you choose to enable personalized Smart Store recommendations, we use your browsing and purchase
          history within the platform to surface relevant products. This processing is based on your consent and
          can be disabled at any time in your account settings.
        </p>
        <p>
          We do not share your Smart Store browsing data with third-party advertisers. Product recommendations are
          generated internally.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">12. Links to Third-Party Sites and Ecosystem Products</h2>
        <p>
          The Services contain links to third-party websites and NI Ecosystem products (e.g., Match Fit at{" "}
          <a
            href="https://match-fit.net"
            className="text-cyan-400 hover:text-cyan-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            match-fit.net
          </a>
          , thenilabs.com). This Privacy Policy applies only to northsideintelligence.com and our directly
          operated Services. Third-party sites and ecosystem products have their own privacy policies; we encourage
          you to review them.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">13. Changes to This Privacy Policy</h2>
        <p className="mb-3">We may update this Privacy Policy from time to time. When we make material changes, we will:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>Update the &quot;Last Updated&quot; date at the top of this policy</li>
          <li>Send an email notice to registered users</li>
          <li>Display a prominent notice on the platform for at least 30 days</li>
        </ul>
        <p>
          Continued use of the Services after the effective date of changes constitutes acceptance of the updated
          policy. If you do not agree to material changes, you may delete your account before the effective date.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">14. Contact Us</h2>
        <p className="mb-3">For privacy questions, data requests, or to exercise your rights:</p>
        <div className="space-y-2">
          <p>
            <strong className="text-white/90">Privacy Inquiries:</strong> <LegalEmail />
          </p>
          <p>
            <strong className="text-white/90">Legal / Compliance:</strong> <LegalEmail />
          </p>
          <p>
            <strong className="text-white/90">General Support:</strong> <LegalEmail />
          </p>
        </div>
        <p className="mb-2 mt-4 font-medium text-white/80">Mailing Address:</p>
        <address className="not-italic text-ni-muted">
          Northside Intelligence
          <br />
          c/o Northside Ventures Group LLC
          <br />
          1954 Airport Rd STE 1277
          <br />
          Chamblee, GA 30341
          <br />
          United States
        </address>
        <p className="mt-4">
          We aim to respond to all privacy requests within <strong className="text-white/90">30 days</strong> of
          receipt.
        </p>
      </section>

      <p className="border-t border-cyan-500/10 pt-6 text-sm italic text-ni-muted/80">
        This Privacy Policy was last updated on {updatedDate}. Thank you for trusting Northside Intelligence with
        your data.
      </p>
    </>
  );
}
