'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

export default function AnalyticsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchConnectionStatus();
    fetchTests();
  }, []);

  useEffect(() => {
    if (selectedTest) {
      fetchAnalytics();
    }
  }, [selectedTest, dateRange]);

  const fetchConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (error) {
      console.error('Error fetching connection status:', error);
    }
  };

  const fetchTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/abtests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setTests(data.tests);
      if (data.tests.length > 0 && !selectedTest) {
        setSelectedTest(data.tests[0].id);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/meta/abtests/${selectedTest}/analytics?start_date=${dateRange.start}&end_date=${dateRange.end}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setAnalytics(data.analytics || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const connectMetaAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/connect`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      window.location.href = data.auth_url;
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
    link.download = `analytics-${selectedTest}-${new Date().toISOString()}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Meta Account</h2>
          <p className="text-gray-600 mb-6">
            You need to connect your Meta (Facebook) account to view analytics.
          </p>
          <button
            onClick={connectMetaAccount}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Connect Meta Account
          </button>
        </div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Analytics</h1>
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <p className="text-gray-600 text-lg">No A/B tests found</p>
            <p className="text-gray-500 mt-2">Create an A/B test to view analytics</p>
            <button
              onClick={() => router.push('/ab-testing')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Go to A/B Testing
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();
  const avgCTR = totals.clicks / totals.impressions || 0;
  const avgCPC = totals.spend / totals.clicks || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Test</label>
              <select
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
              >
                {tests.map((test) => (
                  <option key={test.id} value={test.id}>
                    Test #{test.id.substring(0, 8)} - {test.objective}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm mb-1">Total Impressions</p>
            <p className="text-3xl font-bold">{totals.impressions.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm mb-1">Total Clicks</p>
            <p className="text-3xl font-bold">{totals.clicks.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">
              CTR: {(avgCTR * 100).toFixed(2)}%
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm mb-1">Total Conversions</p>
            <p className="text-3xl font-bold">{totals.conversions.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm mb-1">Total Spend</p>
            <p className="text-3xl font-bold">${totals.spend.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">
              Avg CPC: ${avgCPC.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Performance Over Time</h2>
          {analytics.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No analytics data available for the selected period
            </div>
          ) : (
            <div className="h-64 flex items-end justify-around gap-2">
              {analytics.slice(0, 10).map((data, index) => {
                const maxImpressions = Math.max(...analytics.map((a) => a.impressions));
                const height = (data.impressions / maxImpressions) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${height}%` }}
                      title={`${data.impressions} impressions`}
                    ></div>
                    <p className="text-xs mt-2 text-gray-600">
                      {new Date(data.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Detailed Analytics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Impressions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CTR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Conversions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Spend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CPC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CPM
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  analytics.map((data) => (
                    <tr key={data.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(data.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {data.impressions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {data.clicks.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(data.ctr * 100).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {data.conversions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${data.spend.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${data.cpc.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${data.cpm.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
