'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricCard } from '@/components/analytics/MetricCard';
import { ComparisonChart } from '@/components/analytics/ComparisonChart';
import { LineChart } from '@/components/analytics/LineChart';
import { PerformanceTable, Column } from '@/components/analytics/PerformanceTable';
import {
  ArrowLeft,
  Trophy,
  Pause,
  Play,
  Trash2,
  Download,
  RefreshCw,
  TrendingUp,
  Eye,
  MousePointerClick,
  DollarSign,
  Target,
  Calendar,
  Users
} from 'lucide-react';

interface ABTest {
  id: string;
  name: string;
  creativeIds: string[];
  metaCampaignId: string;
  status: string;
  budget: number;
  objective: string;
  startDate: string;
  endDate: string | null;
  winnerCreativeId: string | null;
  createdAt: string;
  variants: ABTestVariant[];
  analytics: AdAnalytics[];
  // Aggregate metrics
  totalImpressions?: number;
  totalClicks?: number;
  avgCtr?: number;
  avgCpc?: number;
  avgCpm?: number;
  totalSpend?: number;
  totalConversions?: number;
}

interface ABTestVariant {
  id: string;
  creativeId: string;
  metaAdId: string;
  status: string;
  creative?: Creative;
}

interface Creative {
  id: string;
  imageUrls: string[];
  textVariant: {
    headline: string;
    body: string;
  };
}

interface AdAnalytics {
  id: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  spend: number;
  cpc: number;
  cpm: number;
  date: string;
  metaAdId: string;
}

export default function ABTestDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [test, setTest] = useState<ABTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (testId) {
      fetchTestDetails();
    }
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/meta/abtests/${testId}`);
      setTest(response.data.abTest);
    } catch (error) {
      console.error('Error fetching test details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAnalytics = async () => {
    try {
      setSyncing(true);
      await api.post(`/meta/abtests/${testId}/sync`);
      await fetchTestDetails();
    } catch (error) {
      console.error('Error syncing analytics:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeclareWinner = async (creativeId: string) => {
    if (!confirm('Are you sure you want to declare this variant as the winner?')) {
      return;
    }

    try {
      await api.post(`/meta/abtests/${testId}/declare-winner`, {
        winner_creative_id: creativeId
      });
      await fetchTestDetails();
    } catch (error) {
      console.error('Error declaring winner:', error);
      alert('Failed to declare winner. Please try again.');
    }
  };

  const handlePauseResume = async () => {
    if (!test) return;

    const newStatus = test.status === 'active' ? 'paused' : 'active';
    const action = test.status === 'active' ? 'pause' : 'resume';

    if (!confirm(`Are you sure you want to ${action} this test?`)) {
      return;
    }

    try {
      await api.patch(`/meta/campaigns/${test.metaCampaignId}/status`, {
        status: newStatus === 'active' ? 'ACTIVE' : 'PAUSED'
      });
      await fetchTestDetails();
    } catch (error) {
      console.error(`Error ${action}ing test:`, error);
      alert(`Failed to ${action} test. Please try again.`);
    }
  };

  const handleDelete = async () => {
    if (!test) return;

    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/meta/abtests/${testId}`);
      router.push('/ab-testing');
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Failed to delete test. Please try again.');
    }
  };

  const handleExport = () => {
    if (!test) return;

    // Prepare CSV data
    const csvRows = [];
    csvRows.push(['Test Name', test.name || `Test #${test.id}`]);
    csvRows.push(['Status', test.status]);
    csvRows.push(['Budget', `$${test.budget}`]);
    csvRows.push(['Total Spend', `$${test.totalSpend?.toFixed(2) || '0'}`]);
    csvRows.push([]);
    csvRows.push(['Metric', 'Value']);
    csvRows.push(['Total Impressions', test.totalImpressions || 0]);
    csvRows.push(['Total Clicks', test.totalClicks || 0]);
    csvRows.push(['Avg CTR', `${((test.avgCtr || 0) * 100).toFixed(2)}%`]);
    csvRows.push(['Avg CPC', `$${(test.avgCpc || 0).toFixed(2)}`]);
    csvRows.push(['Total Conversions', test.totalConversions || 0]);

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abtest-${test.id}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadgeVariant = (status: string): 'draft' | 'active' | 'paused' | 'completed' | 'archived' => {
    const statusMap: Record<string, 'draft' | 'active' | 'paused' | 'completed' | 'archived'> = {
      'draft': 'draft',
      'active': 'active',
      'paused': 'paused',
      'completed': 'completed',
      'archived': 'archived'
    };
    return statusMap[status] || 'draft';
  };

  // Prepare variant comparison data
  const variantComparisonData = test?.variants.map((variant) => {
    const variantAnalytics = test.analytics.filter((a) => a.metaAdId === variant.metaAdId);
    const totalImpressions = variantAnalytics.reduce((sum, a) => sum + a.impressions, 0);
    const totalClicks = variantAnalytics.reduce((sum, a) => sum + a.clicks, 0);
    const avgCtr = totalClicks / totalImpressions || 0;
    const totalSpend = variantAnalytics.reduce((sum, a) => sum + a.spend, 0);

    return {
      id: variant.id,
      name: variant.creative?.textVariant?.headline || `Variant ${variant.id.substring(0, 6)}`,
      value: avgCtr,
      isWinner: variant.creativeId === test.winnerCreativeId,
      impressions: totalImpressions,
      clicks: totalClicks,
      spend: totalSpend,
    };
  }) || [];

  // Prepare time-series data for charts
  const timeSeriesData = test?.analytics
    .reduce((acc: any[], analytics) => {
      const dateStr = new Date(analytics.date).toLocaleDateString();
      const existing = acc.find((item) => item.date === dateStr);

      if (existing) {
        existing.impressions += analytics.impressions;
        existing.clicks += analytics.clicks;
        existing.spend += analytics.spend;
        existing.conversions += analytics.conversions;
      } else {
        acc.push({
          date: dateStr,
          impressions: analytics.impressions,
          clicks: analytics.clicks,
          spend: analytics.spend,
          conversions: analytics.conversions,
          ctr: analytics.ctr,
        });
      }

      return acc;
    }, [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  // Prepare table columns
  const analyticsColumns: Column[] = [
    { key: 'date', label: 'Date', sortable: true, format: 'date' },
    { key: 'impressions', label: 'Impressions', sortable: true, format: 'number', align: 'right' },
    { key: 'clicks', label: 'Clicks', sortable: true, format: 'number', align: 'right' },
    { key: 'ctr', label: 'CTR', sortable: true, format: 'percent', align: 'right' },
    { key: 'conversions', label: 'Conversions', sortable: true, format: 'number', align: 'right' },
    { key: 'spend', label: 'Spend', sortable: true, format: 'currency', align: 'right' },
    { key: 'cpc', label: 'CPC', sortable: true, format: 'currency', align: 'right' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-48 bg-muted animate-pulse rounded mb-8" />
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-64 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-40 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">Test not found</p>
              <Button onClick={() => router.push('/ab-testing')} className="mt-4">
                Back to Tests
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const budgetUtilization = (test.totalSpend || 0) / test.budget;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/ab-testing')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">
                {test.name || `Test #${test.id.substring(0, 8)}`}
              </h1>
              <Badge variant={getStatusBadgeVariant(test.status)} pulse={test.status === 'active'}>
                {test.status}
              </Badge>
              {test.winnerCreativeId && (
                <Badge variant="completed">
                  <Trophy className="h-3 w-3 mr-1" />
                  Winner Declared
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Started {new Date(test.startDate).toLocaleDateString()}
              </div>
              {test.endDate && (
                <div className="flex items-center gap-1">
                  Ended {new Date(test.endDate).toLocaleDateString()}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {test.variants.length} variants
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {test.objective}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSyncAnalytics} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {test.status === 'active' && (
              <Button variant="outline" onClick={handlePauseResume}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            {test.status === 'paused' && (
              <Button variant="outline" onClick={handlePauseResume}>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
            <Button variant="outline" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Budget Progress */}
        <Card>
          <CardContent className="pt-6">
            <Progress
              value={test.totalSpend || 0}
              max={test.budget}
              label="Budget Utilization"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>${(test.totalSpend || 0).toFixed(2)} spent</span>
              <span>${test.budget.toFixed(2)} total budget</span>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Impressions"
            value={(test.totalImpressions || 0).toLocaleString()}
            icon={Eye}
          />
          <MetricCard
            title="Total Clicks"
            value={(test.totalClicks || 0).toLocaleString()}
            icon={MousePointerClick}
          />
          <MetricCard
            title="Average CTR"
            value={((test.avgCtr || 0) * 100).toFixed(2)}
            valueSuffix="%"
            icon={TrendingUp}
          />
          <MetricCard
            title="Total Spend"
            value={(test.totalSpend || 0).toFixed(2)}
            valuePrefix="$"
            icon={DollarSign}
          />
        </div>

        {/* Variant Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Variant Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {variantComparisonData.length > 0 ? (
              <ComparisonChart
                variants={variantComparisonData}
                metric="ctr"
                metricLabel="Click-Through Rate"
                valueFormatter={(v) => `${(v * 100).toFixed(2)}%`}
              />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No variant data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variant Details Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {test.variants.map((variant) => {
            const variantAnalytics = test.analytics.filter((a) => a.metaAdId === variant.metaAdId);
            const totalImpressions = variantAnalytics.reduce((sum, a) => sum + a.impressions, 0);
            const totalClicks = variantAnalytics.reduce((sum, a) => sum + a.clicks, 0);
            const avgCtr = totalClicks / totalImpressions || 0;
            const totalSpend = variantAnalytics.reduce((sum, a) => sum + a.spend, 0);
            const isWinner = variant.creativeId === test.winnerCreativeId;

            return (
              <Card
                key={variant.id}
                className={isWinner ? 'border-green-500 border-2 bg-green-50 dark:bg-green-950' : ''}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {variant.creative?.textVariant?.headline || `Variant ${variant.id.substring(0, 6)}`}
                    </CardTitle>
                    {isWinner && (
                      <Badge variant="active" pulse>
                        <Trophy className="h-3 w-3 mr-1" />
                        Winner
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Creative Preview */}
                  {variant.creative && variant.creative.imageUrls[0] && (
                    <img
                      src={variant.creative.imageUrls[0]}
                      alt="Creative"
                      className="w-full h-40 object-cover rounded"
                    />
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Impressions</p>
                      <p className="font-semibold">{totalImpressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Clicks</p>
                      <p className="font-semibold">{totalClicks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CTR</p>
                      <p className="font-semibold">{(avgCtr * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Spend</p>
                      <p className="font-semibold">${totalSpend.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isWinner && test.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDeclareWinner(variant.creativeId)}
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Declare Winner
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts and Analytics */}
        <Tabs defaultValue="timeline">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">Performance Timeline</TabsTrigger>
            <TabsTrigger value="comparison">Variant Comparison</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {timeSeriesData.length > 0 ? (
                  <LineChart
                    data={timeSeriesData}
                    lines={[
                      { dataKey: 'impressions', name: 'Impressions', color: '#3b82f6' },
                      { dataKey: 'clicks', name: 'Clicks', color: '#10b981' },
                    ]}
                    xKey="date"
                    height={400}
                  />
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No timeline data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Variant Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {variantComparisonData.length > 0 ? (
                  <ComparisonChart
                    variants={variantComparisonData}
                    metric="ctr"
                    metricLabel="Click-Through Rate"
                    valueFormatter={(v) => `${(v * 100).toFixed(2)}%`}
                    height={300}
                  />
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No comparison data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="mt-6">
            <PerformanceTable
              title="Detailed Analytics"
              data={test.analytics}
              columns={analyticsColumns}
              pageSize={10}
              searchable={true}
              exportable={true}
              onExport={handleExport}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
