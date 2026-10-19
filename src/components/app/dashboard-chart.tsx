"use client"

import * as React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { DashboardChartPoint } from "@/lib/domain/dashboard"
import { formatMoney, formatAbbreviatedMoney } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export interface DashboardChartProps {
  data: DashboardChartPoint[]
  currency: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    dataKey: string
    payload: DashboardChartPoint
  }>
  currency: string
}

function CustomTooltip({ active, payload, currency }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const point = payload[0].payload

  return (
    <div className="rounded-[10px] border border-border bg-card p-3 shadow-md text-xs">
      <p className="font-semibold text-foreground mb-2 capitalize">{point.fullLabel}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-[#8E9A94] opacity-70" />
            Attendu
          </span>
          <span className="font-medium text-foreground tabular-nums">
            {formatMoney(point.attendu, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-primary" />
            Encaissé
          </span>
          <span className="font-medium text-foreground tabular-nums">
            {formatMoney(point.encaisse, currency)}
          </span>
        </div>
        <div className="pt-1.5 mt-1 border-t border-border flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Taux de recouvrement</span>
          <span className="font-semibold text-foreground tabular-nums">
            {point.recoveryRate} %
          </span>
        </div>
      </div>
    </div>
  )
}

export function DashboardChart({ data, currency }: DashboardChartProps) {
  // If no data points, display empty state
  const hasActivity = data.some((d) => d.attendu > 0 || d.encaisse > 0)

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-2">
        <div>
          <CardTitle className="text-base font-semibold">12 derniers mois</CardTitle>
          <CardDescription className="text-xs">
            Comparatif entre les loyers attendus et les encaissements réels par mois.
          </CardDescription>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-xs bg-[#8E9A94] opacity-70" />
            <span>Attendu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-xs bg-primary" />
            <span>Encaissé</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {!hasActivity ? (
          <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-[10px]">
            Aucune activité enregistrée sur les 12 derniers mois.
          </div>
        ) : (
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                barGap={3}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                  opacity={0.7}
                />
                <XAxis
                  dataKey="label"
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickFormatter={(val: number) => formatAbbreviatedMoney(val, currency)}
                  width={65}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                  content={<CustomTooltip currency={currency} />}
                />
                <Bar
                  dataKey="attendu"
                  name="Attendu"
                  fill="var(--status-a-venir, #8E9A94)"
                  opacity={0.65}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="encaisse"
                  name="Encaissé"
                  fill="var(--primary)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
