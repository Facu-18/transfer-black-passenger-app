import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';

import type { Trip } from '@/infrastructure/interfaces/trips';
import { buildReceiptFileName, buildReceiptHtml } from '@/presentation/utils/receipt-pdf';

/**
 * `printToFileAsync` guarda el PDF con un nombre al azar (un UUID), que es el
 * que ve el pasajero al compartirlo. Se copia con un nombre legible; si la
 * copia falla, se comparte el original igual.
 */
async function withReadableName(uri: string, fileName: string): Promise<string> {
  try {
    const target = new File(Paths.cache, fileName);
    if (target.exists) target.delete();
    await new File(uri).copy(target);
    return target.uri;
  } catch {
    return uri;
  }
}

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

      const shareUri = await withReadableName(uri, buildReceiptFileName(trip));

      await Sharing.shareAsync(shareUri, {
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
