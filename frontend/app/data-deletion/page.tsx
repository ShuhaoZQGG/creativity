'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, ArrowLeft, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function DataDeletionPage() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    try {
      // In a real implementation, this would call your backend API
      // For now, we'll simulate a successful submission
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/data-deletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          facebook_user_id: userId,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit deletion request');
      }

      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit deletion request. Please contact support directly at privacy@creativity-app.com');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-3xl">User Data Deletion</CardTitle>
                <CardDescription className="text-base mt-1">
                  Request deletion of your personal data from Creativity
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {!submitted ? (
              <>
                {/* Introduction */}
                <section>
                  <h2 className="text-2xl font-bold mb-4">Data Deletion Request</h2>
                  <p className="text-muted-foreground mb-4">
                    We respect your right to privacy and data protection. You can request deletion of your personal data
                    from our platform at any time. This page explains what data will be deleted and how to submit a deletion request.
                  </p>
                </section>

                {/* What Will Be Deleted */}
                <section>
                  <h3 className="text-xl font-semibold mb-3">What Data Will Be Deleted</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <p className="font-medium">When you request data deletion, we will permanently remove:</p>
                    <ul className="list-disc pl-6 space-y-2 text-sm">
                      <li><strong>Account Information:</strong> Your email, name, and account credentials</li>
                      <li><strong>Facebook/Meta Data:</strong> Your Facebook user ID, connected ad account IDs, and access tokens</li>
                      <li><strong>Creative Content:</strong> All ad creatives you've generated (text and images)</li>
                      <li><strong>Campaign Data:</strong> A/B test campaigns and analytics data</li>
                      <li><strong>Usage Data:</strong> Your activity logs and preferences</li>
                      <li><strong>Generated Assets:</strong> All images stored in our cloud storage (AWS S3)</li>
                    </ul>
                  </div>
                </section>

                {/* Important Notes */}
                <section>
                  <h3 className="text-xl font-semibold mb-3">Important Notes</h3>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2 text-sm">
                        <p><strong>This action is irreversible.</strong> Once deleted, your data cannot be recovered.</p>
                        <p><strong>Active campaigns:</strong> Any active Meta ad campaigns created through our platform will continue running
                          on Facebook's platform. You'll need to pause/delete them separately in Meta Ads Manager.</p>
                        <p><strong>Processing time:</strong> Data deletion is processed within 30 days of your request.</p>
                        <p><strong>Legal retention:</strong> Some data may be retained if required by law (e.g., payment records for tax purposes).</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Manual Deletion Option */}
                <section>
                  <h3 className="text-xl font-semibold mb-3">Option 1: Delete from Your Account</h3>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-sm mb-3">
                      If you have access to your account, you can delete your data directly:
                    </p>
                    <ol className="list-decimal pl-6 space-y-2 text-sm mb-4">
                      <li>Log in to your Creativity account</li>
                      <li>Navigate to <strong>Settings</strong></li>
                      <li>Scroll to the <strong>Danger Zone</strong> section</li>
                      <li>Click <strong>"Delete Account"</strong></li>
                      <li>Confirm deletion</li>
                    </ol>
                    <Link href="/dashboard">
                      <Button variant="outline" size="sm">
                        Go to Dashboard
                      </Button>
                    </Link>
                  </div>
                </section>

                {/* Request Form */}
                <section>
                  <h3 className="text-xl font-semibold mb-3">Option 2: Submit Deletion Request</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    If you can't access your account, submit a deletion request below. We'll verify your identity and process
                    your request within 30 days.
                  </p>

                  <Card className="border-2">
                    <CardContent className="pt-6">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <label htmlFor="email" className="text-sm font-medium">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            The email address associated with your Creativity account
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="userId" className="text-sm font-medium">
                            Facebook User ID <span className="text-muted-foreground">(Optional)</span>
                          </label>
                          <Input
                            id="userId"
                            type="text"
                            placeholder="123456789"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            If you connected via Facebook, include your Facebook User ID to help us locate your data
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="reason" className="text-sm font-medium">
                            Reason for Deletion <span className="text-muted-foreground">(Optional)</span>
                          </label>
                          <Textarea
                            id="reason"
                            placeholder="Tell us why you're deleting your data (optional)"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">
                            Your feedback helps us improve our service
                          </p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground">
                          <p className="mb-2">
                            By submitting this request, you confirm that:
                          </p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>You own or have authorization to delete this account</li>
                            <li>You understand this action is irreversible</li>
                            <li>You understand deletion will be completed within 30 days</li>
                          </ul>
                        </div>

                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                          {loading ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Submitting Request...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Submit Deletion Request
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </section>

                {/* Alternative Contact */}
                <section>
                  <h3 className="text-xl font-semibold mb-3">Option 3: Contact Support</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    You can also request data deletion by emailing us directly:
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm mb-2">
                      <strong>Email:</strong>{' '}
                      <a href="mailto:privacy@creativity-app.com" className="text-primary hover:underline">
                        privacy@creativity-app.com
                      </a>
                    </p>
                    <p className="text-sm">
                      <strong>Subject:</strong> Data Deletion Request
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Include your account email and Facebook User ID (if applicable) in your message.
                    </p>
                  </div>
                </section>

                {/* FAQ */}
                <section>
                  <h3 className="text-xl font-semibold mb-3">Frequently Asked Questions</h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold mb-1">How long does deletion take?</h4>
                      <p className="text-sm text-muted-foreground">
                        We process deletion requests within 30 days. You'll receive a confirmation email once completed.
                      </p>
                    </div>

                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold mb-1">What happens to my Meta ad campaigns?</h4>
                      <p className="text-sm text-muted-foreground">
                        Campaigns running on Facebook will continue. You need to manage them in Meta Ads Manager. We only delete
                        data stored in our platform.
                      </p>
                    </div>

                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold mb-1">Can I recover my data after deletion?</h4>
                      <p className="text-sm text-muted-foreground">
                        No, deletion is permanent and irreversible. Make sure to download any data you want to keep before requesting deletion.
                      </p>
                    </div>

                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold mb-1">Will my subscription be cancelled?</h4>
                      <p className="text-sm text-muted-foreground">
                        Yes, deleting your account automatically cancels any active subscriptions. You won't be charged after deletion is complete.
                      </p>
                    </div>

                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold mb-1">Do you share data with third parties after deletion?</h4>
                      <p className="text-sm text-muted-foreground">
                        No. Once deleted, your data is removed from our systems and third-party services (AWS, etc.). However, data
                        previously shared with Meta remains on their platform according to their policies.
                      </p>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              /* Success Message */
              <section className="py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Deletion Request Submitted</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We've received your data deletion request. We'll verify your identity and process your request within 30 days.
                  You'll receive a confirmation email at <strong>{email}</strong> once completed.
                </p>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    <strong>Confirmation Number:</strong> DEL-{Date.now().toString().slice(-8)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Questions? Contact us at{' '}
                    <a href="mailto:privacy@creativity-app.com" className="text-primary hover:underline">
                      privacy@creativity-app.com
                    </a>
                  </p>
                </div>
                <div className="mt-8">
                  <Link href="/">
                    <Button variant="outline">Return to Home</Button>
                  </Link>
                </div>
              </section>
            )}
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary">
            Privacy Policy
          </Link>
          <span>•</span>
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
