import { appAlert } from '@/presentation/utils/app-alert';

/** Aviso para acciones del diseño que todavia no tienen backend detras. */
export function showComingSoon(feature: string): void {
  appAlert('Próximamente', `${feature} va a estar disponible muy pronto.`);
}
