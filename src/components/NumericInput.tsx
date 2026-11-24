/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

interface NumericInputProps {
  value: number | null | undefined;
  onValueChange?: (val: number) => void;
  onNullableChange?: (val: number | null) => void;
  allowEmpty?: boolean;
  allowDecimal?: boolean;
  min?: number;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

/**
 * Controlled numeric input that preserves empty/in-progress states during editing,
 * preventing the "clearing deletes back to 0 and typing appends after 0 (05)" issue.
 */
export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onValueChange,
  onNullableChange,
  allowEmpty = false,
  allowDecimal = true,
  min,
  placeholder,
  className = '',
  required = false
}) => {
  const formatProp = (v: number | null | undefined): string => {
    if (v === null || v === undefined || Number.isNaN(v)) return '';
    return String(v);
  };

  const [text, setText] = useState<string>(() => formatProp(value));
  const lastCommittedRef = useRef<number | null>(
    value === null || value === undefined || Number.isNaN(value) ? null : value
  );

  useEffect(() => {
    const normalizedProp =
      value === null || value === undefined || Number.isNaN(value) ? null : value;
    if (normalizedProp !== lastCommittedRef.current) {
      lastCommittedRef.current = normalizedProp;
      setText(formatProp(normalizedProp));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    const pattern = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
    if (raw !== '' && !pattern.test(raw)) {
      return;
    }

    // Prevent stuck leading zero like "05" -> "5" (while preserving "0" and "0.5")
    if (/^0\d+/.test(raw)) {
      raw = raw.replace(/^0+/, '') || '0';
    }

    setText(raw);

    if (raw === '' || raw === '.') {
      if (allowEmpty || onNullableChange) {
        lastCommittedRef.current = null;
        onNullableChange?.(null);
        if (!allowEmpty) {
          lastCommittedRef.current = 0;
          onValueChange?.(0);
        }
      } else {
        lastCommittedRef.current = 0;
        onValueChange?.(0);
      }
      return;
    }

    const parsed = allowDecimal ? parseFloat(raw) : parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      lastCommittedRef.current = parsed;
      onValueChange?.(parsed);
      onNullableChange?.(parsed);
    }
  };

  const handleBlur = () => {
    if (text === '' || text === '.') {
      if (allowEmpty) {
        setText('');
        lastCommittedRef.current = null;
        onNullableChange?.(null);
      } else {
        const fallback = min !== undefined && min > 0 ? min : 0;
        setText(String(fallback));
        lastCommittedRef.current = fallback;
        onValueChange?.(fallback);
        onNullableChange?.(fallback);
      }
      return;
    }

    let parsed = allowDecimal ? parseFloat(text) : parseInt(text, 10);
    if (Number.isNaN(parsed)) {
      const fallback = min !== undefined && min > 0 ? min : 0;
      setText(allowEmpty ? '' : String(fallback));
      lastCommittedRef.current = allowEmpty ? null : fallback;
      if (allowEmpty) {
        onNullableChange?.(null);
      } else {
        onValueChange?.(fallback);
        onNullableChange?.(fallback);
      }
      return;
    }

    if (min !== undefined && parsed < min) {
      parsed = min;
    }

    setText(String(parsed));
    lastCommittedRef.current = parsed;
    onValueChange?.(parsed);
    onNullableChange?.(parsed);
  };

  return (
    <input
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      required={required}
      className={className}
    />
  );
};
