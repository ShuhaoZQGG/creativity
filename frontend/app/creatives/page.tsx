'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreativeCard, type Creative } from '@/components/CreativeCard';
import { CreativeFilters } from '@/components/CreativeFilters';
import {
  Sparkles,
  LayoutDashboard,
  Wand2,
  TestTube,
  BarChart3,
  Settings,
  LogOut,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CreativesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadCreatives();
    }
  }, [user, pagination.page, searchQuery, sortBy, sortOrder]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUser(session.user);
  };

  const loadCreatives = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchQuery,
        sortBy,
        sortOrder,
      });

      const response = await api.get(`/api/creatives?${params}`);
      setCreatives(response.data.creatives);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load creatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
  };

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this creative?')) return;

    try {
      await api.delete(`/api/creatives/${id}`);
      loadCreatives();
    } catch (error) {
      console.error('Failed to delete creative:', error);
    }
  };

  const handleDuplicate = async (id: string) => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate creative:', id);
  };

  const handleDownload = (creative: Creative) => {
    // Download the image
    const link = document.createElement('a');
    link.href = creative.imageUrls[0];
    link.download = `${creative.textVariant.headline.slice(0, 30)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

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
            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
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
            <Button variant="secondary" className="w-full justify-start gap-3" size="lg">
              <ImageIcon className="h-5 w-5" />
              Creatives
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
              <TestTube className="h-5 w-5" />
              A/B Tests
            </Button>
          </Link>
          <Link href="/dashboard">
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
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            size="lg"
            onClick={handleLogout}
          >
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
              <h1 className="text-2xl font-bold">Creatives Gallery</h1>
              <p className="text-sm text-muted-foreground">
                Browse and manage all your ad creatives
              </p>
            </div>
            <Link href="/generate">
              <Button size="lg" className="gap-2">
                <Wand2 className="h-5 w-5" />
                Generate New
              </Button>
            </Link>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Filters */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <CreativeFilters
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onClearFilters={handleClearFilters}
              />
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {creatives.length} of {pagination.total} creatives
            </p>
          </div>

          {/* Creatives Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Loading creatives...</p>
              </div>
            </div>
          ) : creatives.length === 0 ? (
            <Card className="border-2">
              <CardContent className="py-16">
                <div className="text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {searchQuery ? 'No creatives found' : 'No creatives yet'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery
                        ? 'Try adjusting your search or filters'
                        : 'Get started by generating your first AI-powered ad creative'}
                    </p>
                    <Link href="/generate">
                      <Button size="lg" className="gap-2">
                        <Wand2 className="h-5 w-5" />
                        Generate Your First Creative
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {creatives.map((creative) => (
                  <CreativeCard
                    key={creative.id}
                    creative={creative}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onDownload={handleDownload}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Card className="border-2">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => goToPage(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Page {pagination.page} of {pagination.totalPages}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => goToPage(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="gap-2"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
