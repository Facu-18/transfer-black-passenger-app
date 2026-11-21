import { create } from 'zustand';

/** Mismo contrato que un boton de `Alert.alert`. */
export interface AppDialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AppDialog {
  id: number;
  title: string;
  message?: string;
  buttons: AppDialogButton[];
}

interface AppDialogState {
  /** Dialogos pendientes: se muestran de a uno, en el orden en que se pidieron. */
  queue: AppDialog[];
  show: (dialog: Omit<AppDialog, 'id'>) => void;
  /** Cierra el dialogo visible (el primero de la cola). */
  dismiss: () => void;
}

let nextId = 1;

export const useAppDialogStore = create<AppDialogState>()((set) => ({
  queue: [],
  show: (dialog) => set((state) => ({ queue: [...state.queue, { ...dialog, id: nextId++ }] })),
  dismiss: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
