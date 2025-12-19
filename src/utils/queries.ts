import { QueryClient } from "@tanstack/react-query";

import { type User } from "@/store/auth.store";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

interface UserProfileResponse {
  status: string;
  data: {
    user: User;
  };
}

// export const useUserProfileQuery = (enabled: boolean = true) => {
//   return useQuery({
//     queryKey: ["user", "profile"],
//     queryFn: async (): Promise<User> => {
//       const response = await apiClient.get<UserProfileResponse>(
//         "/user/profile"
//       );
//       return response.data.data.user;
//     },
//     enabled: enabled && !!useAuthStore.getState().accessToken,
//     staleTime: 1000 * 60 * 10, // 10 minutes
//     retry: 2,
//   });
// };
