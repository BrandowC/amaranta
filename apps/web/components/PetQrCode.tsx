'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * Renders a QR that always points to the pet's public, no-login history page. Since the URL
 * only depends on the pet's permanent id, the same QR stays valid forever — the page behind it
 * is what shows the latest records, not the QR image itself.
 */
export function PetQrCode({ petId, size = 160 }: { petId: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const publicUrl = `${window.location.origin}/public/pets/${petId}`;
    QRCode.toDataURL(publicUrl, { width: size, margin: 1 })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [petId, size]);

  if (!dataUrl) return null;

  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-xl2 bg-white p-4 shadow-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="Código QR del historial médico" width={size} height={size} />
      <p className="max-w-[160px] text-center text-xs text-ink-900/50">
        Escanea para ver el historial médico completo, sin necesidad de iniciar sesión
      </p>
    </div>
  );
}
