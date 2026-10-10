"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formaterDateCourte } from "@/lib/format";

interface Props {
  serie: { date: string; valeur: number }[];
  libelle: string;
  couleur: string;
}

export function GraphiqueSerie({ serie, libelle, couleur }: Props) {
  const config = {
    valeur: { label: libelle, color: couleur },
  } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <AreaChart data={serie} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          minTickGap={32}
          tickFormatter={(valeur: string) => formaterDateCourte(valeur)}
        />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(valeur) =>
                typeof valeur === "string" ? formaterDateCourte(valeur) : valeur
              }
            />
          }
        />
        <Area
          dataKey="valeur"
          type="monotone"
          stroke="var(--color-valeur)"
          fill="var(--color-valeur)"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
