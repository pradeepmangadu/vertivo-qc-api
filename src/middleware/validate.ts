import type { ZodTypeAny, z } from 'zod';
/** Parse + validate untrusted input. Throws ZodError → errorHandler → 400. */
export function parse<S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  return schema.parse(data);
}
