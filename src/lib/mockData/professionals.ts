import type { Professional, Resource } from '@/types/domain'

export const professionals: Professional[] = [
  {
    id: 'pro-1',
    name: 'Dr. Amara Osei',
    title: 'Licensed Clinical Psychologist',
    specializations: ['Relationship counseling', 'Anxiety', 'Grief'],
    verificationStatus: 'verified',
    bio: 'Fifteen years of experience supporting people through relationship transitions and loss.',
    contactUrl: null,
  },
  {
    id: 'pro-2',
    name: 'Tanvir Rahman',
    title: 'Licensed Marriage & Family Therapist',
    specializations: ['Marriage counseling', 'Co-parenting', 'Family conflict'],
    verificationStatus: 'verified',
    bio: 'Works with couples and families navigating separation and rebuilding communication.',
    contactUrl: null,
  },
  {
    id: 'pro-3',
    name: 'Sofia Mendes',
    title: 'Career Transition Coach',
    specializations: ['Career recovery', 'Job loss', 'Professional confidence'],
    verificationStatus: 'verified',
    bio: 'Helps professionals rebuild direction and confidence after layoffs and career setbacks.',
    contactUrl: null,
  },
  {
    id: 'pro-4',
    name: 'Imran Chowdhury',
    title: 'Financial Counselor',
    specializations: ['Debt recovery', 'Budgeting', 'Financial stress'],
    verificationStatus: 'pending',
    bio: 'Verification documents submitted and currently under review by our moderation team.',
    contactUrl: null,
  },
]

export const resources: Resource[] = [
  {
    id: 'res-1',
    title: 'International Association for Suicide Prevention — Crisis Centers',
    description: 'Directory of crisis centers and hotlines by country.',
    category: 'Crisis Support',
    url: 'https://www.iasp.info/resources/Crisis_Centres/',
    region: 'Global',
  },
  {
    id: 'res-2',
    title: 'Kaan Pete Roi — Emotional Support Helpline',
    description: 'Bangladesh-based emotional support and suicide prevention helpline.',
    category: 'Crisis Support',
    url: 'https://www.facebook.com/kaanpeteroi/',
    region: 'Bangladesh',
  },
  {
    id: 'res-3',
    title: 'National Domestic Violence Hotline',
    description: 'Support for people experiencing domestic violence, available 24/7 in the US.',
    category: 'Safety',
    url: 'https://www.thehotline.org/',
    region: 'United States',
  },
  {
    id: 'res-4',
    title: 'Open University Financial Hardship Guidance',
    description: 'Educational resources for managing academic-related financial stress.',
    category: 'Financial',
    url: 'https://www.open.edu/',
    region: 'Global',
  },
]
