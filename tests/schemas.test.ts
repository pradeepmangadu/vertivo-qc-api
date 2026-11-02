import { describe, expect, it } from 'vitest';
import { updateDeliverySchema } from '../src/modules/deliveries/schemas.js';
import { recordSchema } from '../src/modules/records/schemas.js';

describe('input validation', () => {
  it('rejects unknown fields (mass-assignment) on deliveries', () => {
    expect(() => updateDeliverySchema.parse({ version: 1, created_by: 'someone-else' })).toThrow();
  });
  it('requires a version on delivery updates', () => {
    expect(() => updateDeliverySchema.parse({ customer: 'x' })).toThrow();
  });
  it('rejects out-of-range dimensions and bad dates', () => {
    expect(() => updateDeliverySchema.parse({ version: 1, height_mm: -1 })).toThrow();
    expect(() => updateDeliverySchema.parse({ version: 1, inspection_date: '2026-13-45' })).toThrow();
  });
  it('rejects invalid inspection status and over-long remarks', () => {
    const ok = { qty_sent: 1, actual_condition: '', inspection: null, remarks: '' };
    expect(recordSchema.parse(ok)).toBeTruthy();
    expect(() => recordSchema.parse({ ...ok, inspection: 'Hacked' })).toThrow();
    expect(() => recordSchema.parse({ ...ok, remarks: 'x'.repeat(501) })).toThrow();
    expect(() => recordSchema.parse({ ...ok, photo_path: '../../etc' })).toThrow();
  });
});
