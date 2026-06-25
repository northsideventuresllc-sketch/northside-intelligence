import { LegalEmail } from "@/components/legal/LegalEmail";
import { getSiteUpdatedDate } from "@/lib/legal/site-updated";

export function TermsOfServiceContent() {
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
        <h2 className="mb-3 text-lg font-medium text-white">1. Agreement to Terms</h2>
        <p>
          By accessing or using the Northside Intelligence website, platform, Intelligence Tools, Smart Store,
          Intelligence Services, or any associated products (collectively, the &quot;Services&quot;), you
          (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) agree to be legally bound by these Terms of
          Service (&quot;Terms&quot;). These Terms constitute a binding agreement between you and{" "}
          <strong className="text-white/90">Northside Intelligence</strong>, a product of{" "}
          <strong className="text-white/90">Northside Ventures Group LLC</strong> (&quot;NI,&quot; &quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;), a Georgia limited liability company.
        </p>
        <p className="mt-3">
          If you do not agree to these Terms in their entirety, you must immediately cease all use of the Services.
          If you are using the Services on behalf of an organization or business, you represent and warrant that
          you have authority to bind that organization to these Terms.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">2. Eligibility</h2>
        <p>
          You must be at least <strong className="text-white/90">13 years of age</strong> to use the Services. If
          you are under 18, you represent that your parent or legal guardian has reviewed and agreed to these Terms
          on your behalf. We do not knowingly collect data from or provide Services to children under 13.
        </p>
        <p className="mb-2 mt-3">By creating an account or using the Services, you represent that:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>You are legally capable of entering into binding contracts;</li>
          <li>You are not prohibited by law from using our Services;</li>
          <li>All registration information you provide is accurate and current.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">3. Account Registration</h2>

        <h3 className="mb-2 text-base font-medium text-white/90">3.1 Account Creation</h3>
        <p className="mb-4">
          To access most Services, you must register for a free Northside Intelligence Portal account. You agree to
          provide accurate, complete, and current information during registration and to keep your information up to
          date.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">3.2 Account Security</h3>
        <p className="mb-2">You are solely responsible for:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>Maintaining the confidentiality of your login credentials;</li>
          <li>All activity that occurs under your account;</li>
          <li>
            Notifying us immediately at <LegalEmail /> of any unauthorized access or suspected security breach.
          </li>
        </ul>
        <p className="mb-4">
          We are not liable for any loss or damage arising from your failure to protect your account credentials.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">3.3 One Account Per User</h3>
        <p className="mb-4">
          Each user may maintain only one account. Creating multiple accounts to circumvent usage limits or
          restrictions is a violation of these Terms and may result in termination of all associated accounts.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">3.4 Account Termination by User</h3>
        <p>
          You may delete your account at any time through your account settings or by contacting us. Deletion is
          subject to the data retention provisions in our Privacy Policy.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">4. Description of Services</h2>
        <p className="mb-3">Northside Intelligence offers four distinct product categories:</p>

        <h3 className="mb-2 text-base font-medium text-white/90">4.1 Intelligence Tools</h3>
        <p className="mb-2">AI-powered browser-based applications including, but not limited to:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white/90">ReplyFlow</strong> — AI-powered customer service reply automation
          </li>
          <li>
            <strong className="text-white/90">GrantBot</strong> — AI grant finder and drafter
          </li>
          <li>
            <strong className="text-white/90">Signal Desk</strong> — Unified intelligence signals hub
          </li>
          <li>
            <strong className="text-white/90">GapScan</strong> — Automated workflow gap detection
          </li>
          <li>
            <strong className="text-white/90">BridgeAI</strong> — Cross-platform AI orchestration
          </li>
        </ul>
        <p>
          Intelligence Tools run in the cloud on NI infrastructure. You provide input; our AI systems process and
          return results. You are responsible for reviewing and approving all AI-generated outputs before use. New
          tools may be added and existing tools may be modified, discontinued, or moved to different pricing tiers at
          any time.
        </p>

        <h3 className="mb-2 mt-4 text-base font-medium text-white/90">4.2 Smart Store</h3>
        <p>
          A curated e-commerce experience where products are sourced from third-party suppliers. The Smart Store is
          separate from Intelligence Tools and does not require a subscription. Smart Store product availability,
          pricing, and fulfillment are governed by Section 9 of these Terms.
        </p>

        <h3 className="mb-2 mt-4 text-base font-medium text-white/90">4.3 Intelligence Services</h3>
        <p>
          Custom, high-touch professional engagements including Tailored Intelligence Server builds, Intelligence Audit
          &amp; Gap Analysis, Personal Intelligence Setup, AI Research Assistant Setup, Personal Knowledge Base Build,
          Executive Briefing Intelligence, Enterprise AI Strategy, Workflow Integration &amp; Automation, AI
          Governance &amp; Compliance Frameworks, and Team Training. Services are individually scoped and quoted. A
          free NI Portal account is required to order any Service.
        </p>

        <h3 className="mb-2 mt-4 text-base font-medium text-white/90">4.4 Intelligence Ecosystem</h3>
        <p>
          Standalone ventures and products developed under Northside Intelligence Labs (e.g., Match Fit, StreamPass,
          WavScope) that operate independently with their own terms and websites. This platform provides directory
          and navigation access only; separate terms govern each ecosystem product.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">5. Subscription Plans and Billing</h2>

        <h3 className="mb-2 text-base font-medium text-white/90">5.1 Plan Tiers</h3>
        <p className="mb-3">Intelligence Tools are available under the following subscription tiers:</p>
        <div className="overflow-x-auto">
          <table className="legal-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Price</th>
                <th>Tool Slots</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Free</td>
                <td>$0/mo</td>
                <td>All tools (limited)</td>
                <td>Monthly usage caps per tool</td>
              </tr>
              <tr>
                <td>Core</td>
                <td>$20/mo ($13/mo annual)</td>
                <td>3 tool slots</td>
                <td>Unlimited on selected tools</td>
              </tr>
              <tr>
                <td>Pro</td>
                <td>$39/mo ($27/mo annual)</td>
                <td>10 tool slots</td>
                <td>Unlimited on selected tools</td>
              </tr>
              <tr>
                <td>Power</td>
                <td>$59/mo ($47/mo annual)</td>
                <td>Unlimited</td>
                <td>Unlimited across all tools</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="mb-2 mt-4 text-base font-medium text-white/90">5.2 À La Carte Tool Access</h3>
        <p className="mb-4">
          Free tier users may purchase individual tool access at the published per-tool monthly rate (e.g., ReplyFlow
          at $15/mo, GrantBot at $39/mo, Signal Desk at $24/mo, GapScan at $18/mo, BridgeAI at $29/mo). Annual and
          lifetime options may be available.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">5.3 Billing and Payment</h3>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>
            All subscription payments are processed through <strong className="text-white/90">Stripe</strong>, our
            third-party payment processor.
          </li>
          <li>Subscriptions are billed at the start of each billing cycle (monthly or annual).</li>
          <li>Annual plans are billed in full at the time of purchase.</li>
          <li>
            Prices are listed in USD. We reserve the right to change pricing with{" "}
            <strong className="text-white/90">30 days&apos; advance notice</strong> to active subscribers via email.
          </li>
          <li>You authorize us to charge your payment method on file for all amounts due.</li>
        </ul>

        <h3 className="mb-2 text-base font-medium text-white/90">5.4 Free Trial and Usage Limits</h3>
        <p className="mb-4">
          Free tier usage limits are defined per tool and subject to change. Exceeding free tier limits will require
          an upgrade. We will not automatically charge you for overages on the Free tier.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">5.5 Cancellation</h3>
        <p className="mb-4">
          You may cancel your subscription at any time through your account dashboard or by contacting support.
          Cancellation takes effect at the <strong className="text-white/90">end of the current billing period</strong>
          . No partial-period refunds are issued for monthly subscriptions unless required by applicable law. Annual
          subscriptions are non-refundable except as provided in Section 5.6.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">5.6 Refunds</h3>
        <p className="mb-4">
          We offer a <strong className="text-white/90">7-day refund window</strong> for new annual plan purchases if
          you have not materially used the plan. Refund requests must be submitted to <LegalEmail />. Refunds for
          Intelligence Services are governed by the individual service agreement. Smart Store purchases are subject to
          the refund policy in Section 9.5.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">5.7 Disputed Charges</h3>
        <p>
          If you believe a charge is incorrect, contact us within <strong className="text-white/90">30 days</strong>{" "}
          of the charge date. We will investigate and work to resolve the dispute in good faith.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">6. Intelligence Services Terms</h2>

        <h3 className="mb-2 text-base font-medium text-white/90">6.1 Service Agreements</h3>
        <p className="mb-4">
          Each Intelligence Service engagement is governed by these Terms plus a separate Statement of Work or service
          agreement detailing scope, deliverables, timelines, and pricing. In the event of conflict, the Statement of
          Work governs.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">6.2 Payment for Services</h3>
        <p className="mb-4">
          Services require a deposit or payment schedule as outlined in the individual agreement. Failure to remit
          payment may result in suspension of work and forfeiture of deposits.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">6.3 Client Responsibilities</h3>
        <p className="mb-4">
          You agree to provide timely access to information, systems, and personnel required for service delivery.
          Delays caused by your failure to cooperate may extend timelines without additional NI liability.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">6.4 Deliverables and IP</h3>
        <p className="mb-4">
          Unless expressly stated otherwise in a written agreement, deliverables produced specifically for you become
          your property upon full payment. NI retains ownership of all underlying methodologies, frameworks, tools,
          and pre-existing intellectual property.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">6.5 No Guarantee of Outcomes</h3>
        <p>
          Intelligence Services are professional advisory and implementation services. We do not guarantee specific
          business outcomes, ROI, regulatory compliance, or grant award success.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">7. Smart Store Terms</h2>

        <h3 className="mb-2 text-base font-medium text-white/90">7.1 Product Listings</h3>
        <p className="mb-4">
          Smart Store products are sourced from third-party suppliers. NI curates, scores, and presents these products
          but does not manufacture, warehouse, or directly fulfill orders in all cases.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">7.2 Pricing</h3>
        <p className="mb-4">
          Displayed product prices are verified against supplier listings at checkout. The price confirmed
          at checkout is the product price you authorize us to charge.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">7.3 Shipping &amp; Handling Stipend</h3>
        <p className="mb-4">
          At checkout, a <strong className="text-white/90">shipping &amp; handling stipend</strong> is added
          to cover carrier postage, handling, and payment processing. The stipend is sized above expected
          carrier costs. After your order ships, we reconcile actual postage and handling against the
          stipend collected.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">7.4 Post-Fulfillment Adjustments</h3>
        <p className="mb-4">
          If actual shipping and handling costs are <strong className="text-white/90">less</strong> than the
          stipend collected, we refund the unused amount to your original payment method. If actual costs are{" "}
          <strong className="text-white/90">more</strong> than the stipend, we may charge the payment card
          on file for the difference and will email you with the amount charged. By placing an order, you
          authorize these post-fulfillment adjustments and agree to keep a valid payment method on file
          through order completion.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">7.5 Failed Payments and Order Cancellation</h3>
        <p className="mb-4">
          If a required post-fulfillment charge or manual payment step cannot be completed, we will email
          you with instructions to resolve the issue. You have{" "}
          <strong className="text-white/90">72 hours</strong> to complete the required action. If payment
          is not resolved within that window, your order may be cancelled automatically.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">7.6 Order Processing</h3>
        <p className="mb-4">
          By placing an order, you authorize us to process payment and transmit your order to the supplier for
          fulfillment. Order confirmation does not guarantee product availability.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">7.7 Shipping and Delivery</h3>
        <p className="mb-4">
          Estimated delivery times are provided by suppliers and are not guaranteed. NI is not responsible for carrier
          delays, customs delays, or lost shipments once an order has been handed to the carrier.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">7.8 Returns and Refunds</h3>
        <p className="mb-4">
          Return and refund eligibility is determined on a per-product basis and communicated at the time of purchase.
          To initiate a return, contact <LegalEmail /> within <strong className="text-white/90">14 days</strong> of
          delivery. Refunds are processed to your original payment method within{" "}
          <strong className="text-white/90">10 business days</strong> of return approval.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">7.9 Third-Party Suppliers</h3>
        <p>
          NI is not responsible for supplier conduct, product defects beyond reasonable quality standards, or
          misrepresentations made by suppliers. Your sole remedy for defective products is a return/refund as
          described in Section 7.8.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">8. Acceptable Use Policy</h2>
        <p className="mb-3">You agree not to use the Services to:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong className="text-white/90">Violate any law</strong> — including but not limited to consumer
            protection, data privacy, intellectual property, or export control laws;
          </li>
          <li>
            <strong className="text-white/90">Submit false or misleading content</strong> — including false
            identities, fraudulent grant applications, or deceptive business information;
          </li>
          <li>
            <strong className="text-white/90">Infringe intellectual property</strong> — uploading, processing, or
            distributing content you do not have rights to use;
          </li>
          <li>
            <strong className="text-white/90">Reverse engineer the platform</strong> — attempt to decompile,
            disassemble, or extract source code from any NI system or AI model;
          </li>
          <li>
            <strong className="text-white/90">Circumvent usage limits</strong> — using multiple accounts, automation,
            or other methods to bypass free tier caps or paid access controls;
          </li>
          <li>
            <strong className="text-white/90">Interfere with platform operation</strong> — transmitting malware,
            running denial-of-service attacks, scraping data without authorization, or exploiting system
            vulnerabilities;
          </li>
          <li>
            <strong className="text-white/90">Harass or harm others</strong> — using AI-generated outputs to harass,
            defame, impersonate, or cause harm to any person or organization;
          </li>
          <li>
            <strong className="text-white/90">Generate prohibited content</strong> — including but not limited to:
            content that is illegal, sexually explicit involving minors, discriminatory, or violates applicable law;
          </li>
          <li>
            <strong className="text-white/90">Automate access at scale</strong> — using bots, crawlers, or scripts to
            access the Services without our express written authorization;
          </li>
          <li>
            <strong className="text-white/90">Resell or sublicense</strong> — reselling access to Intelligence Tools or
            outputs without a written reseller agreement with NI.
          </li>
        </ol>
        <p className="mt-3">
          Violation of this policy may result in immediate account suspension or termination, forfeiture of any
          unused subscription credits, and referral to appropriate law enforcement.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">9. Intellectual Property</h2>

        <h3 className="mb-2 text-base font-medium text-white/90">9.1 NI Ownership</h3>
        <p className="mb-4">
          All content, design, code, software, AI models, brand assets, trademarks, trade names (including
          &quot;Northside Intelligence,&quot; &quot;NORTHSiDE,&quot; &quot;ReplyFlow,&quot; &quot;GrantBot,&quot;
          &quot;Signal Desk,&quot; &quot;GapScan,&quot; &quot;BridgeAI,&quot; and associated logos), and platform
          infrastructure are the exclusive property of Northside Ventures Group LLC or its licensors. Nothing in these
          Terms transfers any IP rights to you.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">9.2 Your Content</h3>
        <p className="mb-4">
          You retain ownership of any content, data, or materials you submit to the Services (&quot;User
          Content&quot;). By submitting User Content, you grant NI a{" "}
          <strong className="text-white/90">limited, non-exclusive, royalty-free license</strong> to process, store,
          and use your User Content solely to provide and improve the Services. We do not claim ownership of your User
          Content.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">9.3 AI-Generated Outputs</h3>
        <p className="mb-4">
          Outputs generated by Intelligence Tools in response to your inputs (&quot;AI Outputs&quot;) are provided for
          your personal or business use. You are responsible for verifying the accuracy, legality, and appropriateness
          of all AI Outputs before use. NI makes no representation that AI Outputs are accurate, complete, or fit for
          any particular purpose.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">9.4 Feedback</h3>
        <p>
          If you submit feedback, bug reports, or improvement suggestions, you grant NI an irrevocable, perpetual,
          royalty-free license to use that feedback for any purpose without compensation to you.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">10. Third-Party Services and Integrations</h2>
        <p className="mb-3">The Services are powered in part by third-party providers including:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white/90">Anthropic</strong> (Claude AI models) — AI processing
          </li>
          <li>
            <strong className="text-white/90">Stripe</strong> — payment processing
          </li>
          <li>
            <strong className="text-white/90">Supabase</strong> — database infrastructure
          </li>
          <li>
            <strong className="text-white/90">Vercel</strong> — hosting and delivery
          </li>
          <li>
            <strong className="text-white/90">Third-party product suppliers</strong> — Smart Store fulfillment
          </li>
        </ul>
        <p>
          Use of third-party services is subject to those providers&apos; own terms and privacy policies. NI is not
          responsible for third-party service outages, data handling practices, or policy changes.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">11. Beta Features and Previews</h2>
        <p>
          Some tools, features, or services may be offered in &quot;beta,&quot; &quot;preview,&quot; or &quot;early
          access&quot; status. These features are provided as-is with no uptime guarantees, may change significantly,
          and may be discontinued at any time. Beta features may not be covered by standard SLAs or support
          commitments.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">12. Disclaimers of Warranties</h2>
        <p className="mb-3">
          THE SERVICES ARE PROVIDED <strong className="text-white/90">&quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;</strong>{" "}
          WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, NI
          EXPRESSLY DISCLAIMS ALL WARRANTIES INCLUDING:
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE;</li>
          <li>ACCURACY, COMPLETENESS, OR RELIABILITY OF AI-GENERATED OUTPUTS;</li>
          <li>UNINTERRUPTED OR ERROR-FREE OPERATION;</li>
          <li>SECURITY OR FREEDOM FROM VIRUSES OR HARMFUL CODE;</li>
          <li>RESULTS TO BE OBTAINED FROM USE OF THE SERVICES.</li>
        </ul>
        <p>
          NI DOES NOT WARRANT THAT AI OUTPUTS ARE ACCURATE, LEGALLY COMPLIANT, OR SUITABLE FOR ANY SPECIFIC
          APPLICATION INCLUDING GRANT APPLICATIONS, LEGAL FILINGS, MEDICAL ADVICE, OR FINANCIAL DECISIONS.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">13. Limitation of Liability</h2>
        <p className="mb-3">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</p>
        <ol className="mb-4 list-decimal space-y-2 pl-5">
          <li>
            NI&apos;S TOTAL AGGREGATE LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM OR RELATING TO THE SERVICES SHALL
            NOT EXCEED THE GREATER OF: <strong className="text-white/90">(a) THE AMOUNT YOU PAID TO NI IN THE 12
            MONTHS PRECEDING THE CLAIM</strong>, OR <strong className="text-white/90">(b) $100 USD</strong>.
          </li>
          <li>
            IN NO EVENT SHALL NI BE LIABLE FOR ANY{" "}
            <strong className="text-white/90">
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES
            </strong>
            , including lost profits, lost data, business interruption, reputational harm, or cost of substitute
            services, even if NI has been advised of the possibility of such damages.
          </li>
          <li>
            THESE LIMITATIONS APPLY REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, NEGLIGENCE, STRICT
            LIABILITY, OR OTHERWISE).
          </li>
        </ol>
        <p>
          Some jurisdictions do not allow exclusion of certain warranties or limitations of liability. In such
          jurisdictions, the above limitations apply to the maximum extent permitted by law.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">14. Indemnification</h2>
        <p className="mb-2">
          You agree to indemnify, defend, and hold harmless NI, Northside Ventures Group LLC, and their officers,
          directors, employees, contractors, and agents from and against any claims, liabilities, damages, losses,
          costs, or expenses (including reasonable attorneys&apos; fees) arising from:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Your use or misuse of the Services;</li>
          <li>Your violation of these Terms;</li>
          <li>Your violation of any third-party rights, including intellectual property or privacy rights;</li>
          <li>Any content you submit to the Services;</li>
          <li>Your violation of any applicable law.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">15. Modifications to the Services</h2>
        <p className="mb-2">We reserve the right to:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>Add, modify, suspend, or discontinue any feature, tool, or Service at any time;</li>
          <li>Change pricing with 30 days&apos; notice to active subscribers;</li>
          <li>Update these Terms at any time.</li>
        </ul>
        <p>
          We will provide notice of material changes to these Terms via email or prominent notice on the platform.
          Continued use of the Services after changes become effective constitutes your acceptance.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">16. Account Suspension and Termination</h2>

        <h3 className="mb-2 text-base font-medium text-white/90">16.1 By NI</h3>
        <p className="mb-2">
          We may suspend or terminate your account immediately, without notice, if we determine in our sole discretion
          that you have:
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-5">
          <li>Violated these Terms or our Acceptable Use Policy;</li>
          <li>Engaged in fraudulent or illegal activity;</li>
          <li>Posed a security risk to the platform or other users;</li>
          <li>Failed to pay amounts due.</li>
        </ul>

        <h3 className="mb-2 text-base font-medium text-white/90">16.2 Effect of Termination</h3>
        <p>
          Upon termination: (a) your right to use the Services ceases immediately; (b) outstanding balances remain
          due; (c) Sections 9, 12, 13, 14, 17, 18, and 19 survive termination indefinitely.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">17. Governing Law and Dispute Resolution</h2>

        <h3 className="mb-2 text-base font-medium text-white/90">17.1 Governing Law</h3>
        <p className="mb-4">
          These Terms are governed by the laws of the <strong className="text-white/90">State of Georgia, United
          States</strong>, without regard to conflict of law principles.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">17.2 Informal Resolution</h3>
        <p className="mb-4">
          Before initiating formal proceedings, you agree to contact us at <LegalEmail /> to attempt informal
          resolution of any dispute. We will respond within 30 days.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">17.3 Binding Arbitration</h3>
        <p className="mb-4">
          If informal resolution fails, any dispute, claim, or controversy arising from these Terms or the Services
          shall be resolved by <strong className="text-white/90">binding individual arbitration</strong> administered
          by the <strong className="text-white/90">American Arbitration Association (AAA)</strong> under its Consumer
          Arbitration Rules. Arbitration will be conducted in <strong className="text-white/90">Fulton County,
          Georgia</strong>, or via remote hearing. The arbitrator&apos;s decision is final and binding.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">17.4 Class Action Waiver</h3>
        <p className="mb-4">
          <strong className="text-white/90">
            YOU WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION, CLASS ARBITRATION, OR REPRESENTATIVE PROCEEDING.
          </strong>{" "}
          All claims must be brought in your individual capacity.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">17.5 Small Claims</h3>
        <p className="mb-4">
          Notwithstanding the above, either party may bring an individual claim in small claims court if the claim
          qualifies.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">17.6 Jury Trial Waiver</h3>
        <p>
          TO THE EXTENT PERMITTED BY LAW, BOTH PARTIES WAIVE THE RIGHT TO A JURY TRIAL IN ANY DISPUTE ARISING FROM
          THESE TERMS.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">18. General Provisions</h2>

        <h3 className="mb-2 text-base font-medium text-white/90">18.1 Entire Agreement</h3>
        <p className="mb-4">
          These Terms, together with our Privacy Policy and any applicable service agreements, constitute the entire
          agreement between you and NI regarding the Services.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">18.2 Severability</h3>
        <p className="mb-4">
          If any provision of these Terms is found unenforceable, the remaining provisions continue in full force.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">18.3 No Waiver</h3>
        <p className="mb-4">
          Failure to enforce any provision of these Terms does not constitute a waiver of the right to enforce it in
          the future.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">18.4 Assignment</h3>
        <p className="mb-4">
          You may not assign or transfer these Terms or any rights hereunder without our prior written consent. NI may
          assign these Terms in connection with a merger, acquisition, or sale of assets.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">18.5 Force Majeure</h3>
        <p className="mb-4">
          NI is not liable for delays or failures caused by circumstances beyond our reasonable control, including
          natural disasters, pandemics, government actions, power outages, or third-party service failures.
        </p>

        <h3 className="mb-2 text-base font-medium text-white/90">18.6 Relationship of Parties</h3>
        <p>
          Nothing in these Terms creates any agency, partnership, joint venture, employment, or franchise relationship
          between you and NI.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">19. Contact Information</h2>
        <p className="mb-2">
          <strong className="text-white/90">Northside Intelligence</strong>
        </p>
        <p className="mb-4">
          A product of <strong className="text-white/90">Northside Ventures Group LLC</strong>
        </p>
        <address className="mb-4 not-italic text-ni-muted">
          1954 Airport Rd STE 1277
          <br />
          Chamblee, GA 30341
          <br />
          United States
        </address>
        <ul className="space-y-2">
          <li>
            <strong className="text-white/90">General:</strong> <LegalEmail />
          </li>
          <li>
            <strong className="text-white/90">Legal / Terms questions:</strong> <LegalEmail />
          </li>
          <li>
            <strong className="text-white/90">Support:</strong> <LegalEmail />
          </li>
          <li>
            <strong className="text-white/90">Website:</strong>{" "}
            <a
              href="https://northsideintelligence.com"
              className="text-cyan-400 hover:text-cyan-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              northsideintelligence.com
            </a>
          </li>
        </ul>
      </section>

      <p className="border-t border-cyan-500/10 pt-6 text-sm italic text-ni-muted/80">
        These Terms of Service were last updated on {updatedDate}. By continuing to use Northside Intelligence
        Services, you acknowledge that you have read, understood, and agree to be bound by these Terms.
      </p>
    </>
  );
}
