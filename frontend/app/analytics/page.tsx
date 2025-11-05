'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricCard } from '@/components/analytics/MetricCard';
import { LineChart } from '@/components/analytics/LineChart';
import { BarChart } from '@/components/analytics/BarChart';
import { PerformanceTable, Column } from '@/components/analytics/PerformanceTable';
import {
  Download,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointerClick,
  DollarSign,
  Target,
  Calendar
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
  endDate: string;
  createdAt: string;
}

interface Analytics {
  id: string;
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  spend: number;
  cpc: number;
  cpm: number;
  roas: number | null;
}

type DateRangePreset = '7d' | '14d' | '30d' | '90d' | 'custom';

export default function AnalyticsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('all');
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('30d');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [previousPeriodData, setPreviousPeriodData] = useState<Analytics[]>([]);

  useEffect(() => {
    fetchConnectionStatus();
    fetchTests();
  }, []);

  useEffect(() => {
    if (selectedTest && selectedTest !== '') {
      fetchAnalytics();
      fetchPreviousPeriodData();
    }
  }, [selectedTest, dateRange]);

  const fetchConnectionStatus = async () => {
    try {
      const response = await api.get('/meta/status');
      setIsConnected(response.data.connected);
    } catch (error) {
      console.error('Error fetching connection status:', error);
      setIsConnected(false);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await api.get('/meta/abtests');
      setTests(response.data.tests);
      if (response.data.tests.length > 0 && !selectedTest) {
        setSelectedTest('all');
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      if (selectedTest === 'all') {
        // Fetch analytics for all tests
        const allAnalytics: Analytics[] = [];
        for (const test of tests) {
          const response = await api.get(
            `/meta/abtests/${test.id}/analytics?start_date=${dateRange.start}&end_date=${dateRange.end}`
          );
          if (response.data.analytics) {
            allAnalytics.push(...response.data.analytics);
          }
        }
        setAnalytics(allAnalytics);
      } else {
        const response = await api.get(
          `/meta/abtests/${selectedTest}/analytics?start_date=${dateRange.start}&end_date=${dateRange.end}`
        );
        setAnalytics(response.data.analytics || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchPreviousPeriodData = async () => {
    try {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const prevStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const prevEnd = new Date(startDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (selectedTest === 'all') {
        const allAnalytics: Analytics[] = [];
        for (const test of tests) {
          const response = await api.get(
            `/meta/abtests/${test.id}/analytics?start_date=${prevStart}&end_date=${prevEnd}`
          );
          if (response.data.analytics) {
            allAnalytics.push(...response.data.analytics);
          }
        }
        setPreviousPeriodData(allAnalytics);
      } else if (selectedTest) {
        const response = await api.get(
          `/meta/abtests/${selectedTest}/analytics?start_date=${prevStart}&end_date=${prevEnd}`
        );
        setPreviousPeriodData(response.data.analytics || []);
      }
    } catch (error) {
      console.error('Error fetching previous period data:', error);
    }
  };

  const handleDateRangePresetChange = (preset: DateRangePreset) => {
    setDateRangePreset(preset);

    if (preset === 'custom') return;

    const end = new Date().toISOString().split('T')[0];
    let start: string;

    switch (preset) {
      case '7d':
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '14d':
        start = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30d':
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '90d':
        start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        return;
    }

    setDateRange({ start, end });
  };

  const connectMetaAccount = async () => {
    try {
      const response = await api.get('/meta/connect');
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Error connecting Meta account:', error);
    }
  };

  const calculateTotals = () => {
    return analytics.reduce(
      (acc, curr) => ({
        impressions: acc.impressions + curr.impressions,
        clicks: acc.clicks + curr.clicks,
        conversions: acc.conversions + curr.conversions,
        spend: acc.spend + curr.spend,
      }),
      { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
    );
  };

  const calculatePreviousTotals = () => {
    return previousPeriodData.reduce(
      (acc, curr) => ({
        impressions: acc.impressions + curr.impressions,
        clicks: acc.clicks + curr.clicks,
        conversions: acc.conversions + curr.conversions,
        spend: acc.spend + curr.spend,
      }),
      { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
    );
  };

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const exportToCSV = () => {
    if (analytics.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Date', 'Impressions', 'Clicks', 'CTR', 'Conversions', 'Spend', 'CPC', 'CPM'];
    const rows = analytics.map((a) => [
      new Date(a.date).toLocaleDateString(),
      a.impressions,
      a.clicks,
      (a.ctr * 100).toFixed(2) + '%',
      a.conversions,
      '$' + a.spend.toFixed(2),
      '$' + a.cpc.toFixed(2),
      '$' + a.cpm.toFixed(2),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${selectedTest}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Prepare time-series data for charts
  const timeSeriesData = analytics
    .reduce((acc: any[], data) => {
      const dateStr = new Date(data.date).toLocaleDateString();
      const existing = acc.find((item) => item.date === dateStr);

      if (existing) {
        existing.impressions += data.impressions;
        existing.clicks += data.clicks;
        existing.spend += data.spend;
        existing.conversions += data.conversions;
      } else {
        acc.push({
          date: dateStr,
          impressions: data.impressions,
          clicks: data.clicks,
          spend: data.spend,
          conversions: data.conversions,
          ctr: data.ctr,
        });
      }

      return acc;
    }, [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prepare table columns
  const analyticsColumns: Column[] = [
    { key: 'date', label: 'Date', sortable: true, format: 'date' },
    { key: 'impressions', label: 'Impressions', sortable: true, format: 'number', align: 'right' },
    { key: 'clicks', label: 'Clicks', sortable: true, format: 'number', align: 'right' },
    { key: 'ctr', label: 'CTR', sortable: true, format: 'percent', align: 'right' },
    { key: 'conversions', label: 'Conversions', sortable: true, format: 'number', align: 'right' },
    { key: 'spend', label: 'Spend', sortable: true, format: 'currency', align: 'right' },
    { key: 'cpc', label: 'CPC', sortable: true, format: 'currency', align: 'right' },
    { key: 'cpm', label: 'CPM', sortable: true, format: 'currency', align: 'right' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-48 bg-muted animate-pulse rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-24 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-32 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Connect Meta Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              You need to connect your Meta (Facebook) account to view analytics.
            </p>
            <Button onClick={connectMetaAccount} size="lg" className="w-full">
              Connect Meta Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Analytics</h1>
          <Card>
            <CardContent className="py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No A/B tests found</h3>
                  <p className="text-muted-foreground mb-6">
                    Create an A/B test to start viewing analytics
                  </p>
                  <Button onClick={() => router.push('/ab-testing')} size="lg">
                    Go to A/B Testing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();
  const previousTotals = calculatePreviousTotals();
  const avgCTR = totals.clicks / totals.impressions || 0;
  const avgCPC = totals.spend / totals.clicks || 0;
  const prevAvgCTR = previousTotals.clicks / previousTotals.impressions || 0;
  const prevAvgCPC = previousTotals.spend / previousTotals.clicks || 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track and analyze your ad performance
            </p>
          </div>
          <Button onClick={exportToCSV} disabled={analytics.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Test Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Test</label>
                <Select value={selectedTest} onValueChange={setSelectedTest}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select test" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tests</SelectItem>
                    {tests.map((test) => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.name || `Test #${test.id.substring(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Preset */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Period</label>
                <Select value={dateRangePreset} onValueChange={(v) => handleDateRangePresetChange(v as DateRangePreset)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="14d">Last 14 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, start: e.target.value });
                    setDateRangePreset('custom');
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, end: e.target.value });
                    setDateRangePreset('custom');
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Impressions"
            value={totals.impressions.toLocaleString()}
            change={calculateChange(totals.impressions, previousTotals.impressions)}
            trend={totals.impressions > previousTotals.impressions ? 'up' : totals.impressions < previousTotals.impressions ? 'down' : 'stable'}
            icon={Eye}
            changeLabel="vs previous period"
          />
          <MetricCard
            title="Total Clicks"
            value={totals.clicks.toLocaleString()}
            change={calculateChange(totals.clicks, previousTotals.clicks)}
            trend={totals.clicks > previousTotals.clicks ? 'up' : totals.clicks < previousTotals.clicks ? 'down' : 'stable'}
            icon={MousePointerClick}
            changeLabel="vs previous period"
          />
          <MetricCard
            title="Average CTR"
            value={(avgCTR * 100).toFixed(2)}
            valueSuffix="%"
            change={calculateChange(avgCTR, prevAvgCTR)}
            trend={avgCTR > prevAvgCTR ? 'up' : avgCTR < prevAvgCTR ? 'down' : 'stable'}
            icon={TrendingUp}
            changeLabel="vs previous period"
          />
          <MetricCard
            title="Total Spend"
            value={totals.spend.toFixed(2)}
            valuePrefix="$"
            change={calculateChange(totals.spend, previousTotals.spend)}
            trend={totals.spend < previousTotals.spend ? 'up' : totals.spend > previousTotals.spend ? 'down' : 'stable'}
            icon={DollarSign}
            changeLabel="vs previous period"
          />
        </div>

        {/* Charts */}
        <Tabs defaultValue="performance">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance">Performance Trends</TabsTrigger>
            <TabsTrigger value="metrics">Metric Breakdown</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Data</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="mt-6">
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
                      { dataKey: 'conversions', name: 'Conversions', color: '#f59e0b' },
                    ]}
                    xKey="date"
                    height={400}
                  />
                ) : (
                  <div className="py-16 text-center text-muted-foreground">
                    No data available for the selected period
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Spend</CardTitle>
                </CardHeader>
                <CardContent>
                  {timeSeriesData.length > 0 ? (
                    <BarChart
                      data={timeSeriesData}
                      bars={[{ dataKey: 'spend', name: 'Spend ($)', color: '#ef4444' }]}
                      xKey="date"
                      layout="horizontal"
                      height={300}
                      yAxisFormatter={(value) => `$${value.toFixed(2)}`}
                    />
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Click-Through Rate</span>
                        <span className="font-medium">{(avgCTR * 100).toFixed(2)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${Math.min(avgCTR * 100 * 10, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Cost Per Click</span>
                        <span className="font-medium">${avgCPC.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${Math.min((5 - avgCPC) * 20, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Total Conversions</span>
                        <span className="font-medium">{totals.conversions}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500"
                          style={{ width: `${Math.min((totals.conversions / totals.clicks) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="mt-6">
            <PerformanceTable
              title="Detailed Analytics"
              data={analytics}
              columns={analyticsColumns}
              pageSize={15}
              searchable={false}
              exportable={true}
              onExport={exportToCSV}
              emptyMessage="No analytics data available for the selected period"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
