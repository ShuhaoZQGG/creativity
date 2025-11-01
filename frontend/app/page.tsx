import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Zap, TrendingUp, Target, Image, BarChart3, Palette, Rocket } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Creativity
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            AI-Powered Ad Creative Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Generate High-Converting
            <span className="block bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Ad Creatives in Seconds
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Transform your Meta Ads with AI-generated creatives that are scored, tested, and optimized for maximum performance
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 h-14">
                <Rocket className="mr-2 h-5 w-5" />
                Start Creating Free
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                View Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-primary">3-5x</div>
              <div className="text-sm text-muted-foreground">Better CTR</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">10min</div>
              <div className="text-sm text-muted-foreground">To Launch</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">AI</div>
              <div className="text-sm text-muted-foreground">Powered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-3xl my-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to Win
          </h2>
          <p className="text-xl text-muted-foreground">
            Powerful AI tools to create, score, and optimize your ad campaigns
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Image className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>AI Image Generation</CardTitle>
              <CardDescription>
                Create stunning visuals with DALL-E 3 and Stability AI that capture attention
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Palette className="h-6 w-6 text-purple-500" />
              </div>
              <CardTitle>Smart Copy Writing</CardTitle>
              <CardDescription>
                Generate compelling headlines and ad copy with GPT-4 and Claude 3.5
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle>AI Performance Scoring</CardTitle>
              <CardDescription>
                Get predictive scores on clarity, engagement, and conversion potential
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle>A/B Testing</CardTitle>
              <CardDescription>
                Push creatives to Meta Ads and run automated split tests
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
              <CardTitle>Real-Time Analytics</CardTitle>
              <CardDescription>
                Track CTR, CPC, and ROI with integrated Meta Ads dashboard
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-pink-500" />
              </div>
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Generate multiple variants in seconds and launch campaigns in minutes
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Launch in 3 Simple Steps
          </h2>
          <p className="text-xl text-muted-foreground">
            From idea to live campaign in under 10 minutes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white text-2xl font-bold flex items-center justify-center mx-auto">
              1
            </div>
            <h3 className="text-2xl font-bold">Input Your Brand</h3>
            <p className="text-muted-foreground">
              Tell us about your product, target audience, and brand voice
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-2xl font-bold flex items-center justify-center mx-auto">
              2
            </div>
            <h3 className="text-2xl font-bold">Generate & Score</h3>
            <p className="text-muted-foreground">
              AI creates multiple ad variants with predictive performance scores
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-pink-600 to-red-600 text-white text-2xl font-bold flex items-center justify-center mx-auto">
              3
            </div>
            <h3 className="text-2xl font-bold">Test & Optimize</h3>
            <p className="text-muted-foreground">
              Launch A/B tests on Meta Ads and track real-time performance
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 h-14">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-2 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to 10x Your Ad Performance?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of marketers who are already using AI to create better ads
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8 h-14">
                  Start Free Trial
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                Book a Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-bold">Creativity</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
                <Link href="/data-deletion" className="hover:text-primary transition-colors">
                  Data Deletion
                </Link>
              </div>
              <p>
                © 2025 Creativity. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
