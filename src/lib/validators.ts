import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  srcLang: z.string().min(2).max(10),
  tgtLang: z.string().min(2).max(10),
  description: z.string().max(500).optional(),
});

export const updateSegmentSchema = z.object({
  target: z.string(),
  status: z.enum(["draft", "confirmed", "reviewed"]).optional(),
});

export const glossaryTermSchema = z.object({
  source: z.string().min(1).max(500),
  target: z.string().min(1).max(500),
  notes: z.string().max(1000).optional(),
});

export const tmEntrySchema = z.object({
  sourceText: z.string().min(1),
  targetText: z.string().min(1),
  srcLang: z.string().min(2).max(10),
  tgtLang: z.string().min(2).max(10),
});
