import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts';
import { BiomarkerHistoryItem } from '../types';
import { getBiomarkerStatus, formatDate } from '../utils';

interface BiomarkerChartProps {
  data: BiomarkerHistoryItem[];
  testName: string;
}

export default function BiomarkerChart({ data, testName }: BiomarkerChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
        No history available for this biomarker.
      </div>
    );
  }

  // Sort chronological (oldest first) for line drawing
  const sortedData = [...data].sort((a, b) => {
    return new Date(a.collection_date).getTime() - new Date(b.collection_date).getTime();
  });

  // Get bounds for the shaded band. Use values from the most recent test to keep it standard.
  const latestItem = sortedData[sortedData.length - 1];
  const { lower_bound, upper_bound, unit } = latestItem;

  // Compute nice Y-axis domain padding
  const values = sortedData.map((d) => d.value);
  const minVal = Math.min(...values, lower_bound ?? Infinity);
  const maxVal = Math.max(...values, upper_bound ?? -Infinity);
  const range = maxVal - minVal;
  const padding = range === 0 ? 5 : range * 0.15;
  const yDomain = [
    Math.max(0, Math.floor(minVal - padding)),
    Math.ceil(maxVal + padding),
  ];

  // Custom Dot component to color-code each result point on the trend line
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined) return null;

    const statusDetails = getBiomarkerStatus({
      test_name: testName,
      value: payload.value,
      lower_bound: payload.lower_bound,
      upper_bound: payload.upper_bound,
      is_abnormal: payload.is_abnormal,
      unit: payload.unit,
    });

    let dotColor = '#0F6E6E'; // normal teal
    if (statusDetails.status === 'High' || statusDetails.status === 'Abnormal') {
      dotColor = '#E11D48'; // high red
    } else if (statusDetails.status === 'Low') {
      dotColor = '#D97706'; // low amber
    }

    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={dotColor}
        stroke="#ffffff"
        strokeWidth={2}
        className="filter drop-shadow-sm transition-all duration-150 hover:r-8 cursor-pointer"
        id={`chart-dot-${payload.collection_date}`}
      />
    );
  };

  // Custom accessible Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as BiomarkerHistoryItem;
      const statusDetails = getBiomarkerStatus({
        test_name: testName,
        value: d.value,
        lower_bound: d.lower_bound,
        upper_bound: d.upper_bound,
        is_abnormal: d.is_abnormal,
        unit: d.unit,
      });

      return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-md text-sm" id="chart-tooltip">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-2">
            {formatDate(d.collection_date)}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between items-center gap-6">
              <span className="text-slate-500">Value:</span>
              <span className="font-bold text-slate-900">
                {d.value} {d.unit || unit || ''}
              </span>
            </div>
            <div className="flex justify-between items-center gap-6">
              <span className="text-slate-500">Status:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusDetails.colorClass}`}>
                {statusDetails.status}
              </span>
            </div>
            <div className="flex justify-between items-center gap-6">
              <span className="text-slate-500">Reference Range:</span>
              <span className="text-slate-600 font-medium">
                {d.lower_bound !== null && d.upper_bound !== null
                  ? `${d.lower_bound} - ${d.upper_bound}`
                  : d.lower_bound !== null
                  ? `>= ${d.lower_bound}`
                  : d.upper_bound !== null
                  ? `<= ${d.upper_bound}`
                  : 'N/A'}
              </span>
            </div>
            {d.lab_name && (
              <div className="flex justify-between items-center gap-6 text-xs text-slate-400 pt-1 border-t border-slate-50">
                <span>Lab:</span>
                <span className="truncate max-w-[150px]">{d.lab_name}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-5 shadow-sm" id="biomarker-chart-container">
      <div className="mb-4">
        <h4 className="text-lg font-bold text-slate-900 flex items-center justify-between">
          <span>{testName} History</span>
          {lower_bound !== null && upper_bound !== null && (
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              Reference Range: {lower_bound} - {upper_bound} {unit || ''}
            </span>
          )}
        </h4>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={sortedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            id="recharts-line-chart"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="collection_date"
              tickFormatter={formatDate}
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              dy={10}
            />
            <YAxis
              domain={yDomain}
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Shaded Reference Area for healthy bounds */}
            {lower_bound !== null &&
              upper_bound !== null &&
              lower_bound !== undefined &&
              upper_bound !== undefined && (
                <ReferenceArea
                  {...({
                    y1: lower_bound,
                    y2: upper_bound,
                    fill: '#0F6E6E',
                    fillOpacity: 0.06,
                    stroke: 'none'
                  } as any)}
                />
              )}

            <Line
              type="monotone"
              dataKey="value"
              stroke="#0F6E6E"
              strokeWidth={2.5}
              dot={<CustomDot />}
              activeDot={{ r: 8, strokeWidth: 1 }}
              isAnimationActive={true}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 items-center justify-center text-xs border-t border-slate-100 pt-4" id="chart-legend">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-teal-600 border border-teal-200"></span>
          <span className="text-slate-600 font-medium">Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-500 border border-amber-200"></span>
          <span className="text-slate-600 font-medium">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-rose-600 border border-rose-200"></span>
          <span className="text-slate-600 font-medium">High / Abnormal</span>
        </div>
        {lower_bound !== null && upper_bound !== null && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="inline-block w-5 h-3 bg-teal-50 border border-teal-100/50"></span>
            <span className="text-slate-500">Shaded Band = Normal Range</span>
          </div>
        )}
      </div>
    </div>
  );
}
