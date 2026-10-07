import { router } from 'expo-router';
import { TriangleAlert, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Screen } from '@/presentation/components/Screen';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { VIPTextInput } from '@/presentation/components/VIPTextInput';
import { useDeleteAccount } from '@/presentation/hooks/useDeleteAccount';
import { colors } from '@/presentation/theme/colors';

/** "Mi cuenta" → "Eliminar mi cuenta": explica las consecuencias y pide la contraseña para confirmar. */
export function DeleteAccountScreen() {
  const [password, setPassword] = useState('');
  const { submit, isDeleting, errorMessage } = useDeleteAccount();

  const confirmDelete = () => {
    Alert.alert('Eliminar tu cuenta', 'Esta acción no se puede deshacer. ¿Confirmás que querés eliminar tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void submit(password) },
    ]);
  };

  return (
    <Screen scrollable contentClassName="gap-6">
      <View className="items-center gap-3">
        <View className="h-16 w-16 items-center justify-center rounded-full border border-danger/40 bg-danger/10">
          <TriangleAlert size={30} color={colors.danger} />
        </View>
        <Typography variant="h2" className="text-center">
          Eliminar mi cuenta
        </Typography>
      </View>

      <View className="gap-3 rounded-3xl border border-charcoal bg-surface/90 p-5">
        <Typography tone="secondary">
          Se borran tus datos personales (nombre, teléfono, documento, dirección, etc.).
        </Typography>
        <Typography tone="secondary">
          Tus viajes y comprobantes se conservan de forma anonimizada: es una obligación contable y no
          se pueden eliminar del todo.
        </Typography>
        <Typography tone="secondary">
          Esta acción no se puede deshacer. Si tenés un viaje en curso o una reserva próxima, primero
          tenés que resolverla.
        </Typography>
      </View>

      <VIPTextInput
        label="Confirmá tu contraseña"
        icon={Lock}
        placeholder="Tu contraseña actual"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={confirmDelete}
        editable={!isDeleting}
      />

      {errorMessage ? (
        <Typography tone="danger" className="text-center">
          {errorMessage}
        </Typography>
      ) : null}

      <VIPButton
        title="Eliminar mi cuenta"
        loading={isDeleting}
        disabled={password.length === 0}
        onPress={confirmDelete}
      />

      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()} className="items-center">
        <Typography tone="secondary" weight="medium">
          Cancelar
        </Typography>
      </Pressable>
    </Screen>
  );
}
