import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { tooltipStyle } from "@/lib/chartTheme";
import ChartEmpty from "@/components/dashboard/ChartEmpty";

export default function SeverityDonut({ data }) {
  const total = data?.reduce((sum, item) => sum + item.value, 0) || 0;
  if (!total) return <ChartEmpty label="No severity breakdown yet." />;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={3} strokeWidth={0}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-2xl leading-none">{total}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Cases</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {data.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold text-foreground">
              {item.value}
              <span className="ml-1 font-normal text-muted-foreground">
                ({Math.round((item.value / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}