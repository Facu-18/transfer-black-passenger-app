import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  /** Para pantallas con formulario: desplaza el contenido y lo aparta del teclado. */
  scrollable?: boolean;
  contentClassName?: string;
}

/** Contenedor de pantalla: fondo obsidian y márgenes seguros (notch, barra de gestos). */
export function Screen({ children, scrollable = false, contentClassName = '' }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const safeArea = { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 };

  if (!scrollable) {
    return (
      <View className={`flex-1 bg-obsidian px-6 ${contentClassName}`} style={safeArea}>
        {children}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-obsidian" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1"
        contentContainerClassName={`grow px-6 ${contentClassName}`}
        contentContainerStyle={safeArea}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
