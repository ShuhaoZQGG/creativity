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
  winnerCreativeId: string | null;
  createdAt: string;
  variants: ABTestVariant[];
  analytics: AdAnalytics[];
}

interface ABTestVariant {
  id: string;
  creativeId: string;
  metaAdId: string;
  status: string;
}

interface AdAnalytics {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  spend: number;
  cpc: number;
}

interface Creative {
  id: string;
  imageUrls: string[];
  textVariant: {
    headline: string;
    body: string;
  };
}

export default function ABTestingPage() {
  const router = useRouter();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCreatives, setSelectedCreatives] = useState<string[]>([]);
  const [testConfig, setTestConfig] = useState({
    budget: 100,
    objective: 'LINK_CLICKS',
    duration_days: 5,
  });

  useEffect(() => {
    fetchConnectionStatus();
    fetchTests();
    fetchCreatives();
  }, []);

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
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreatives = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/creatives`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCreatives(data.creatives);
    } catch (error) {
      console.error('Error fetching creatives:', error);
    }
  };

  const handleCreateTest = async () => {
    if (selectedCreatives.length < 2) {
      alert('Please select at least 2 creatives for A/B testing');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meta/abtest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          creative_ids: selectedCreatives,
          ...testConfig,
        }),
      });

      if (response.ok) {
        alert('A/B test created successfully!');
        setShowCreateModal(false);
        setSelectedCreatives([]);
        fetchTests();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating test:', error);
      alert('Failed to create A/B test');
    }
  };

  const handleToggleCreative = (creativeId: string) => {
    setSelectedCreatives((prev) =>
      prev.includes(creativeId)
        ? prev.filter((id) => id !== creativeId)
        : [...prev, creativeId]
    );
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
            You need to connect your Meta (Facebook) account to create A/B tests and run ads.
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">A/B Testing</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create New Test
          </button>
        </div>

        {tests.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <p className="text-gray-600 text-lg">No A/B tests yet</p>
            <p className="text-gray-500 mt-2">Create your first test to get started</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {tests.map((test) => (
              <div key={test.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      Test #{test.id.substring(0, 8)}
                    </h3>
                    <p className="text-gray-600">
                      {test.creativeIds.length} variants • {test.objective}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      test.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : test.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {test.status}
                  </span>
                </div>

                {test.analytics && test.analytics.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-600 text-sm">Impressions</p>
                      <p className="text-xl font-semibold">
                        {test.analytics[0].impressions.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-600 text-sm">Clicks</p>
                      <p className="text-xl font-semibold">
                        {test.analytics[0].clicks.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-600 text-sm">CTR</p>
                      <p className="text-xl font-semibold">
                        {(test.analytics[0].ctr * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-600 text-sm">Spend</p>
                      <p className="text-xl font-semibold">
                        ${test.analytics[0].spend.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => router.push(`/ab-testing/${test.id}`)}
                    className="text-blue-600 hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Create A/B Test</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Budget ($)</label>
              <input
                type="number"
                value={testConfig.budget}
                onChange={(e) =>
                  setTestConfig({ ...testConfig, budget: parseFloat(e.target.value) })
                }
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Objective</label>
              <select
                value={testConfig.objective}
                onChange={(e) =>
                  setTestConfig({ ...testConfig, objective: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="LINK_CLICKS">Link Clicks</option>
                <option value="CONVERSIONS">Conversions</option>
                <option value="REACH">Reach</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Duration (days)</label>
              <input
                type="number"
                value={testConfig.duration_days}
                onChange={(e) =>
                  setTestConfig({ ...testConfig, duration_days: parseInt(e.target.value) })
                }
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-4">
                Select Creatives (minimum 2)
              </label>
              <div className="grid grid-cols-2 gap-4">
                {creatives.map((creative) => (
                  <div
                    key={creative.id}
                    onClick={() => handleToggleCreative(creative.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition ${
                      selectedCreatives.includes(creative.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={creative.imageUrls[0]}
                      alt="Creative"
                      className="w-full h-40 object-cover rounded mb-2"
                    />
                    <p className="font-medium text-sm">{creative.textVariant.headline}</p>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                      {creative.textVariant.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCreateTest}
                disabled={selectedCreatives.length < 2}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create Test ({selectedCreatives.length} selected)
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedCreatives([]);
                }}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
