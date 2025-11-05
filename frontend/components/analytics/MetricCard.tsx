'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: LucideIcon;
  sparklineData?: Array<{ value: number }>;
  valuePrefix?: string;
  valueSuffix?: string;
  changeLabel?: string;
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  sparklineData,
  valuePrefix = '',
  valueSuffix = '',
  changeLabel = 'vs previous period',
  loading = false,
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const TrendIcon = getTrendIcon();

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-10 w-10 rounded-lg bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-24 bg-muted rounded mb-2" />
          <div className="h-4 w-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-2 hover:border-primary/50 transition-colors', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Main Value */}
          <div className="text-3xl font-bold">
            {valuePrefix}
            {value}
            {valueSuffix}
          </div>

          {/* Trend Indicator and Sparkline Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Trend */}
            {change !== undefined && (
              <div className="flex items-center gap-2">
                <div className={cn('flex items-center gap-1', getTrendColor())}>
                  <TrendIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {change > 0 ? '+' : ''}
                    {change.toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {changeLabel}
                </span>
              </div>
            )}

            {/* Mini Sparkline */}
            {sparklineData && sparklineData.length > 0 && (
              <div className="flex-shrink-0" style={{ width: 80, height: 24 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={
                        trend === 'up'
                          ? '#10b981'
                          : trend === 'down'
                          ? '#ef4444'
                          : 'hsl(var(--primary))'
                      }
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
