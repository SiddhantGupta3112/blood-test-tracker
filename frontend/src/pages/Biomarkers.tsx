import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, RefreshCw, Layers, Calendar, Landmark, Info } from 'lucide-react';
import { api } from '../api';
import { BiomarkerHistoryItem } from '../types';
import { formatDate, getBiomarkerStatus, formatReferenceRange } from '../utils';
import BiomarkerChart from '../components/BiomarkerChart';

export default function Biomarkers() {
  const [tests, setTests] = useState<string[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  
  const [history, setHistory] = useState<BiomarkerHistoryItem[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTestList = async () => {
    setLoadingTests(true);
    setError(null);
    try {
      const list = await api.getPlotsTests();
      setTests(list);
      if (list.length > 0) {
        setSelectedTest(list[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch test biomarkers.');
    } finally {
      setLoadingTests(false);
    }
  };

  const fetchBiomarkerHistory = async (testName: string) => {
    if (!testName) return;
    setLoadingHistory(true);
    setError(null);
    try {
      const data = await api.getPlotsHistory(testName);
      setHistory(data.results || []);
    } catch (err: any) {
      setError(err.message || `Failed to fetch history for: ${testName}`);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTestList();
  }, []);

  // Fetch history when selected test shifts
  useEffect(() => {
    if (selectedTest) {
      fetchBiomarkerHistory(selectedTest);
    }
  }, [selectedTest]);

  const handleTestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTest(e.target.value);
  };

  return (
    <div className="space-y-6" id="biomarkers-tab-root">
      <div>
        <h3 className="text-2xl font-bold text-slate-900 leading-tight">Biomarker Trend Analysis</h3>
        <p className="text-base text-slate-500 mt-1">
          Select a clinical indicator to trace its progress across your chronological medical records.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3" id="biomarker-error-banner">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Trend loading problem</p>
            <p className="mt-1">{error}</p>
            <button
              onClick={() => selectedTest ? fetchBiomarkerHistory(selectedTest) : fetchTestList()}
              className="mt-2 text-sm font-bold text-red-700 underline hover:text-red-800"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Biomarker Selector Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4" id="biomarker-selection-panel">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
            <Layers className="h-5.5 w-5.5" />
          </div>
          <div>
            <label htmlFor="test-select" className="text-sm font-bold text-slate-700 block">Biomarker to Analyze</label>
            <span className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Select from clinical record</span>
          </div>
        </div>

        <div className="w-full sm:w-72">
          {loadingTests ? (
            <div className="flex items-center gap-2 justify-end text-sm text-slate-500 py-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading biomarker list...</span>
            </div>
          ) : tests.length === 0 ? (
            <select
              disabled
              className="block w-full min-h-[44px] rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-base text-slate-400 cursor-not-allowed"
              id="test-select"
            >
              <option>No biomarkers recorded yet</option>
            </select>
          ) : (
            <select
              id="test-select"
              className="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 font-semibold focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              value={selectedTest}
              onChange={handleTestChange}
            >
              {tests.map((testName) => (
                <option key={testName} value={testName}>
                  {testName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Empty state when no tests recorded at all */}
      {!loadingTests && tests.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 py-16 text-center" id="biomarkers-empty-state">
          <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-slate-800">No Trends Available</h4>
          <p className="mt-2 text-slate-500 max-w-sm mx-auto text-base">
            You haven't logged any report biomarkers yet. Once you scan a PDF or enter home readings manually, your biomarkers will appear here.
          </p>
        </div>
      )}

      {/* Primary trend visualizers */}
      {selectedTest && (
        <div className="space-y-6" id="trend-visualization-content">
          {/* Chart Display */}
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200 space-y-4 shadow-sm" id="trend-chart-loader">
              <RefreshCw className="h-8 w-8 text-teal-700 animate-spin" />
              <p className="text-base text-slate-500 font-semibold">Pulling trend data points...</p>
            </div>
          ) : (
            <BiomarkerChart data={history} testName={selectedTest} />
          )}

          {/* Historical Data Companion Table */}
          {!loadingHistory && history.length > 0 && (
            <div className="space-y-3" id="trend-table-block">
              <h4 className="text-lg font-bold text-slate-900 px-1">Historical Table Readings</h4>
              
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm" id="trend-table-wrapper">
                <table className="w-full text-left border-collapse" id="trend-history-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-6">Collection Date</th>
                      <th className="py-3.5 px-6 text-right">Value</th>
                      <th className="py-3.5 px-6">Unit</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                      <th className="py-3.5 px-6">Reference Range</th>
                      <th className="py-3.5 px-6">Laboratory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-base text-slate-700">
                    {/* Sort chronological desc (most recent first) for tabular reading */}
                    {[...history]
                      .sort((a, b) => new Date(b.collection_date).getTime() - new Date(a.collection_date).getTime())
                      .map((row, idx) => {
                        const statusDetails = getBiomarkerStatus({
                          test_name: selectedTest,
                          value: row.value,
                          lower_bound: row.lower_bound,
                          upper_bound: row.upper_bound,
                          is_abnormal: row.is_abnormal,
                          unit: row.unit,
                        });
                        return (
                          <tr key={`${row.collection_date}-${idx}`} className="hover:bg-slate-50/45 transition-colors" id={`trend-row-${idx}`}>
                            <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span>{formatDate(row.collection_date)}</span>
                            </td>
                            <td className="py-3.5 px-6 text-right font-bold text-slate-900 tabular-nums">
                              {row.value}
                            </td>
                            <td className="py-3.5 px-6 font-medium text-slate-500">
                              {row.unit || '—'}
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${statusDetails.colorClass}`}>
                                {statusDetails.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-sm font-semibold text-slate-500 tabular-nums">
                              {formatReferenceRange(row.lower_bound, row.upper_bound, row.unit)}
                            </td>
                            <td className="py-3.5 px-6 text-sm font-semibold text-slate-600 truncate max-w-[160px] flex items-center gap-2 mt-1">
                              <Landmark className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{row.lab_name || 'N/A'}</span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
