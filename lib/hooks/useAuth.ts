import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: 'buyer' | 'seller' | 'ADMIN';
}

export const useAuth = () => {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async (): Promise<User | null> => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) return null;
      
      return {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.full_name,
        image: session.user.user_metadata?.avatar_url,
        role: session.user.user_metadata?.role,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
