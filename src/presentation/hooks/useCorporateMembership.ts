import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getCorporateMembershipAction } from '@/core/actions/get-corporate-membership.action';
import { joinCorporateMembershipAction } from '@/core/actions/join-corporate-membership.action';
import { ApiRequestError } from '@/core/api/api-request-error';
import type { CorporateMembership } from '@/infrastructure/interfaces/corporate';
import { getApiErrorMessage } from '@/presentation/utils/api-error-message';
import { handleExpiredSession } from '@/presentation/utils/expired-session';

const JOIN_CODE_PATTERN =
  /^TB-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{5}$/;

function formatJoinCode(value: string): string {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (compact === '' || compact === 'T') return compact;
  if (!compact.startsWith('TB')) return compact.slice(0, 15);

  const body = compact.slice(2, 15);
  const groups = [body.slice(0, 4), body.slice(4, 8), body.slice(8, 13)].filter(Boolean);
  return body.length > 0 ? `TB-${groups.join('-')}` : 'TB';
}

function describeJoinError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.code === 'INVALID_COMPANY_JOIN_CODE') {
      return 'El código no es válido o ya no está vigente. Verificalo con tu empresa.';
    }
    if (error.code === 'PROFILE_ALREADY_IN_COMPANY') {
      return 'Tu perfil ya está vinculado a otra empresa.';
    }
  }

  return getApiErrorMessage(error, 'No pudimos vincularte con la empresa. Intenta de nuevo.');
}

export function useCorporateMembership() {
  const [membership, setMembership] = useState<CorporateMembership | null>(null);
  const [joinCode, setJoinCodeValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const loadMembership = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      setMembership(await getCorporateMembershipAction());
    } catch (error: unknown) {
      if (error instanceof ApiRequestError && error.status === 401) {
        handleExpiredSession();
        return;
      }
      setLoadError(getApiErrorMessage(error, 'No pudimos cargar tu vínculo empresarial.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMembership();
    }, [loadMembership]),
  );

  const setJoinCode = useCallback((value: string) => {
    setJoinCodeValue(formatJoinCode(value));
    setValidationError(null);
    setJoinError(null);
  }, []);

  const join = useCallback(async () => {
    const normalizedCode = formatJoinCode(joinCode);
    if (!JOIN_CODE_PATTERN.test(normalizedCode)) {
      setValidationError('Ingresa un código con formato TB-XXXX-XXXX-XXXXX.');
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      setMembership(await joinCorporateMembershipAction(normalizedCode));
      setJoinCodeValue('');
    } catch (error: unknown) {
      if (error instanceof ApiRequestError && error.status === 401) {
        handleExpiredSession();
        return;
      }
      setJoinError(describeJoinError(error));
    } finally {
      setIsJoining(false);
    }
  }, [joinCode]);

  return {
    membership,
    joinCode,
    validationError,
    loadError,
    joinError,
    isLoading,
    isJoining,
    setJoinCode,
    join,
    retry: loadMembership,
  };
}
