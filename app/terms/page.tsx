import Link from 'next/link'

import { LandingFooter } from '@/components/landing/footer'
import { LandingHeader } from '@/components/landing/header'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Jotlin',
  description: 'Terms of Service for Jotlin - AI-powered requirements analysis tool',
}

export default function TermsPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <LandingHeader />

      <main className="flex-1">
        <article className="prose prose-zinc dark:prose-invert mx-auto max-w-4xl px-6 py-16 md:px-8 md:py-24">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: November 5, 2025</p>

          <section>
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing or using Jotlin (&quot;the Service&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
            </p>
            <p>
              We reserve the right to modify these Terms at any time. Your continued use of the Service after changes
              are posted constitutes your acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2>Description of Service</h2>
            <p>
              Jotlin is an AI-powered requirements analysis tool that helps users transform ideas and concepts into
              structured specifications, including:
            </p>
            <ul>
              <li>AI-assisted requirements document generation</li>
              <li>User story and flow diagram creation</li>
              <li>Risk analysis and mitigation planning</li>
              <li>Collaborative chat interface for iterative refinement</li>
            </ul>
            <p>
              The Service is provided &quot;as is&quot; and we reserve the right to modify, suspend, or discontinue any
              aspect of the Service at any time.
            </p>
          </section>

          <section>
            <h2>User Accounts</h2>

            <h3>Registration</h3>
            <p>To use certain features of the Service, you must create an account by:</p>
            <ul>
              <li>Authenticating via Google OAuth or other supported providers</li>
              <li>Providing accurate and complete information</li>
              <li>Maintaining the security of your account credentials</li>
            </ul>
            <p>
              You are responsible for all activities that occur under your account. You agree to notify us immediately
              of any unauthorized use of your account.
            </p>

            <h3>Account Requirements</h3>
            <ul>
              <li>You must be at least 13 years old to use the Service</li>
              <li>One account per person</li>
              <li>You may not share your account with others</li>
              <li>You may not create multiple accounts to circumvent limitations or restrictions</li>
            </ul>
          </section>

          <section>
            <h2>Acceptable Use Policy</h2>
            <p>You agree NOT to use the Service to:</p>
            <ul>
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Upload, transmit, or distribute malicious code, viruses, or harmful content</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems</li>
              <li>Abuse, harass, threaten, or intimidate other users</li>
              <li>Use automated systems (bots, scrapers) without our explicit written permission</li>
              <li>Overload, interfere with, or disrupt the Service or its infrastructure</li>
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Remove, obscure, or alter any proprietary notices</li>
            </ul>
            <p>Violation of this Acceptable Use Policy may result in immediate account suspension or termination.</p>
          </section>

          <section>
            <h2>Intellectual Property Rights</h2>

            <h3>Your Content</h3>
            <p>
              You retain ownership of all content you create, upload, or submit to the Service (&quot;Your
              Content&quot;), including:
            </p>
            <ul>
              <li>Chat messages and conversations</li>
              <li>Requirements documents and specifications</li>
              <li>User stories, flows, and risk analyses</li>
            </ul>
            <p>
              By using the Service, you grant us a limited, worldwide, non-exclusive, royalty-free license to use,
              store, process, and display Your Content solely to provide and improve the Service.
            </p>

            <h3>Our Service</h3>
            <p>
              Jotlin and its original content, features, and functionality are owned by us and are protected by
              international copyright, trademark, and other intellectual property laws.
            </p>
            <p>You may not:</p>
            <ul>
              <li>Copy, modify, or create derivative works of the Service</li>
              <li>Sell, rent, lease, or sublicense access to the Service</li>
              <li>Use our branding, logos, or trademarks without written permission</li>
            </ul>
          </section>

          <section>
            <h2>AI-Generated Content</h2>
            <p>
              The Service uses artificial intelligence to generate requirements, suggestions, and analysis. You
              acknowledge and agree that:
            </p>
            <ul>
              <li>AI-generated content is provided &quot;as is&quot; without warranties</li>
              <li>You are responsible for reviewing, validating, and verifying all AI-generated content</li>
              <li>We do not guarantee the accuracy, completeness, or suitability of AI outputs</li>
              <li>AI-generated content should not be considered professional advice</li>
              <li>You should not rely solely on AI-generated content for critical business decisions</li>
            </ul>
          </section>

          <section>
            <h2>Payment and Subscription</h2>
            <p>Jotlin may offer both free and paid subscription plans. The terms for paid plans are as follows:</p>
            <ul>
              <li>
                <strong>Free Tier</strong> - Provided as-is with usage limitations
              </li>
              <li>
                <strong>Paid Plans</strong> - Billed according to the plan selected
              </li>
              <li>
                <strong>Payment</strong> - All fees are charged in advance and are non-refundable except as required by
                law
              </li>
              <li>
                <strong>Cancellation</strong> - You may cancel your subscription at any time; cancellation takes effect
                at the end of the current billing period
              </li>
              <li>
                <strong>Price Changes</strong> - We may change prices with 30 days&apos; notice
              </li>
            </ul>
          </section>

          <section>
            <h2>Data Usage and Privacy</h2>
            <p>
              Your use of the Service is also governed by our{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              . By using the Service, you consent to our collection and use of your data as described in the Privacy
              Policy.
            </p>
            <p>Key points:</p>
            <ul>
              <li>We process your data to provide and improve the Service</li>
              <li>We do not sell your personal information to third parties</li>
              <li>AI processing may involve third-party services (data is not used for model training)</li>
              <li>You can request data deletion at any time</li>
            </ul>
          </section>

          <section>
            <h2>Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul>
              <li>Warranties of merchantability or fitness for a particular purpose</li>
              <li>Warranties of non-infringement</li>
              <li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
              <li>Warranties regarding the accuracy or reliability of AI-generated content</li>
            </ul>
            <p>
              We do not warrant that defects will be corrected or that the Service is free of viruses or other harmful
              components.
            </p>
          </section>

          <section>
            <h2>Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul>
              <li>Loss of profits, data, use, or goodwill</li>
              <li>Service interruptions or system failures</li>
              <li>Errors or inaccuracies in AI-generated content</li>
              <li>Unauthorized access to your data</li>
              <li>Costs of substitute services</li>
            </ul>
            <p>
              OUR TOTAL LIABILITY FOR ALL CLAIMS ARISING FROM OR RELATING TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU
              PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR $100 USD, WHICHEVER IS GREATER.
            </p>
          </section>

          <section>
            <h2>Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Jotlin and its officers, directors, employees, and
              agents from any claims, liabilities, damages, losses, and expenses (including reasonable attorneys&apos;
              fees) arising from:
            </p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your Content</li>
            </ul>
          </section>

          <section>
            <h2>Termination</h2>
            <p>We may terminate or suspend your account and access to the Service:</p>
            <ul>
              <li>For violation of these Terms or our Acceptable Use Policy</li>
              <li>For prolonged inactivity</li>
              <li>If required by law or regulatory authority</li>
              <li>At our discretion with or without notice</li>
            </ul>
            <p>Upon termination:</p>
            <ul>
              <li>Your right to use the Service immediately ceases</li>
              <li>We may delete Your Content in accordance with our data retention policy</li>
              <li>You remain liable for all obligations accrued prior to termination</li>
            </ul>
            <p>You may terminate your account at any time by contacting us or using the account deletion feature.</p>
          </section>

          <section>
            <h2>Dispute Resolution</h2>
            <p>
              If you have a dispute with us, please contact us first to attempt to resolve it informally. If we cannot
              resolve the dispute informally, you agree that any legal action will be subject to binding arbitration,
              except where prohibited by law.
            </p>
          </section>

          <section>
            <h2>Governing Law and Jurisdiction</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of [Your Jurisdiction], without
              regard to its conflict of law provisions. You agree to submit to the exclusive jurisdiction of the courts
              located in [Your Jurisdiction] for the resolution of any disputes.
            </p>
          </section>

          <section>
            <h2>Changes to These Terms</h2>
            <p>We reserve the right to modify these Terms at any time. When we make material changes, we will:</p>
            <ul>
              <li>Update the &quot;Last updated&quot; date at the top of this page</li>
              <li>Notify you via email or in-app notification (for significant changes)</li>
              <li>Provide a reasonable notice period before changes take effect</li>
            </ul>
            <p>
              Your continued use of the Service after the changes take effect constitutes your acceptance of the
              modified Terms.
            </p>
          </section>

          <section>
            <h2>Severability</h2>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will
              remain in full force and effect.
            </p>
          </section>

          <section>
            <h2>Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Jotlin
              regarding the Service and supersede all prior agreements and understandings.
            </p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>If you have any questions, concerns, or feedback regarding these Terms:</p>
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
