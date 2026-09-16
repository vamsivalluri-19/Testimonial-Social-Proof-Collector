const { z } = require('zod');

const embedQuerySchema = z.object({
  type: z.enum(['grid', 'carousel', 'badge']).optional().default('grid'),
  theme: z.enum(['light', 'dark']).optional().default('light'),
  width: z.string().optional().default('100%'),
  height: z.string().optional().default('600px'),
  avatarVisibility: z
    .enum(['true', 'false', 'show', 'hide'])
    .transform((val) => val === 'true' || val === 'show')
    .optional()
    .default(true),
  ratingVisibility: z
    .enum(['true', 'false', 'show', 'hide'])
    .transform((val) => val === 'true' || val === 'show')
    .optional()
    .default(true),
});

const wallQuerySchema = z.object({
  theme: z.enum(['light', 'dark']).optional().default('light'),
  featured: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

module.exports = {
  embedQuerySchema,
  wallQuerySchema,
};
