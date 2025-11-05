'use client';

import React from 'react';
import { BarChart } from './BarChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface VariantData {
  id: string;
  name: string;
  value: number;
  isWinner?: boolean;
  change?: number; // percentage change from best performer
}

export interface ComparisonChartProps {
  variants: VariantData[];
  metric: string;
  metricLabel: string;
  valueFormatter?: (value: number) => string;
  height?: number;
  showPercentageDiff?: boolean;
}

export function ComparisonChart({
  variants,
  metric,
  metricLabel,
  valueFormatter = (v) => v.toLocaleString(),
  height = 400,
  showPercentageDiff = true,
}: ComparisonChartProps) {
  if (!variants || variants.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No variant data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find best performer
  const bestValue = Math.max(...variants.map((v) => v.value));
  const worstValue = Math.min(...variants.map((v) => v.value));

  // Enrich data with percentage difference
  const enrichedVariants = variants.map((variant) => {
    const percentDiff = bestValue > 0 ? ((variant.value - bestValue) / bestValue) * 100 : 0;
    return {
      ...variant,
      change: percentDiff,
      displayValue: variant.value,
    };
  });

  // Sort by value descending
  const sortedVariants = [...enrichedVariants].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-4">
      {/* Bar Chart */}
      <BarChart
        data={sortedVariants}
        bars={[
          {
            dataKey: 'displayValue',
            name: metricLabel,
            color: 'hsl(var(--primary))',
          },
        ]}
        xKey="name"
        layout="vertical"
        height={height}
        tooltipFormatter={valueFormatter}
        highlightKey="isWinner"
        highlightColor="#10b981"
      />

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedVariants.map((variant, index) => (
          <Card
            key={variant.id}
            className={
              variant.isWinner
                ? 'border-green-500 border-2 bg-green-50 dark:bg-green-950'
                : variant.value === worstValue
                ? 'border-red-200 dark:border-red-900'
                : ''
            }
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {variant.name}
                </CardTitle>
                {variant.isWinner && (
                  <Badge variant="active" pulse>
                    Winner
                  </Badge>
                )}
                {index === 0 && !variant.isWinner && (
                  <Badge variant="secondary">Best</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {valueFormatter(variant.value)}
                </div>
                {showPercentageDiff && bestValue > 0 && variant.value !== bestValue && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-muted-foreground">vs best:</span>
                    <span
                      className={
                        variant.change >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {variant.change > 0 ? '+' : ''}
                      {variant.change.toFixed(1)}%
                    </span>
                  </div>
                )}
                {variant.value === bestValue && (
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Top performer
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Best</div>
            <div className="text-lg font-bold">{valueFormatter(bestValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Worst</div>
            <div className="text-lg font-bold">{valueFormatter(worstValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Average</div>
            <div className="text-lg font-bold">
              {valueFormatter(
                variants.reduce((sum, v) => sum + v.value, 0) / variants.length
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Spread</div>
            <div className="text-lg font-bold">
              {((1 - worstValue / bestValue) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
