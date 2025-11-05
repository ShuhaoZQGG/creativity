'use client';

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

export interface LineConfig {
  dataKey: string;
  name: string;
  color: string;
  strokeWidth?: number;
}

export interface LineChartProps {
  data: any[];
  lines: LineConfig[];
  xKey: string;
  height?: number;
  yAxisFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any) => string;
  loading?: boolean;
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
              className="w-3 h-3 rounded-full"
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

export function LineChart({
  data,
  lines,
  xKey,
  height = 300,
  yAxisFormatter,
  tooltipFormatter,
  loading = false,
}: LineChartProps) {
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
      <RechartsLineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
        <Tooltip
          content={<CustomTooltip formatter={tooltipFormatter} />}
          cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1 }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="line"
        />
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={line.strokeWidth || 2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
