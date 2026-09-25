import { router } from 'expo-router';

import { useAuthStore } from '@/presentation/store/useAuthStore';

export function handleIncompleteProfile(): void {
  useAuthStore.getState().markProfileIncomplete();
  router.replace('/complete-profile');
}
