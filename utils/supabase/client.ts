import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Support multiple environment variable names for the API key
const supabaseKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY;

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  // Return cached client if already created in this session
  if (cachedClient) {
    return cachedClient;
  }

  if (!supabaseUrl) {
    console.error(
      'NEXT_PUBLIC_SUPABASE_URL is not set. Please configure Supabase environment variables.'
    );
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not set. Please configure Supabase environment variables.'
    );
  }
  if (!supabaseKey) {
    console.error(
      'Supabase API key is not set. Please configure NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.'
    );
    throw new Error(
      'Supabase API key is not set. Please configure NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.'
    );
  }
  
  try {
    cachedClient = createBrowserClient(supabaseUrl, supabaseKey);
    return cachedClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
};