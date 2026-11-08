import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisTick, gridStroke, tooltipStyle } from "@/lib/chartTheme";
import ChartEmpty from "@/components/dashboard/ChartEmpty";

export default function CategoryBars({ data }) {
  if (!data?.length) return <ChartEmpty label="No incidents recorded for this selection." />;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 18, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={gridStroke} />
        <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={116}
          tick={axisTick}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={15}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}