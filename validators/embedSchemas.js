const { z } = require('zod');

const embedQuerySchema = z.object({
  type: z.enum(['grid', 'carousel', 'badge']).optional().default('grid'),
  theme: z.enum(['light', 'dark']).optional().default('light'),
  width: z.string().optional().default('100%'),
  height: z.string().optional().default('600px'),
  avatarVisibility: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === '') return true;
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === 'show';
    }, z.boolean())
    .default(true),
  ratingVisibility: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === '') return true;
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === 'show';
    }, z.boolean())
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
