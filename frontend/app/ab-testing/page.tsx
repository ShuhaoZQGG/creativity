'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  Eye,
  Pause,
  Play,
  Trash2,
  TrendingUp,
  Users,
  DollarSign,
  MousePointerClick
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
  const [sandboxMode, setSandboxMode] = useState(false);
  const [metaStatus, setMetaStatus] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCreatives, setSelectedCreatives] = useState<string[]>([]);
  const [testConfig, setTestConfig] = useState({
    budget: 20, // Default $20 for 5 days = $4/day
    objective: 'OUTCOME_TRAFFIC',
    duration_days: 5,
  });

  // Filter and sort state
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'createdAt' as 'createdAt' | 'performance',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConnectionStatus();
    fetchTests();
    fetchCreatives();
  }, []);

  const fetchConnectionStatus = async () => {
    try {
      const response = await api.get('/meta/status');
      setIsConnected(response.data.connected);
      setSandboxMode(response.data.sandbox_mode || false);
      setMetaStatus(response.data);
    } catch (error) {
      console.error('Error fetching connection status:', error);
      setIsConnected(false);
      setSandboxMode(false);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await api.get('/meta/abtests');
      setTests(response.data.tests);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreatives = async () => {
    try {
      const response = await api.get('/creatives');
      setCreatives(response.data.creatives);
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
      const response = await api.post('/meta/abtest', {
        creative_ids: selectedCreatives,
        ...testConfig,
      });

      alert('A/B test created successfully!');
      setShowCreateModal(false);
      setSelectedCreatives([]);
      fetchTests();
    } catch (error: any) {
      console.error('Error creating test:', error);
      alert(`Error: ${error.response?.data?.error || 'Failed to create A/B test'}`);
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
      const response = await api.get('/meta/connect');
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Error connecting Meta account:', error);
    }
  };

  // Filter and sort tests
  const filteredAndSortedTests = tests
    .filter((test) => {
      // Status filter
      if (filters.status !== 'all' && test.status !== filters.status) {
        return false;
      }
      // Search filter (by name or ID)
      if (searchQuery && !test.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !test.id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'createdAt') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        // Sort by performance (CTR)
        const ctrA = a.analytics?.[0]?.ctr || 0;
        const ctrB = b.analytics?.[0]?.ctr || 0;
        return filters.sortOrder === 'desc' ? ctrB - ctrA : ctrA - ctrB;
      }
    });

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

  const handlePauseResume = async (test: ABTest, e: React.MouseEvent) => {
    e.stopPropagation();

    const newStatus = test.status === 'active' ? 'paused' : 'active';
    const action = test.status === 'active' ? 'pause' : 'resume';

    if (!confirm(`Are you sure you want to ${action} this test?`)) {
      return;
    }

    try {
      await api.patch(`/meta/campaigns/${test.metaCampaignId}/status`, {
        status: newStatus === 'active' ? 'ACTIVE' : 'PAUSED'
      });
      await fetchTests();
    } catch (error) {
      console.error(`Error ${action}ing test:`, error);
      alert(`Failed to ${action} test. Please try again.`);
    }
  };

  const handleDelete = async (testId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/meta/abtests/${testId}`);
      await fetchTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Failed to delete test. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="h-10 w-48 bg-muted animate-pulse rounded" />
            <div className="h-10 w-40 bg-muted animate-pulse rounded" />
          </div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-64 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-20 bg-muted rounded" />
                    ))}
                  </div>
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
              You need to connect your Meta (Facebook) account to create A/B tests and run ads.
            </p>
            <Button onClick={connectMetaAccount} size="lg" className="w-full">
              Connect Meta Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">A/B Testing</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your ad creative tests
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create New Test
          </Button>
        </div>

        {/* Sandbox Mode Banner */}
        {sandboxMode && (
          <div className="mb-6 bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-8 w-8 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold text-lg">
                  🧪
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 text-lg mb-1">
                  SANDBOX MODE ACTIVE
                </h3>
                <p className="text-amber-800 text-sm mb-2">
                  You're using a test environment. All ads created will be in sandbox mode - no real ads will be delivered and no money will be charged.
                </p>
                {metaStatus?.sandbox_ad_account_id && (
                  <p className="text-amber-700 text-xs font-mono bg-amber-100 inline-block px-2 py-1 rounded">
                    Sandbox Account: {metaStatus.sandbox_ad_account_id}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        {tests.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => setFilters({ ...filters, sortBy: value as 'createdAt' | 'performance' })}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredAndSortedTests.length === 0 && tests.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No A/B tests yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first test to start optimizing your ad creatives
                  </p>
                  <Button onClick={() => setShowCreateModal(true)} size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : filteredAndSortedTests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No tests match your current filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredAndSortedTests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">
                          {test.name || `Test #${test.id.substring(0, 8)}`}
                        </CardTitle>
                        <Badge variant={getStatusBadgeVariant(test.status)} pulse={test.status === 'active'}>
                          {test.status}
                        </Badge>
                        {test.winnerCreativeId && (
                          <Badge variant="completed">
                            Winner Declared
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        <Users className="h-3 w-3 inline mr-1" />
                        {test.variants?.length || test.creativeIds.length} variants
                        <span className="mx-2">•</span>
                        {test.objective}
                        <span className="mx-2">•</span>
                        Created {new Date(test.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Metrics Grid */}
                  {test.analytics && test.analytics.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-medium">Impressions</p>
                        </div>
                        <p className="text-2xl font-bold">
                          {test.analytics[0].impressions.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-medium">Clicks</p>
                        </div>
                        <p className="text-2xl font-bold">
                          {test.analytics[0].clicks.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-medium">CTR</p>
                        </div>
                        <p className="text-2xl font-bold">
                          {(test.analytics[0].ctr * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-medium">Spend</p>
                        </div>
                        <p className="text-2xl font-bold">
                          ${test.analytics[0].spend.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 p-6 rounded-lg text-center mb-4">
                      <p className="text-sm text-muted-foreground">
                        No analytics data available yet
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="default"
                      onClick={() => router.push(`/ab-testing/${test.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {test.status === 'active' && (
                      <Button variant="outline" onClick={(e) => handlePauseResume(test, e)}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    {test.status === 'paused' && (
                      <Button variant="outline" onClick={(e) => handlePauseResume(test, e)}>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button variant="outline" className="ml-auto" onClick={(e) => handleDelete(test.id, e)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
              <label className="block text-sm font-medium mb-2">Total Budget ($)</label>
              <input
                type="number"
                min="10"
                value={testConfig.budget}
                onChange={(e) =>
                  setTestConfig({ ...testConfig, budget: parseFloat(e.target.value) })
                }
                className="w-full border rounded-lg px-4 py-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum $10 recommended (Meta requires ~$2/day minimum)
              </p>
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
                <option value="OUTCOME_TRAFFIC">Traffic (Link Clicks)</option>
                <option value="OUTCOME_SALES">Sales (Conversions)</option>
                <option value="OUTCOME_LEADS">Leads</option>
                <option value="OUTCOME_ENGAGEMENT">Engagement</option>
                <option value="OUTCOME_AWARENESS">Awareness (Reach)</option>
                <option value="OUTCOME_APP_PROMOTION">App Promotion</option>
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
