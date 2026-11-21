import { useAppDialogStore, type AppDialogButton } from '@/presentation/store/useAppDialogStore';

/**
 * Reemplazo de `Alert.alert` con el estilo de la app (oscuro y dorado): el
 * `Alert` nativo de Android es blanco con botones verde agua. Misma firma, asi
 * que se usa igual desde pantallas, hooks y utilidades; lo dibuja
 * `AppDialogHost`, montado una sola vez en la raiz.
 */
export function appAlert(title: string, message?: string, buttons?: AppDialogButton[]): void {
  useAppDialogStore.getState().show({
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'Entendido' }],
  });
}
