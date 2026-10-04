import { Pencil } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { AuthUser } from '@/infrastructure/interfaces/auth';
import { colors } from '@/presentation/theme/colors';

import { Typography } from './Typography';

const GENDER_LABELS: Record<NonNullable<AuthUser['gender']>, string> = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
  OTRO: 'Otro',
};

const DOCUMENT_TYPE_LABELS: Record<NonNullable<AuthUser['documentType']>, string> = {
  DNI: 'DNI',
  CUIL: 'CUIL',
};

const birthDateFormatter = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

/** `birthDate` llega como `AAAA-MM-DD`; se arma en horario local para no correrse un dia. */
function formatBirthDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year = '', month = '', day = ''] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
  return Number.isNaN(date.getTime()) ? null : birthDateFormatter.format(date);
}

function Row({ label, value, withDivider }: { label: string; value: string | null; withDivider: boolean }) {
  if (!value) return null;

  return (
    <View className={`gap-0.5 ${withDivider ? 'border-t border-charcoal pt-3' : ''}`}>
      <Typography variant="caption" tone="secondary" className="uppercase tracking-widest">
        {label}
      </Typography>
      <Typography weight="semibold">{value}</Typography>
    </View>
  );
}

interface ProfileSummaryCardProps {
  user: AuthUser;
  onEdit: () => void;
}

/** Resumen de solo lectura de los datos del perfil, con un boton para editarlos. */
export function ProfileSummaryCard({ user, onEdit }: ProfileSummaryCardProps) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;
  const document =
    user.documentType && user.documentNumber
      ? `${DOCUMENT_TYPE_LABELS[user.documentType]} ${user.documentNumber}`
      : null;

  return (
    <View className="gap-4 rounded-3xl border border-charcoal bg-surface/90 p-5">
      <View className="flex-row items-center justify-between gap-3">
        <Typography variant="h3">Tus datos</Typography>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Modificar datos"
          hitSlop={8}
          onPress={onEdit}
          className="flex-row items-center gap-1.5 rounded-full border border-charcoal px-3 py-1.5 active:opacity-80"
        >
          <Pencil size={14} color={colors.gold} />
          <Typography variant="caption" weight="semibold" tone="accent">
            Modificar datos
          </Typography>
        </Pressable>
      </View>

      <View className="gap-3">
        <Row label="Nombre" value={fullName} withDivider={false} />
        <Row label="Email" value={user.email} withDivider />
        <Row label="Teléfono" value={user.phone} withDivider />
        <Row label="Fecha de nacimiento" value={user.birthDate ? formatBirthDate(user.birthDate) : null} withDivider />
        <Row label="Género" value={user.gender ? GENDER_LABELS[user.gender] : null} withDivider />
        <Row label="Documento" value={document} withDivider />
        <Row label="Dirección" value={user.address} withDivider />
      </View>
    </View>
  );
}
