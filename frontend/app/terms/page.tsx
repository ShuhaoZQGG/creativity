'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Creativity
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <Card className="border-2">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none dark:prose-invert p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Creativity ("Service," "Platform," "we," "our"), you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
              <p>
                Creativity is an AI-powered platform that provides:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>AI-generated ad creative content (text and images)</li>
                <li>Integration with Meta (Facebook) Ads platform</li>
                <li>A/B testing and campaign management tools</li>
                <li>Analytics and performance tracking</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
              <h3 className="text-xl font-semibold mb-3">3.1 Account Creation</h3>
              <p>You must create an account to use the Service. You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Be responsible for all activity under your account</li>
                <li>Notify us immediately of unauthorized use</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">3.2 Age Requirement</h3>
              <p>You must be at least 18 years old to use this Service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Meta Integration</h2>
              <h3 className="text-xl font-semibold mb-3">4.1 Authorization</h3>
              <p>
                By connecting your Meta account, you authorize us to create and manage ad campaigns on your behalf using Meta's Marketing API.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">4.2 Your Responsibility</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are responsible for all ad spend and charges from Meta</li>
                <li>You must comply with Meta's advertising policies</li>
                <li>You maintain ownership of your Meta account and data</li>
                <li>You can revoke access at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Acceptable Use</h2>
              <h3 className="text-xl font-semibold mb-3">You agree NOT to:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for illegal purposes</li>
                <li>Create content that violates Meta's advertising policies</li>
                <li>Generate misleading, fraudulent, or deceptive content</li>
                <li>Attempt to reverse engineer or hack the Service</li>
                <li>Resell or redistribute our Service without permission</li>
                <li>Use the Service to spam or harass others</li>
                <li>Violate any third-party rights (copyright, trademark, etc.)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
              <h3 className="text-xl font-semibold mb-3">6.1 Your Content</h3>
              <p>
                You retain ownership of content you provide (images, text, URLs). By using the Service, you grant us a license to use your content
                to provide the Service (e.g., send to AI providers for generation).
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">6.2 Generated Content</h3>
              <p>
                AI-generated content belongs to you. However, you are responsible for ensuring generated content complies with applicable laws
                and platform policies.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">6.3 Our Platform</h3>
              <p>
                The Service, including design, code, and features, is owned by us and protected by intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Payment and Subscriptions</h2>
              <h3 className="text-xl font-semibold mb-3">7.1 Pricing</h3>
              <p>
                Subscription pricing is available on our website. We reserve the right to change prices with 30 days notice.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">7.2 Billing</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Subscriptions are billed monthly or annually</li>
                <li>Payments are processed through Stripe</li>
                <li>You are responsible for all taxes</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">7.3 Cancellation</h3>
              <p>
                You may cancel your subscription at any time. Access continues until the end of your billing period. No refunds for partial months.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Service Availability</h2>
              <p>
                We strive to provide reliable service, but we do not guarantee:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Uninterrupted or error-free service</li>
                <li>Specific uptime or availability</li>
                <li>Compatibility with all browsers or devices</li>
              </ul>
              <p className="mt-3">
                We may modify, suspend, or discontinue features at any time with reasonable notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Disclaimers</h2>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="font-semibold mb-2">THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</p>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>We do not guarantee ad performance or ROI</li>
                  <li>AI-generated content may require review and editing</li>
                  <li>We are not responsible for Meta platform changes or policies</li>
                  <li>We do not guarantee specific results from A/B tests</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>Our total liability is limited to the amount you paid in the last 12 months</li>
                <li>We are not liable for third-party services (Meta, OpenAI, etc.)</li>
                <li>We are not liable for your ad spend or campaign performance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Indemnification</h2>
              <p>
                You agree to indemnify and hold us harmless from claims arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Content you create or campaigns you run</li>
                <li>Your violation of third-party rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Termination</h2>
              <h3 className="text-xl font-semibold mb-3">12.1 By You</h3>
              <p>You may terminate your account at any time through account settings.</p>

              <h3 className="text-xl font-semibold mb-3 mt-4">12.2 By Us</h3>
              <p>We may terminate or suspend your account if you:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate these Terms</li>
                <li>Engage in fraudulent activity</li>
                <li>Fail to pay subscription fees</li>
                <li>Misuse the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. We will notify you of material changes by email or platform notice.
                Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">14. Governing Law</h2>
              <p>
                These Terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved in the courts of [Your Jurisdiction].
              </p>
            </section>

            <section className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">15. Contact Information</h2>
              <p className="mb-4">For questions about these Terms, contact us:</p>
              <div className="space-y-2">
                <p>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:legal@creativity-app.com" className="text-primary hover:underline">
                    legal@creativity-app.com
                  </a>
                </p>
                <p>
                  <strong>Support:</strong>{' '}
                  <a href="mailto:support@creativity-app.com" className="text-primary hover:underline">
                    support@creativity-app.com
                  </a>
                </p>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/" className="hover:text-primary">
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
