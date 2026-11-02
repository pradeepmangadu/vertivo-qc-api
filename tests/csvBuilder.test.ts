import { describe, expect, it } from 'vitest';
import { buildCsv, safeCell } from '../src/services/csvBuilder.js';

describe('safeCell', () => {
  it('neutralises formula injection', () => {
    for (const bad of ['=HYPERLINK("http://x")', '+1+1', '-2+3', '@SUM(A1)', '  =cmd']) {
      expect(safeCell(bad).startsWith(`"'`)).toBe(true);
    }
  });
  it('escapes quotes and keeps normal text and numbers', () => {
    expect(safeCell('say "hi"')).toBe('"say ""hi"""');
    expect(safeCell(12)).toBe('"12"');
    expect(safeCell(null)).toBe('""');
  });
});

describe('buildCsv', () => {
  it('emits a header, a row per checklist item and a BOM', () => {
    const d = { customer: '=evil()', location: '', model: '', colour: '', height_mm: null, width_mm: null, depth_mm: null, inspector: '', site_signoff: '', vertivo_signoff: '', inspection_date: null, overall_status: null };
    const sections = [{ name: 'Cabin', items: [{ id: 1, sno: '1', name: 'Panel', size: '', material: '', required_qty: null }] }];
    const csv = buildCsv(d, sections, []);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain(`"'=evil()"`);
    expect(csv.split('\r\n')).toHaveLength(6);
  });
});
