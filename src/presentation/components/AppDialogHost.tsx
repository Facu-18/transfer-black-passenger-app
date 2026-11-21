import { Modal, Pressable, View } from 'react-native';

import { Typography } from '@/presentation/components/Typography';
import { useAppDialogStore, type AppDialogButton } from '@/presentation/store/useAppDialogStore';

function buttonTone(button: AppDialogButton): 'accent' | 'secondary' | 'danger' {
  if (button.style === 'destructive') return 'danger';
  if (button.style === 'cancel') return 'secondary';
  return 'accent';
}

/**
 * Dibuja el dialogo pedido con `appAlert`. Va una sola vez en la raiz de la
 * app: muestra el primero de la cola y, al tocar un boton, lo cierra y corre su
 * accion (en ese orden, para que la accion pueda abrir otro dialogo).
 */
export function AppDialogHost() {
  const dialog = useAppDialogStore((state) => state.queue[0] ?? null);
  const dismiss = useAppDialogStore((state) => state.dismiss);

  if (!dialog) return null;

  const press = (button: AppDialogButton) => {
    dismiss();
    button.onPress?.();
  };

  // "Atras" en Android equivale al boton de cancelar, si hay; si no, no cierra
  // (igual que `Alert.alert`, que tampoco se descarta solo).
  const cancelButton = dialog.buttons.find((button) => button.style === 'cancel');
  const stacked = dialog.buttons.length > 2;

  return (
    <Modal
      key={dialog.id}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (cancelButton) press(cancelButton);
      }}
    >
      <View className="flex-1 items-center justify-center bg-obsidian/70 px-6">
        <View
          accessibilityRole="alert"
          className="w-full max-w-sm gap-3 rounded-3xl border border-charcoal bg-surface px-6 pb-3 pt-6"
        >
          <Typography variant="h3">{dialog.title}</Typography>
          {dialog.message ? <Typography tone="secondary">{dialog.message}</Typography> : null}

          <View className={stacked ? 'mt-2 gap-1' : 'mt-2 flex-row flex-wrap justify-end gap-2'}>
            {dialog.buttons.map((button) => (
              <Pressable
                key={button.text}
                accessibilityRole="button"
                onPress={() => press(button)}
                className={`min-h-11 justify-center rounded-full px-4 active:bg-field ${stacked ? 'items-end' : ''}`}
              >
                <Typography weight="semibold" tone={buttonTone(button)}>
                  {button.text}
                </Typography>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
