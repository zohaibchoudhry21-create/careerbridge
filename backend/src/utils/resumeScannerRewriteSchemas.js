import { z } from 'zod';

const contactSchema = z.object({
  address: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().default(''),
});

const sectionEntrySchema = z
  .object({
    title: z.string().optional().default(''),
    company: z.string().optional().default(''),
    duration: z.string().optional().default(''),
    bullets: z.array(z.string()).optional().default([]),
    name: z.string().optional().default(''),
    description: z.string().optional().default(''),
    technologies: z.array(z.string()).optional().default([]),
    degree: z.string().optional().default(''),
    institution: z.string().optional().default(''),
  })
  .passthrough();

const rewrittenSectionSchema = z
  .object({
    id: z.string().optional().default(''),
    type: z.string().min(1),
    heading: z.string().default(''),
    text: z.string().optional().default(''),
    items: z.array(z.string()).optional().default([]),
    paragraphs: z.array(z.string()).optional().default([]),
    entries: z.array(sectionEntrySchema).optional().default([]),
  })
  .passthrough();

/**
 * Dynamic rewrite output: identity + ordered sections (not a fixed section template).
 * Also accepts legacy flat shape for backward compatibility during rollout.
 */
export const resumeRewriteOutputSchema = z
  .object({
    name: z.string().default(''),
    contact: contactSchema.default({}),
    sections: z.array(rewrittenSectionSchema).optional(),
    // Legacy flat fields (optional fallback)
    summary: z.string().optional(),
    workExperience: z.array(z.any()).optional(),
    education: z.array(z.any()).optional(),
    skills: z.array(z.string()).optional(),
    projects: z.array(z.any()).optional(),
    certifications: z.array(z.string()).optional(),
    achievements: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    rewriteNotes: z.array(z.string()).default([]),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    const hasSections = Array.isArray(value.sections) && value.sections.length > 0;
    const hasLegacy =
      Boolean(value.summary) ||
      (Array.isArray(value.workExperience) && value.workExperience.length > 0) ||
      (Array.isArray(value.skills) && value.skills.length > 0);
    if (!hasSections && !hasLegacy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rewrite output must include sections[] or legacy structured fields',
      });
    }
  });

export const parseResumeRewriteOutput = (payload) => resumeRewriteOutputSchema.parse(payload);
