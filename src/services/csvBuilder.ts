// Neutralise spreadsheet formula injection: cells starting with = + - @ (or whitespace before them)
// would be executed by Excel/Sheets. A leading apostrophe forces them to plain text.
const FORMULA = /^\s*[=+\-@]/;

export function safeCell(v: unknown): string {
  if (v === null || v === undefined) return '""';
  let s = String(v);
  if (typeof v !== 'number' && FORMULA.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export const toRow = (cells: unknown[]) => cells.map(safeCell).join(',');

interface Delivery { customer: string; location: string; model: string; colour: string; height_mm: number | null; width_mm: number | null; depth_mm: number | null; inspector: string; site_signoff: string; vertivo_signoff: string; inspection_date: string | null; overall_status: string | null }
interface Section { name: string; items: { id: number; sno: string; name: string; size: string; material: string; required_qty: number | null }[] }
interface Rec { item_id: number; qty_sent: number | null; actual_condition: string; inspection: string | null; remarks: string; photo_url?: string | null }

export function buildCsv(d: Delivery, sections: Section[], records: Rec[]): string {
  const byItem = new Map(records.map((r) => [r.item_id, r]));
  const lines: string[] = [
    toRow(['Customer', d.customer, 'Location', d.location, 'Model', d.model, 'Colour', d.colour]),
    toRow(['Height (mm)', d.height_mm, 'Width (mm)', d.width_mm, 'Depth (mm)', d.depth_mm, 'Inspector', d.inspector]),
    toRow(['Site sign-off', d.site_signoff, 'Vertivo sign-off', d.vertivo_signoff, 'Date', d.inspection_date, 'Overall', d.overall_status]),
    '',
    toRow(['Section', 'S.No', 'Item', 'Size', 'Material', 'Qty required', 'Qty sent', 'Actual size/condition', 'Inspection', 'Remarks', 'Picture attached']),
  ];
  for (const s of sections) {
    for (const i of s.items) {
      const r = byItem.get(i.id);
      lines.push(toRow([s.name, i.sno, i.name, i.size, i.material, i.required_qty, r?.qty_sent, r?.actual_condition, r?.inspection, r?.remarks, r?.photo_url ? 'Yes' : 'No']));
    }
  }
  return '\uFEFF' + lines.join('\r\n');
}
