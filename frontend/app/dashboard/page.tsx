'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sparkles,
  LayoutDashboard,
  Wand2,
  TestTube,
  BarChart3,
  Settings,
  LogOut,
  Image as ImageIcon,
  TrendingUp,
  Target,
  DollarSign
} from 'lucide-react';

interface DashboardData {
  creatives: Array<{
    id: string;
    headline: string;
    body: string;
    cta: string;
    image_url: string;
    score: number;
    ctr: number | null;
    cpc: number | null;
    spend: number | null;
    created_at: string;
  }>;
  summary: {
    total_creatives: number;
    total_tests: number;
    avg_ctr: number;
    avg_score: number;
    top_creative_id: string | null;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<any>(null);
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaAccountId, setMetaAccountId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    loadDashboard();
    checkMetaConnection();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUser(session.user);
  };

  const loadDashboard = async () => {
    try {
      const response = await api.get('/api/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMetaConnection = async () => {
    try {
      const response = await api.get('/api/meta/status');
      setMetaConnected(response.data.connected);
      setMetaAccountId(response.data.ad_account_id);
    } catch (error) {
      console.error('Failed to check Meta connection:', error);
    }
  };

  const connectMetaAccount = async () => {
    try {
      const response = await api.get('/api/meta/connect');
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Failed to connect Meta account:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card flex-col">
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Creativity
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard">
            <Button variant="secondary" className="w-full justify-start gap-3" size="lg">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Button>
          </Link>
          <Link href="/generate">
            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
              <Wand2 className="h-5 w-5" />
              Generate
            </Button>
          </Link>
          <Link href="/creatives">
            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
              <ImageIcon className="h-5 w-5" />
              Creatives
            </Button>
          </Link>
          <Link href="/ab-testing">
            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
              <TestTube className="h-5 w-5" />
              A/B Tests
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
            <Settings className="h-5 w-5" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive" size="lg" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
              </p>
            </div>
            <Link href="/generate">
              <Button size="lg" className="gap-2">
                <Wand2 className="h-5 w-5" />
                Generate Creatives
              </Button>
            </Link>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Creatives
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data?.summary.total_creatives || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Generated ad variants</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-500/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Tests
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <TestTube className="h-5 w-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data?.summary.total_tests || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Running campaigns</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-500/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. CTR
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {((data?.summary.avg_ctr || 0) * 100).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Click-through rate</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-orange-500/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Score
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {((data?.summary.avg_score || 0) * 100).toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">AI performance score</p>
              </CardContent>
            </Card>
          </div>

          {/* Meta Connection Card */}
          <Card className={`border-2 ${metaConnected ? 'border-green-500/50' : 'border-orange-500/50'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {metaConnected ? (
                      <>
                        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                        Meta Account Connected
                      </>
                    ) : (
                      <>
                        <div className="h-3 w-3 rounded-full bg-orange-500" />
                        Connect Meta Account
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {metaConnected
                      ? `Connected to ad account: ${metaAccountId}`
                      : 'Connect your Meta (Facebook) account to run A/B tests and track analytics'}
                  </CardDescription>
                </div>
                {!metaConnected && (
                  <Button onClick={connectMetaAccount} size="lg" className="gap-2">
                    <TestTube className="h-5 w-5" />
                    Connect Meta
                  </Button>
                )}
              </div>
            </CardHeader>
            {metaConnected && (
              <CardContent>
                <div className="flex gap-4">
                  <Link href="/ab-testing">
                    <Button variant="outline" className="gap-2">
                      <TestTube className="h-4 w-4" />
                      Manage A/B Tests
                    </Button>
                  </Link>
                  <Link href="/analytics">
                    <Button variant="outline" className="gap-2">
                      <BarChart3 className="h-4 w-4" />
                      View Analytics
                    </Button>
                  </Link>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Recent Creatives */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Recent Creatives</CardTitle>
                  <CardDescription>Your most recently generated ad creatives</CardDescription>
                </div>
                <Link href="/creatives">
                  <Button variant="outline">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data?.creatives && data.creatives.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.creatives.map((creative) => (
                    <Card key={creative.id} className="group hover:shadow-lg transition-all border-2 hover:border-primary/50">
                      <CardContent className="pt-6 space-y-4">
                        <div className="relative overflow-hidden rounded-lg">
                          <img
                            src={creative.image_url}
                            alt={creative.headline}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 right-2">
                            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                              Score: {(creative.score * 100).toFixed(0)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-bold text-lg line-clamp-2">{creative.headline}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{creative.body}</p>
                        </div>

                        {creative.ctr && (
                          <div className="flex items-center gap-4 text-sm pt-2 border-t">
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4 text-green-500" />
                              <span className="font-medium">{(creative.ctr * 100).toFixed(2)}%</span>
                            </div>
                            {creative.spend && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-orange-500" />
                                <span className="font-medium">${creative.spend.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <Button variant="secondary" className="w-full" size="sm">
                          {creative.cta}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">No creatives yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Get started by generating your first AI-powered ad creative
                    </p>
                    <Link href="/generate">
                      <Button size="lg" className="gap-2">
                        <Wand2 className="h-5 w-5" />
                        Generate Your First Creative
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
