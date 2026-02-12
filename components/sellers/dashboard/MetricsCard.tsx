'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  previousValue?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  showSparkline?: boolean;
  sparklineData?: number[];
  description?: string;
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 text-blue-600',
  green: 'bg-green-50 border-green-200 text-green-600',
  red: 'bg-red-50 border-red-200 text-red-600',
  purple: 'bg-purple-50 border-purple-200 text-purple-600',
  orange: 'bg-orange-50 border-orange-200 text-orange-600',
};

const iconBgClasses = {
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  red: 'bg-red-100',
  purple: 'bg-purple-100',
  orange: 'bg-orange-100',
};

export function MetricsCard({
  title,
  value,
  unit = '',
  change,
  previousValue,
  icon,
  trend = 'neutral',
  color = 'blue',
  showSparkline = false,
  sparklineData = [],
  description,
}: MetricsCardProps) {
  const trendUp = trend === 'up';
  const trendDown = trend === 'down';

  return (
    <Card className={cn('overflow-hidden', colorClasses[color])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-slate-700">{title}</CardTitle>
        {icon && (
          <div className={cn('p-2 rounded-lg', iconBgClasses[color])}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{value}</span>
            {unit && <span className="text-sm text-slate-600">{unit}</span>}
          </div>

          {change !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              {trendUp && <ArrowUp className="w-4 h-4 text-green-600" />}
              {trendDown && <ArrowDown className="w-4 h-4 text-red-600" />}
              <span
                className={cn(
                  'font-semibold',
                  trendUp && 'text-green-600',
                  trendDown && 'text-red-600',
                  !trendUp && !trendDown && 'text-slate-600'
                )}
              >
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-slate-600">
                {trendUp ? 'increase' : trendDown ? 'decrease' : 'change'}
              </span>
            </div>
          )}

          {description && <p className="text-xs text-slate-600">{description}</p>}

          {showSparkline && sparklineData.length > 0 && (
            <div className="pt-2">
              <Sparkline data={sparklineData} color={color} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SparklineProps {
  data: number[];
  color: string;
}

function Sparkline({ data, color }: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100 / (data.length - 1);

  const colorMap = {
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    purple: '#a855f7',
    orange: '#f97316',
  };

  const points = data
    .map((value, index) => {
      const y = 30 - ((value - min) / range) * 30;
      const x = width * index;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 40" className="w-full h-8">
      <polyline
        points={points}
        fill="none"
        stroke={colorMap[color as keyof typeof colorMap] || '#3b82f6'}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}