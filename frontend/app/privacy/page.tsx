'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none dark:prose-invert p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Introduction</h2>
              <p>
                Welcome to Creativity ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data.
                This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered
                ad creative generation and A/B testing platform.
              </p>
              <p>
                By using Creativity, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>

              <h3 className="text-xl font-semibold mb-3">1.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
                <li><strong>Creative Content:</strong> Website URLs, product descriptions, images, and text you provide for ad generation</li>
                <li><strong>Business Information:</strong> Company name, industry, target audience details</li>
                <li><strong>Payment Information:</strong> Billing information processed through Stripe (we do not store credit card details)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">1.2 Information from Meta (Facebook)</h3>
              <p>When you connect your Meta account, we collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Profile Information:</strong> Facebook user ID, email address, and public profile information</li>
                <li><strong>Ad Account Information:</strong> Ad account IDs, business account details</li>
                <li><strong>Campaign Data:</strong> Campaign IDs, ad set IDs, ad IDs created through our platform</li>
                <li><strong>Performance Metrics:</strong> Impressions, clicks, CTR, CPC, conversions, and other ad performance data</li>
                <li><strong>Access Token:</strong> OAuth access token to interact with Meta's Marketing API on your behalf</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">1.3 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
                <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                <li><strong>Cookies:</strong> Session cookies for authentication and preferences</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
              <p>We use the collected information for the following purposes:</p>

              <h3 className="text-xl font-semibold mb-3">2.1 Core Services</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>AI Creative Generation:</strong> Process your input (website, product info) to generate ad creatives using AI (OpenAI, Anthropic Claude)</li>
                <li><strong>Image Generation:</strong> Create visual assets using AI image generation services (Stability AI, DALL-E)</li>
                <li><strong>A/B Testing:</strong> Create and manage ad campaigns on Meta's platform using your ad account</li>
                <li><strong>Analytics:</strong> Fetch and display ad performance metrics from Meta to help you optimize campaigns</li>
                <li><strong>Account Management:</strong> Authenticate users and manage account access</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Improvement and Communication</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Improve our AI models and platform features</li>
                <li>Send service updates and important notifications</li>
                <li>Provide customer support</li>
                <li>Analyze usage patterns to enhance user experience</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">2.3 Meta API Permissions Usage</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>ads_management:</strong> Create campaigns, ad sets, ads, and creatives in your Meta ad account</li>
                <li><strong>ads_read:</strong> Retrieve campaign performance data and analytics</li>
                <li><strong>business_management:</strong> Access your ad accounts and business information</li>
              </ul>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold mb-4">3. Third-Party Services</h2>
              <p>We use the following third-party services to provide our platform:</p>

              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Supabase (Authentication & Database)</h4>
                  <p className="text-sm">Manages user accounts and stores application data</p>
                  <a href="https://supabase.com/privacy" className="text-primary text-sm hover:underline">Supabase Privacy Policy</a>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">OpenAI & Anthropic Claude (AI Text Generation)</h4>
                  <p className="text-sm">Generates ad copy, headlines, and descriptions</p>
                  <a href="https://openai.com/privacy/" className="text-primary text-sm hover:underline mr-4">OpenAI Privacy</a>
                  <a href="https://www.anthropic.com/privacy" className="text-primary text-sm hover:underline">Anthropic Privacy</a>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Stability AI (Image Generation)</h4>
                  <p className="text-sm">Creates AI-generated images for ads</p>
                  <a href="https://stability.ai/privacy-policy" className="text-primary text-sm hover:underline">Stability AI Privacy</a>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Meta (Facebook) Marketing API</h4>
                  <p className="text-sm">Creates and manages ad campaigns, retrieves performance data</p>
                  <a href="https://www.facebook.com/privacy/policy/" className="text-primary text-sm hover:underline">Meta Privacy Policy</a>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Amazon Web Services (AWS S3)</h4>
                  <p className="text-sm">Stores generated images and creative assets</p>
                  <a href="https://aws.amazon.com/privacy/" className="text-primary text-sm hover:underline">AWS Privacy Notice</a>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Stripe (Payment Processing)</h4>
                  <p className="text-sm">Processes subscription payments securely</p>
                  <a href="https://stripe.com/privacy" className="text-primary text-sm hover:underline">Stripe Privacy Policy</a>
                </div>
              </div>
            </section>

            {/* Data Storage and Security */}
            <section>
              <h2 className="text-2xl font-bold mb-4">4. Data Storage and Security</h2>

              <h3 className="text-xl font-semibold mb-3">4.1 Where We Store Your Data</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>User Data:</strong> Stored in Supabase PostgreSQL database with encryption at rest</li>
                <li><strong>Images:</strong> Stored in AWS S3 with secure access controls</li>
                <li><strong>Meta Tokens:</strong> Encrypted and stored in our database</li>
                <li><strong>Location:</strong> Data centers in the United States (configurable by region)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">4.2 Security Measures</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Industry-standard encryption (HTTPS/TLS) for data in transit</li>
                <li>Encrypted storage for sensitive data</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication via Supabase</li>
                <li>Secure OAuth 2.0 for Meta integration</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">4.3 Data Retention</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Data:</strong> Retained while your account is active</li>
                <li><strong>Creatives:</strong> Retained until you delete them or close your account</li>
                <li><strong>Analytics Data:</strong> Retained for up to 2 years for historical analysis</li>
                <li><strong>Deleted Accounts:</strong> Data permanently deleted within 30 days of account closure</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-bold mb-4">5. Data Sharing and Disclosure</h2>
              <p>We do not sell your personal information. We may share your data only in the following circumstances:</p>

              <h3 className="text-xl font-semibold mb-3">5.1 With Your Consent</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Meta Platform:</strong> When you connect your Meta account and create campaigns</li>
                <li><strong>AI Services:</strong> Your creative inputs are sent to AI providers for generation</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">5.2 Service Providers</h3>
              <p>We share data with third-party services necessary to operate our platform (listed in Section 3)</p>

              <h3 className="text-xl font-semibold mb-3 mt-4">5.3 Legal Requirements</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Comply with legal obligations or court orders</li>
                <li>Protect rights, property, or safety of our users</li>
                <li>Prevent fraud or abuse</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">5.4 Business Transfers</h3>
              <p>In case of merger, acquisition, or sale of assets, your data may be transferred to the new entity</p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold mb-4">6. Your Rights and Choices</h2>
              <p>You have the following rights regarding your data:</p>

              <h3 className="text-xl font-semibold mb-3">6.1 Access and Portability</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Request a copy of your personal data</li>
                <li>Export your creatives and campaign data</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">6.2 Correction and Updates</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Update your account information in settings</li>
                <li>Correct inaccurate data</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">6.3 Deletion</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Delete individual creatives or campaigns</li>
                <li>Close your account and request full data deletion</li>
                <li>Disconnect your Meta account at any time</li>
              </ul>

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mt-4">
                <p className="text-sm font-semibold mb-2">Request Data Deletion:</p>
                <p className="text-sm mb-3">
                  Visit our{' '}
                  <Link href="/data-deletion" className="text-primary hover:underline font-semibold">
                    Data Deletion Instructions page
                  </Link>
                  {' '}for detailed information on how to delete your data.
                </p>
                <Link href="/data-deletion">
                  <Button variant="outline" size="sm">
                    Go to Data Deletion Page
                  </Button>
                </Link>
              </div>

              <h3 className="text-xl font-semibold mb-3 mt-4">6.4 Opt-Out</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Unsubscribe from marketing emails</li>
                <li>Revoke Meta API permissions</li>
                <li>Disable cookies (may affect functionality)</li>
              </ul>

              <p className="mt-4 text-sm bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <strong>To exercise your rights:</strong> Contact us at{' '}
                <a href="mailto:privacy@creativity-app.com" className="text-primary hover:underline">
                  privacy@creativity-app.com
                </a>
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold mb-4">7. Cookies and Tracking</h2>
              <p>We use cookies and similar technologies for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Authentication:</strong> Keep you logged in</li>
                <li><strong>Preferences:</strong> Remember your settings</li>
                <li><strong>Analytics:</strong> Understand how you use our platform</li>
              </ul>
              <p className="mt-3">You can control cookies through your browser settings, but this may affect platform functionality.</p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
              <p>
                Our service is not intended for users under 18 years of age. We do not knowingly collect personal information from children.
                If you believe we have collected data from a child, please contact us immediately.
              </p>
            </section>

            {/* International Users */}
            <section>
              <h2 className="text-2xl font-bold mb-4">9. International Data Transfers</h2>
              <p>
                Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place
                to protect your data in accordance with this privacy policy and applicable data protection laws.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-bold mb-4">10. Changes to This Privacy Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of significant changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Updating the "Last Updated" date at the top of this page</li>
                <li>Sending you an email notification (for material changes)</li>
                <li>Displaying a notice on our platform</li>
              </ul>
              <p className="mt-3">
                Your continued use of the platform after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
              <p className="mb-4">
                If you have questions, concerns, or requests regarding this privacy policy or your data, please contact us:
              </p>

              <div className="space-y-2">
                <p>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:privacy@creativity-app.com" className="text-primary hover:underline">
                    privacy@creativity-app.com
                  </a>
                </p>
                <p>
                  <strong>Support:</strong>{' '}
                  <a href="mailto:support@creativity-app.com" className="text-primary hover:underline">
                    support@creativity-app.com
                  </a>
                </p>
                <p>
                  <strong>Response Time:</strong> We aim to respond within 48 hours
                </p>
              </div>
            </section>

            {/* Summary */}
            <section className="bg-muted/30 rounded-lg p-6 mt-8">
              <h3 className="text-xl font-semibold mb-3">Privacy Policy Summary</h3>
              <p className="text-sm mb-3">In simple terms:</p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>We collect information you provide and data from Meta when you connect your account</li>
                <li>We use AI services (OpenAI, Claude, Stability AI) to generate your ad creatives</li>
                <li>We create and manage Meta ad campaigns on your behalf with your permission</li>
                <li>We store your data securely and use industry-standard encryption</li>
                <li>We do not sell your personal information</li>
                <li>You can access, update, or delete your data at any time</li>
                <li>You can disconnect your Meta account anytime</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-primary">
            Terms of Service
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
