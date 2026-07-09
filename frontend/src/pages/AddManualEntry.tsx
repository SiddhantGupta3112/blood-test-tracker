import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Plus, AlertCircle, CheckCircle, Info, RefreshCw, Calendar, Heart, Trash } from 'lucide-react';
import { api } from '../api';
import { StandaloneEntry } from '../types';

export default function AddManualEntry() {
  const navigate = useNavigate();

  const [fileName, setFileName] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [labName, setLabName] = useState('');
  
  // Dynamic list of biomarker tests
  const [testsList, setTestsList] = useState<Array<{
    testName: string;
    value: string;
    unit: string;
    lowerBound: string;
    upperBound: string;
  }>>([
    { testName: '', value: '', unit: '', lowerBound: '', upperBound: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [testNames, setTestNames] = useState<string[]>([]);

  useEffect(() => {
    const loadTests = async () => {
      try {
        const tests = await api.getKnownTestNames();
        setTestNames(tests.sort());
      } catch {}
    };
    loadTests();
  }, []);

  const addTestRow = () => {
    setTestsList([
      ...testsList,
      { testName: '', value: '', unit: '', lowerBound: '', upperBound: '' }
    ]);
  };

  const removeTestRow = (index: number) => {
    if (testsList.length <= 1) {
      setError('At least one biomarker test is required.');
      return;
    }
    setTestsList(testsList.filter((_, idx) => idx !== index));
  };

  const updateTestRow = (index: number, field: string, val: string) => {
    const updated = [...testsList];
    updated[index] = { ...updated[index], [field]: val };
    setTestsList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Date validation: Cannot be in the future
    if (!collectionDate) {
      setError('Collection date is required.');
      return;
    }

    const selectedDate = new Date(collectionDate);
    const today = new Date();
    // Clear time for date comparison
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setError('Collection date cannot be in the future.');
      return;
    }

    if (testsList.length === 0) {
      setError('At least one biomarker test is required.');
      return;
    }

    // Validate each test row
    for (let i = 0; i < testsList.length; i++) {
      const t = testsList[i];
      if (!t.testName.trim()) {
        setError(`Biomarker Name is required for test #${i + 1}.`);
        return;
      }
      const valNum = parseFloat(t.value);
      if (isNaN(valNum)) {
        setError(`Value must be a valid number for biomarker "${t.testName}".`);
        return;
      }
    }

    // Prepend [Manual] to indicate it doesn't need validation and is auto-verified
    const manualFileName = fileName.trim() ? `[Manual] ${fileName.trim()}` : `[Manual] Log Entry`;

    setLoading(true);
    try {
      const payload: StandaloneEntry = {
        file_name: manualFileName,
        collection_date: collectionDate,
        lab_name: labName.trim() || null,
        biomarkers: testsList.map((t) => ({
          test_name: t.testName.trim(),
          value: parseFloat(t.value),
          unit: t.unit.trim() || null,
          lower_bound: t.lowerBound.trim() ? parseFloat(t.lowerBound) : null,
          upper_bound: t.upperBound.trim() ? parseFloat(t.upperBound) : null,
        }))
      };

      await api.createStandalone(payload);

      setSuccess(true);
      // Reset form fields
      setFileName('');
      setCollectionDate('');
      setLabName('');
      setTestsList([{ testName: '', value: '', unit: '', lowerBound: '', upperBound: '' }]);
      
      // Auto redirect to reports list after 2s
      setTimeout(() => {
        navigate('/reports');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit manual entries.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="add-manual-entry-root">
      <div>
        <h3 className="text-2xl font-bold text-slate-900 leading-tight">Add Standalone Entry</h3>
        <p className="text-base text-slate-500 mt-1">
          Use this form to log manual home logs (like blood pressure, pulse, or glucose monitors) or to record tests where a PDF parser failed.
        </p>
      </div>

      {success && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 flex items-start gap-3" id="manual-success-banner">
          <CheckCircle className="h-5.5 w-5.5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-base text-teal-950">Entry Logged Successfully!</p>
            <p className="mt-1 text-teal-850">The data points have been added and automatically verified. Redirecting you to reports dashboard...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3" id="manual-error-banner">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Submission Issue</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="manual-form-card">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6" id="manual-entry-form">
          
          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-150 pb-6">
            {/* Entry Title / File Name */}
            <div>
              <label htmlFor="fileName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Entry Title / Label <span className="text-red-500">*</span>
              </label>
              <input
                id="fileName"
                type="text"
                required
                disabled={loading}
                placeholder="e.g. Home Blood Pressure or Daily Blood Glucose"
                className="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-55"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
              <span className="text-xs text-slate-400 mt-1 block">Name of this clinical journal or record.</span>
            </div>

            {/* Collection Date */}
            <div>
              <label htmlFor="collectionDate" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Collection Date <span className="text-red-500">*</span>
              </label>
              <input
                id="collectionDate"
                type="date"
                required
                disabled={loading}
                max={new Date().toISOString().split('T')[0]}
                className="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-55"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
              />
              <span className="text-xs text-slate-400 mt-1 block">Cannot be in the future.</span>
            </div>

            {/* Lab Name */}
            <div>
              <label htmlFor="labName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Laboratory Name <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </label>
              <input
                id="labName"
                type="text"
                disabled={loading}
                placeholder="e.g. Labcorp, Home Device, Smart Watch"
                className="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-55"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
              />
              <span className="text-xs text-slate-400 mt-1 block">Origin or device of the measurement.</span>
            </div>
          </div>

          {/* Dynamic Multiple Tests Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Heart className="h-5 w-5 text-teal-700" />
                <span>Biomarker Results & Ranges</span>
              </h4>
              <button
                type="button"
                onClick={addTestRow}
                disabled={loading}
                className="flex min-h-[36px] items-center gap-1 px-3 py-1 bg-teal-50 border border-teal-200 rounded-lg text-sm font-bold text-teal-700 hover:bg-teal-100 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>Add Biomarker</span>
              </button>
            </div>

            <div className="space-y-3">
              {testsList.map((test, index) => (
                <div 
                  key={index} 
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4"
                  id={`manual-test-row-${index}`}
                >
                  {/* Biomarker Name */}
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Biomarker Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={loading}
                      list="manual-test-names-list"
                      placeholder="e.g. Glucose or LDL Cholesterol"
                      className="block w-full min-h-[38px] rounded border border-slate-300 bg-white px-2.5 py-1 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                      value={test.testName}
                      onChange={(e) => updateTestRow(index, 'testName', e.target.value)}
                    />
                  </div>

                  {/* Value */}
                  <div className="w-full md:w-32">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Value <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      disabled={loading}
                      placeholder="e.g. 95.0"
                      className="block w-full min-h-[38px] rounded border border-slate-300 bg-white px-2.5 py-1 text-sm text-slate-900 text-right focus:border-teal-600 focus:outline-none"
                      value={test.value}
                      onChange={(e) => updateTestRow(index, 'value', e.target.value)}
                    />
                  </div>

                  {/* Unit */}
                  <div className="w-full md:w-28">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      disabled={loading}
                      placeholder="mg/dL, %"
                      className="block w-full min-h-[38px] rounded border border-slate-300 bg-white px-2.5 py-1 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                      value={test.unit}
                      onChange={(e) => updateTestRow(index, 'unit', e.target.value)}
                    />
                  </div>

                  {/* Reference Limits */}
                  <div className="w-full md:w-48">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Normal Ref Range
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        disabled={loading}
                        placeholder="Lower"
                        className="block w-full min-h-[38px] rounded border border-slate-300 bg-white px-2.5 py-1 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                        value={test.lowerBound}
                        onChange={(e) => updateTestRow(index, 'lowerBound', e.target.value)}
                      />
                      <span className="text-slate-400 font-bold">-</span>
                      <input
                        type="number"
                        step="any"
                        disabled={loading}
                        placeholder="Upper"
                        className="block w-full min-h-[38px] rounded border border-slate-300 bg-white px-2.5 py-1 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                        value={test.upperBound}
                        onChange={(e) => updateTestRow(index, 'upperBound', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Remove row CTA */}
                  <div className="pt-2 md:pt-4 text-right">
                    <button
                      type="button"
                      onClick={() => removeTestRow(index)}
                      disabled={loading || testsList.length <= 1}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40"
                      title="Remove Biomarker"
                    >
                      <Trash className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-150 flex items-start gap-3 text-sm text-slate-600">
              <Info className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-850">Reference Range & Verification Info</p>
                <p className="mt-0.5 leading-relaxed">
                  Manual entries are <strong className="text-teal-800">automatically verified</strong> and will be immediately plotted onto your biomarker timelines. Adding reference bounds helps color-code abnormal highs/lows.
                </p>
              </div>
            </div>
          </div>

          {/* Form CTAs */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-150 pt-6">
            <button
              type="button"
              onClick={() => navigate('/reports')}
              disabled={loading}
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-55 transition-colors"
              id="cancel-manual-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal-700 px-6 text-base font-bold text-white hover:bg-teal-800 active:bg-teal-900 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
              id="submit-manual-btn"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Submitting Entry...</span>
                </>
              ) : (
                <span>Save Manual Entry</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Autocomplete datalist for manual entry biomarker names */}
      <datalist id="manual-test-names-list">
        {testNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}
