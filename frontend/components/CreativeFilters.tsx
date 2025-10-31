'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

interface CreativeFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onClearFilters: () => void;
}

export function CreativeFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
  onClearFilters,
}: CreativeFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const toggleSortOrder = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const changeSortBy = (newSortBy: string) => {
    onSortChange(newSortBy, sortOrder);
  };

  const hasActiveFilters = searchQuery !== '';

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by headline, description, or brand..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          <div>
            <label className="text-sm font-medium mb-2 block">Sort By</label>
            <div className="flex gap-2">
              <div className="flex gap-2 flex-1">
                <Button
                  variant={sortBy === 'createdAt' ? 'secondary' : 'outline'}
                  onClick={() => changeSortBy('createdAt')}
                  size="sm"
                  className="flex-1"
                >
                  Date Created
                </Button>
                <Button
                  variant={sortBy === 'score' ? 'secondary' : 'outline'}
                  onClick={() => changeSortBy('score')}
                  size="sm"
                  className="flex-1"
                >
                  Score
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={toggleSortOrder}
                size="sm"
                className="gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
