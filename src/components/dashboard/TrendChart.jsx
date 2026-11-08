import React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisTick, gridStroke, tooltipStyle } from "@/lib/chartTheme";
import ChartEmpty from "@/components/dashboard/ChartEmpty";

export default function TrendChart({ data, height = 250 }) {
  const hasData = data?.some((item) => item.total > 0);
  if (!hasData) return <ChartEmpty label="No incidents in the selected period." />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: -18, right: 10, top: 6, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={gridStroke} />
        <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="total"
          name="Incidents"
          stroke="hsl(var(--primary))"
          strokeWidth={2.4}
          fill="url(#trendFill)"
          dot={{ r: 3, strokeWidth: 2, fill: "hsl(var(--card))" }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}