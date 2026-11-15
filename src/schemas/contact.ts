import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Enter a valid email address'),
  topic: z.enum(['general', 'safety', 'privacy', 'moderation', 'partnership']),
  message: z.string().min(10, 'Please provide at least 10 characters').max(2000),
})

export type ContactFormValues = z.infer<typeof contactSchema>
