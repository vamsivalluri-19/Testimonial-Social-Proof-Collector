const { z } = require('zod');

const customAnswerSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const submitTestimonialSchema = z.object({
  clientName: z.string().min(2, 'Client name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  companyRole: z.string().max(100).optional().default(''),
  rating: z.coerce.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  reviewText: z.string().min(5, 'Review text must be at least 5 characters').max(3000),
  avatarUrl: z.string().url('Invalid avatar URL').or(z.string().length(0)).optional().default(''),
  customAnswers: z
    .string()
    .transform((val) => {
      try {
        return typeof val === 'string' ? JSON.parse(val) : val;
      } catch {
        return [];
      }
    })
    .pipe(z.array(customAnswerSchema))
    .or(z.array(customAnswerSchema))
    .optional()
    .default([]),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'archived']),
});

const updateFeaturedSchema = z.object({
  featured: z.boolean(),
});

const updateLikedSchema = z.object({
  liked: z.boolean(),
});

module.exports = {
  submitTestimonialSchema,
  updateStatusSchema,
  updateFeaturedSchema,
  updateLikedSchema,
};
