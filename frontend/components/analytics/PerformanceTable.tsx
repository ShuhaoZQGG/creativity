'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  format?: 'number' | 'currency' | 'percent' | 'date' | 'text';
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface PerformanceTableProps {
  data: any[];
  columns: Column[];
  title?: string;
  pageSize?: number;
  searchable?: boolean;
  exportable?: boolean;
  onExport?: () => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function PerformanceTable({
  data,
  columns,
  title,
  pageSize = 10,
  searchable = true,
  exportable = true,
  onExport,
  loading = false,
  emptyMessage = 'No data available',
}: PerformanceTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Format cell value based on column format
  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'currency':
        return typeof value === 'number' ? `$${value.toFixed(2)}` : value;
      case 'percent':
        return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : value;
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return value;
    }
  };

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === bVal) return 0;

      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  // Filter data
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return sortedData;

    return sortedData.filter((row) =>
      columns.some((col) => {
        const value = row[col.key];
        return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  }, [sortedData, searchQuery, columns]);

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle sort
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return <ChevronsUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  // Get cell color coding
  const getCellColor = (value: any, columnKey: string) => {
    // Example: color code performance metrics
    if (typeof value !== 'number') return '';

    const column = columns.find((c) => c.key === columnKey);
    if (!column) return '';

    // Color code CTR, conversions positively
    if (columnKey.includes('ctr') || columnKey.includes('conversion')) {
      if (value > 0.05) return 'text-green-600 dark:text-green-400 font-medium';
      if (value < 0.02) return 'text-red-600 dark:text-red-400';
    }

    // Color code CPC, spend negatively (lower is better)
    if (columnKey.includes('cpc') || columnKey.includes('cost')) {
      if (value < 1) return 'text-green-600 dark:text-green-400 font-medium';
      if (value > 5) return 'text-red-600 dark:text-red-400';
    }

    return '';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || 'Performance Data'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title || 'Performance Data'}</CardTitle>
          <div className="flex items-center gap-2">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            )}
            {exportable && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-left font-medium text-muted-foreground',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.sortable && 'cursor-pointer hover:text-foreground'
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-4 py-3',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                          getCellColor(row[column.key], column.key)
                        )}
                      >
                        {formatValue(row[column.key], column.format)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredData.length)} of{' '}
              {filteredData.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
