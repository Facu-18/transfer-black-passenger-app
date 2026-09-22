import { Alert } from 'react-native';

/** Aviso para acciones del diseño que todavia no tienen backend detras. */
export function showComingSoon(feature: string): void {
  Alert.alert('Próximamente', `${feature} va a estar disponible muy pronto.`);
}
