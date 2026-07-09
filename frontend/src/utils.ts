import { BiomarkerValue, BiomarkerStatusDetails } from './types';

/**
 * Evaluates a biomarker result against reference ranges and returns detailed status and CSS classes.
 * Green ("Normal"): lower_bound <= value <= upper_bound
 * Red ("High"): value > upper_bound
 * Amber/Yellow ("Low"): value < lower_bound
 * Fallback to is_abnormal: Red ("Abnormal") if true, Green ("Normal") if false.
 * Fallback to Neutral gray if neither is available.
 */
export function getBiomarkerStatus(item: BiomarkerValue): BiomarkerStatusDetails {
  const { value, lower_bound, upper_bound, is_abnormal } = item;

  // Check numeric bounds
  if (lower_bound !== null && lower_bound !== undefined && upper_bound !== null && upper_bound !== undefined) {
    if (value < lower_bound) {
      return {
        status: 'Low',
        colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
        textClass: 'text-amber-800 font-semibold',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
      };
    } else if (value > upper_bound) {
      return {
        status: 'High',
        colorClass: 'text-red-700 bg-red-50 border-red-200',
        textClass: 'text-red-800 font-semibold',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-200',
      };
    } else {
      return {
        status: 'Normal',
        colorClass: 'text-teal-700 bg-teal-50 border-teal-200',
        textClass: 'text-teal-800 font-semibold',
        bgClass: 'bg-teal-50',
        borderClass: 'border-teal-200',
      };
    }
  }

  // Fallback to lower_bound only
  if (lower_bound !== null && lower_bound !== undefined) {
    if (value < lower_bound) {
      return {
        status: 'Low',
        colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
        textClass: 'text-amber-800 font-semibold',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
      };
    } else {
      return {
        status: 'Normal',
        colorClass: 'text-teal-700 bg-teal-50 border-teal-200',
        textClass: 'text-teal-800 font-semibold',
        bgClass: 'bg-teal-50',
        borderClass: 'border-teal-200',
      };
    }
  }

  // Fallback to upper_bound only
  if (upper_bound !== null && upper_bound !== undefined) {
    if (value > upper_bound) {
      return {
        status: 'High',
        colorClass: 'text-red-700 bg-red-50 border-red-200',
        textClass: 'text-red-800 font-semibold',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-200',
      };
    } else {
      return {
        status: 'Normal',
        colorClass: 'text-teal-700 bg-teal-50 border-teal-200',
        textClass: 'text-teal-800 font-semibold',
        bgClass: 'bg-teal-50',
        borderClass: 'border-teal-200',
      };
    }
  }

  // Fallback to is_abnormal
  if (is_abnormal !== undefined && is_abnormal !== null) {
    if (is_abnormal) {
      return {
        status: 'Abnormal',
        colorClass: 'text-red-700 bg-red-50 border-red-200',
        textClass: 'text-red-800 font-semibold',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-200',
      };
    } else {
      return {
        status: 'Normal',
        colorClass: 'text-teal-700 bg-teal-50 border-teal-200',
        textClass: 'text-teal-800 font-semibold',
        bgClass: 'bg-teal-50',
        borderClass: 'border-teal-200',
      };
    }
  }

  // Default Neutral
  return {
    status: 'Neutral',
    colorClass: 'text-slate-600 bg-slate-50 border-slate-200',
    textClass: 'text-slate-700 font-semibold',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
  };
}

/**
 * Format date string from YYYY-MM-DD to a more readable format like "Jun 30, 2026"
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats blood values nicely (e.g. 12.5) with their units (e.g. g/dL)
 */
export function formatValue(value: number | null | undefined, unit: string | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value} ${unit || ''}`.trim();
}

/**
 * Formats lower and upper bounds nicely as a reference range.
 */
export function formatReferenceRange(lower: number | null | undefined, upper: number | null | undefined, unit: string | null | undefined): string {
  const u = unit ? ` ${unit}` : '';
  if (lower !== null && lower !== undefined && upper !== null && upper !== undefined) {
    return `${lower} - ${upper}${u}`;
  }
  if (lower !== null && lower !== undefined) {
    return `>= ${lower}${u}`;
  }
  if (upper !== null && upper !== undefined) {
    return `<= ${upper}${u}`;
  }
  return 'No range';
}
