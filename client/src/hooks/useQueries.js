import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

// --- Questions ---

export const useQuestions = (filters = {}) => {
  return useQuery({
    queryKey: ['questions', filters],
    queryFn: async () => {
      // Clean filters to remove undefined, null, or empty string values
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v != null && v !== '')
      );
      const params = new URLSearchParams(cleanFilters).toString();
      const res = await api.get(`/questions?${params}`);
      return res.data;
    },
    keepPreviousData: true, // Smooth pagination
  });
};

export const useQuestion = (id) => {
  return useQuery({
    queryKey: ['question', id],
    queryFn: async () => {
      const res = await api.get(`/questions/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

// Optimistic Upvote Hook
export const useUpvoteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/questions/${id}/upvote`);
      return { id, data: res.data };
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['question', id] });

      // Snapshot the previous value
      const previousQuestion = queryClient.getQueryData(['question', id]);

      // Optimistically update to the new value
      if (previousQuestion) {
        queryClient.setQueryData(['question', id], {
          ...previousQuestion,
          upvotes: [...(previousQuestion.upvotes || []), 'temp_user_id'], // Fake optimistic upvote
          voteScore: (previousQuestion.voteScore || 0) + 1
        });
      }

      // Return a context object with the snapshotted value
      return { previousQuestion };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, id, context) => {
      if (context?.previousQuestion) {
        queryClient.setQueryData(['question', id], context.previousQuestion);
      }
    },
    // Always refetch after error or success:
    onSettled: (data, error, id) => {
      queryClient.invalidateQueries({ queryKey: ['question', id] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
};

// --- Activity ---

export const useRecentActivity = (limit = 6) => {
  return useQuery({
    queryKey: ['activity', limit],
    queryFn: async () => {
      const res = await api.get(`/activity?limit=${limit}`);
      return res.data.activities || [];
    }
  });
};

// --- Shlokas ---

export const useShlokaStats = () => {
  return useQuery({
    queryKey: ['shlokaStats'],
    queryFn: async () => {
      const res = await api.get('/shlokas/stats');
      return res.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour (stats rarely change)
  });
};

export const usePublicStats = () => {
  return useQuery({
    queryKey: ['publicStats'],
    queryFn: async () => {
      const res = await api.get('/admin/public-stats');
      return res.data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useDailyShloka = () => {
  return useQuery({
    queryKey: ['dailyShloka'],
    queryFn: async () => {
      const res = await api.get('/admin/daily-shloka');
      return res.data;
    },
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    retry: false, // Don't retry if it fails (will use fallback)
  });
};

export const useRandomShlokas = (limit = 4) => {
  return useQuery({
    queryKey: ['randomShlokas', limit],
    queryFn: async () => {
      const res = await api.get(`/shlokas/random?limit=${limit}`);
      return res.data.shlokas || [];
    },
    refetchOnWindowFocus: false, // Don't want the UI shuffling randomly
  });
};
