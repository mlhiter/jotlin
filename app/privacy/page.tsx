import Link from 'next/link'

import { LandingFooter } from '@/components/landing/footer'
import { LandingHeader } from '@/components/landing/header'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Jotlin',
  description: 'Privacy Policy for Jotlin - AI-powered requirements analysis tool',
}

export default function PrivacyPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <LandingHeader />

      <main className="flex-1">
        <article className="prose prose-zinc dark:prose-invert mx-auto max-w-4xl px-6 py-16 md:px-8 md:py-24">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: November 5, 2025</p>

          <section>
            <h2>Introduction</h2>
            <p>
              Welcome to Jotlin (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are
              committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our service.
            </p>
          </section>

          <section>
            <h2>Information We Collect</h2>

            <h3>Account Information</h3>
            <p>When you create an account using OAuth authentication, we collect:</p>
            <ul>
              <li>Email address</li>
              <li>Profile picture and display name</li>
              <li>OAuth provider ID (Google or GitHub)</li>
            </ul>

            <h3>Usage Data</h3>
            <p>We collect information about how you use our service:</p>
            <ul>
              <li>Chat history and conversations</li>
              <li>Generated requirements documents and specifications</li>
              <li>User interactions with the platform</li>
              <li>Feature usage and preferences</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <p>When you access our service, we automatically collect:</p>
            <ul>
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Operating system</li>
              <li>Usage analytics and performance metrics</li>
            </ul>
          </section>

          <section>
            <h2>How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul>
              <li>Provide, maintain, and improve our service</li>
              <li>Personalize your experience</li>
              <li>Generate AI-powered requirements analysis and suggestions</li>
              <li>Process your requests and respond to inquiries</li>
              <li>Send service-related notifications and updates</li>
              <li>Analyze usage patterns and optimize performance</li>
              <li>Ensure security and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2>Data Storage and Security</h2>
            <p>We implement industry-standard security measures to protect your data:</p>
            <ul>
              <li>All data is encrypted in transit using TLS/SSL</li>
              <li>Data at rest is encrypted using industry-standard encryption</li>
              <li>We use secure cloud infrastructure with regular security audits</li>
              <li>Access to personal data is restricted to authorized personnel only</li>
              <li>We retain data only as long as necessary for the purposes outlined</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive
              to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2>Third-Party Services</h2>
            <p>We use the following third-party services that may collect information:</p>
            <ul>
              <li>
                <strong>Google OAuth</strong> - For authentication and account creation
              </li>
              <li>
                <strong>GitHub OAuth</strong> - For authentication (if applicable)
              </li>
              <li>
                <strong>OpenAI API</strong> - For AI-powered analysis (data is not used for model training)
              </li>
              <li>
                <strong>Cloud Infrastructure Providers</strong> - For hosting and data storage
              </li>
            </ul>
          </section>

          <section>
            <h2>Google API Services User Data Policy</h2>
            <p>
              Our use of information received from Google APIs adheres to the{' '}
              <Link
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline">
                Google API Services User Data Policy
              </Link>
              , including the Limited Use requirements.
            </p>
            <p>We only use Google user data to:</p>
            <ul>
              <li>Authenticate users and create accounts</li>
              <li>Display user profile information within our service</li>
            </ul>
            <p>We do NOT:</p>
            <ul>
              <li>Transfer Google user data to third parties for advertising purposes</li>
              <li>Use or transfer Google user data to determine creditworthiness or lending</li>
              <li>Sell Google user data to any third parties</li>
              <li>Use Google user data for purposes unrelated to our core functionality</li>
            </ul>
          </section>

          <section>
            <h2>Data Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share your information
              only in the following circumstances:
            </p>
            <ul>
              <li>
                <strong>With your consent</strong> - When you explicitly authorize us to share information
              </li>
              <li>
                <strong>Service providers</strong> - With trusted third-party service providers who assist in operating
                our service
              </li>
              <li>
                <strong>Legal requirements</strong> - When required by law or to protect our rights
              </li>
              <li>
                <strong>Business transfers</strong> - In connection with a merger, acquisition, or sale of assets
              </li>
            </ul>
          </section>

          <section>
            <h2>Your Rights and Choices</h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul>
              <li>
                <strong>Access</strong> - Request a copy of your personal data
              </li>
              <li>
                <strong>Correction</strong> - Request correction of inaccurate data
              </li>
              <li>
                <strong>Deletion</strong> - Request deletion of your account and data
              </li>
              <li>
                <strong>Export</strong> - Request an export of your data in a portable format
              </li>
              <li>
                <strong>Opt-out</strong> - Opt-out of certain data collection practices
              </li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{' '}
              <Link href="mailto:mlhiter955@gmail.com" className="text-primary hover:underline">
                mlhiter955@gmail.com
              </Link>
              .
            </p>
          </section>

          <section>
            <h2>Data Retention and Deletion</h2>
            <p>
              We retain your personal data only as long as necessary to provide our services and fulfill the purposes
              outlined in this policy. You can request account deletion at any time by contacting us. Upon receiving a
              deletion request, we will:
            </p>
            <ul>
              <li>Delete your account and associated personal data within 30 days</li>
              <li>Retain certain data if required by law or for legitimate business purposes</li>
              <li>Anonymize data used for analytics so it can no longer identify you</li>
            </ul>
          </section>

          <section>
            <h2>Children&apos;s Privacy</h2>
            <p>
              Our service is not intended for children under the age of 13. We do not knowingly collect personal
              information from children under 13. If you believe we have inadvertently collected such information,
              please contact us immediately, and we will take steps to delete it.
            </p>
          </section>

          <section>
            <h2>International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence.
              These countries may have different data protection laws. By using our service, you consent to such
              transfers. We ensure appropriate safeguards are in place to protect your data.
            </p>
          </section>

          <section>
            <h2>Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience. You can control cookie
              preferences through your browser settings. Note that disabling cookies may affect the functionality of our
              service.
            </p>
          </section>

          <section>
            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal
              requirements. We will notify users of significant changes by:
            </p>
            <ul>
              <li>Posting the updated policy on this page</li>
              <li>Updating the &quot;Last updated&quot; date</li>
              <li>Sending email notifications for material changes (if applicable)</li>
            </ul>
            <p>Your continued use of the service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>If you have any questions, concerns, or requests regarding this Privacy Policy:</p>
            <ul>
              <li>
                Email:{' '}
                <Link href="mailto:mlhiter955@gmail.com" className="text-primary hover:underline">
                  mlhiter955@gmail.com
                </Link>
              </li>
              <li>
                Website:{' '}
                <Link href="https://jotlin.ai" className="text-primary hover:underline">
                  https://jotlin.ai
                </Link>
              </li>
            </ul>
          </section>
        </article>
      </main>

      <LandingFooter />
    </div>
  )
}
