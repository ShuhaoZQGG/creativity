'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from 'recharts';

export interface BarConfig {
  dataKey: string;
  name: string;
  color: string;
}

export interface BarChartProps {
  data: any[];
  bars: BarConfig[];
  xKey: string;
  height?: number;
  layout?: 'horizontal' | 'vertical';
  yAxisFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any) => string;
  loading?: boolean;
  highlightColor?: string; // Color for highlighting winner/best
  highlightKey?: string; // Key to check for highlighting (e.g., 'isWinner')
}

const CustomTooltip = ({
  active,
  payload,
  label,
  formatter,
}: TooltipProps<any, any> & { formatter?: (value: any) => string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function BarChart({
  data,
  bars,
  xKey,
  height = 300,
  layout = 'vertical',
  yAxisFormatter,
  tooltipFormatter,
  loading = false,
  highlightColor,
  highlightKey,
}: BarChartProps) {
  if (loading) {
    return (
      <div
        className="w-full flex items-center justify-center bg-muted/20 rounded-lg animate-pulse"
        style={{ height }}
      >
        <p className="text-muted-foreground">Loading chart...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center bg-muted/20 rounded-lg"
        style={{ height }}
      >
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        {layout === 'vertical' ? (
          <>
            <XAxis
              type="number"
              tick={{ fill: 'currentColor' }}
              className="text-muted-foreground text-xs"
              tickFormatter={yAxisFormatter}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={{ fill: 'currentColor' }}
              className="text-muted-foreground text-xs"
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={{ fill: 'currentColor' }}
              className="text-muted-foreground text-xs"
            />
            <YAxis
              tick={{ fill: 'currentColor' }}
              className="text-muted-foreground text-xs"
              tickFormatter={yAxisFormatter}
            />
          </>
        )}
        <Tooltip
          content={<CustomTooltip formatter={tooltipFormatter} />}
          cursor={{ fill: 'hsl(var(--muted))' }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="rect"
        />
        {bars.map((bar) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.color}
            radius={[4, 4, 0, 0]}
          >
            {highlightKey &&
              data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry[highlightKey] ? (highlightColor || '#10b981') : bar.color}
                />
              ))}
          </Bar>
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
