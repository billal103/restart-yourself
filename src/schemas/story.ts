import { z } from 'zod'

export const storySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  content: z.string().min(50, 'Story must be at least 50 characters').max(10000),
  categoryId: z.string().min(1, 'Please select a category'),
  tags: z.array(z.string()).max(5, 'You can add up to 5 tags'),
  contentWarning: z.string().max(200).optional(),
  publishAnonymously: z.boolean(),
  agreeToGuidelines: z.boolean().refine((v) => v, 'You must agree to the Community Guidelines'),
})

export type StoryFormValues = z.infer<typeof storySchema>
