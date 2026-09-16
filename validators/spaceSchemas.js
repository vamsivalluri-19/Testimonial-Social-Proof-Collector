const { z } = require('zod');

const customQuestionSchema = z.object({
  label: z.string().min(1, 'Question label is required'),
  required: z.boolean().optional().default(false),
});

const themeSchema = z.object({
  primaryColor: z.string().optional().default('#6366f1'),
  backgroundColor: z.string().optional().default('#ffffff'),
  textColor: z.string().optional().default('#1f2937'),
  darkMode: z.boolean().optional().default(false),
});

const createSpaceSchema = z.object({
  name: z.string().min(2, 'Space name must be at least 2 characters').max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
  logo: z.string().url('Invalid logo URL').or(z.string().length(0)).optional().default(''),
  prompt: z.string().max(500).optional().default('Would you mind sharing a quick review of your experience with us?'),
  avatarSetting: z.enum(['optional', 'required', 'hidden']).optional().default('optional'),
  ratingSetting: z.enum(['optional', 'required', 'hidden']).optional().default('required'),
  customQuestions: z.array(customQuestionSchema).optional().default([]),
  theme: themeSchema.optional(),
});

const updateSpaceSchema = createSpaceSchema.partial();

module.exports = {
  createSpaceSchema,
  updateSpaceSchema,
};
