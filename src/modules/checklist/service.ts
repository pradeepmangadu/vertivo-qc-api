import { supabaseAdmin as db } from '../../config/supabase.js';
import { many } from '../../utils/errors.js';

export interface ChecklistItem { id: number; sno: string; name: string; size: string; material: string; required_qty: number | null }
export interface ChecklistSection { id: number; name: string; items: ChecklistItem[] }

let cache: { at: number; data: ChecklistSection[] } | null = null;

/** The checklist template is static reference data: cached for 10 minutes. */
export async function getChecklist(): Promise<ChecklistSection[]> {
  if (cache && Date.now() - cache.at < 600_000) return cache.data;
  const sections = many(await db.from('checklist_sections').select('id, name, sort_order').order('sort_order'));
  const items = many(await db.from('checklist_items').select('id, section_id, sno, name, size, material, required_qty, sort_order').order('sort_order'));
  const data: ChecklistSection[] = sections.map((s: any) => ({
    id: s.id, name: s.name,
    items: items.filter((i: any) => i.section_id === s.id)
      .map((i: any) => ({ id: i.id, sno: i.sno, name: i.name, size: i.size, material: i.material, required_qty: i.required_qty })),
  }));
  cache = { at: Date.now(), data };
  return data;
}
