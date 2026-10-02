import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';

import type { Trip } from '@/infrastructure/interfaces/trips';
import { buildReceiptHtml } from '@/presentation/utils/receipt-pdf';

/**
 * Genera el comprobante en PDF y abre la hoja de compartir del sistema, para
 * que el pasajero lo guarde o lo mande por donde quiera.
 */
export function useDownloadReceipt() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async (trip: Trip) => {
    setIsDownloading(true);
    setError(null);

    try {
      const html = buildReceiptHtml(trip);
      const { uri } = await Print.printToFileAsync({ html });

      if (!(await Sharing.isAvailableAsync())) {
        setError('Tu dispositivo no permite compartir archivos.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: `Comprobante ${trip.publicCode}`,
      });
    } catch {
      setError('No pudimos generar el comprobante. Probá de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };

  return { download, isDownloading, error };
}
