import { BriefcaseBusiness, Building2, KeyRound, ShieldCheck } from 'lucide-react-native';
import { View } from 'react-native';

import type { CorporateMembership } from '@/infrastructure/interfaces/corporate';
import { Skeleton } from '@/presentation/components/Skeleton';
import { Typography } from '@/presentation/components/Typography';
import { VIPButton } from '@/presentation/components/VIPButton';
import { VIPTextInput } from '@/presentation/components/VIPTextInput';
import { colors } from '@/presentation/theme/colors';

interface CorporateMembershipSectionProps {
  membership: CorporateMembership | null;
  joinCode: string;
  validationError: string | null;
  loadError: string | null;
  joinError: string | null;
  isLoading: boolean;
  isJoining: boolean;
  onJoinCodeChange: (value: string) => void;
  onJoin: () => void;
  onRetry: () => void;
}

const ROLE_LABELS: Record<CorporateMembership['role'], string> = {
  employee: 'Empleado',
  manager: 'Responsable',
};

const STATUS_LABELS: Record<CorporateMembership['status'], string> = {
  active: 'Vínculo activo',
  revoked: 'Vínculo revocado',
};

export function CorporateMembershipSection({
  membership,
  joinCode,
  validationError,
  loadError,
  joinError,
  isLoading,
  isJoining,
  onJoinCodeChange,
  onJoin,
  onRetry,
}: CorporateMembershipSectionProps) {
  return (
    <View className="gap-4 rounded-3xl border border-charcoal bg-surface/90 p-5">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-gold/10">
          <BriefcaseBusiness size={21} color={colors.gold} />
        </View>
        <View className="flex-1 gap-1">
          <Typography variant="h3">Cuenta empresarial</Typography>
          <Typography variant="caption" tone="secondary">
            Vincula tu perfil para acceder a beneficios de tu empresa.
          </Typography>
        </View>
      </View>

      {isLoading ? (
        <View className="gap-3" accessibilityLabel="Cargando vínculo empresarial">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-5 w-2/3" />
        </View>
      ) : loadError ? (
        <View className="gap-3">
          <Typography tone="danger" accessibilityLiveRegion="polite">
            {loadError}
          </Typography>
          <VIPButton title="Reintentar" onPress={onRetry} />
        </View>
      ) : membership ? (
        <View
          className="gap-4 rounded-2xl border border-gold/30 bg-gold/5 p-4"
          accessibilityLiveRegion="polite"
        >
          <View className="flex-row items-center gap-3">
            <Building2 size={22} color={colors.gold} />
            <View className="flex-1 gap-0.5">
              <Typography variant="bodyLarge" weight="bold" numberOfLines={2}>
                {membership.company.tradeName ?? membership.company.legalName}
              </Typography>
              {membership.company.tradeName ? (
                <Typography variant="caption" tone="secondary" numberOfLines={2}>
                  {membership.company.legalName}
                </Typography>
              ) : null}
            </View>
          </View>
          <View className="flex-row items-center gap-2 border-t border-charcoal pt-3">
            <ShieldCheck size={16} color={colors.gold} />
            <Typography variant="caption" weight="semibold" tone="accent">
              {STATUS_LABELS[membership.status]}
            </Typography>
            <Typography variant="caption" tone="secondary">·</Typography>
            <Typography variant="caption" tone="secondary">
              {ROLE_LABELS[membership.role]}
            </Typography>
          </View>
        </View>
      ) : (
        <View className="gap-4">
          <Typography tone="secondary">
            Ingresa el código que te compartió tu empresa. No se guardará en este dispositivo.
          </Typography>
          <VIPTextInput
            label="Código empresarial"
            icon={KeyRound}
            value={joinCode}
            placeholder="TB-XXXX-XXXX-XXXXX"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={18}
            editable={!isJoining}
            error={validationError ?? undefined}
            accessibilityHint={validationError ?? 'Formato esperado: TB, cuatro caracteres, cuatro caracteres y cinco caracteres.'}
            onChangeText={onJoinCodeChange}
            onSubmitEditing={onJoin}
            returnKeyType="done"
          />
          {joinError ? (
            <Typography tone="danger" className="text-center" accessibilityLiveRegion="polite">
              {joinError}
            </Typography>
          ) : null}
          <VIPButton title="Vincular empresa" loading={isJoining} onPress={onJoin} />
        </View>
      )}
    </View>
  );
}
