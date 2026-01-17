// Environment variable validation using Zod
// This ensures all required env vars are present and correctly formatted

import { z } from 'zod';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const envSchema = z.object({
	PUBLIC_SUPABASE_URL: z
		.string({ message: 'PUBLIC_SUPABASE_URL is required' })
		.url('PUBLIC_SUPABASE_URL must be a valid URL')
		.refine(
			(url) => url.includes('supabase.co') || url.includes('localhost'),
			'PUBLIC_SUPABASE_URL must be a Supabase URL'
		),
	PUBLIC_SUPABASE_ANON_KEY: z
		.string({ message: 'PUBLIC_SUPABASE_ANON_KEY is required' })
		.min(20, 'PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)')
		.regex(
			/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/,
			'PUBLIC_SUPABASE_ANON_KEY must be a valid JWT'
		)
});

// Parse and validate - throws ZodError if invalid
const parsed = envSchema.safeParse({
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY
});

if (!parsed.success) {
	const formatted = parsed.error.format();
	console.error('Invalid environment variables:');
	console.error(JSON.stringify(formatted, null, 2));
	throw new Error('Invalid environment variables. Check console for details.');
}

export const env = parsed.data;

// Type export for use elsewhere
export type Env = z.infer<typeof envSchema>;
