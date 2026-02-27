'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, Copy, Check, ExternalLink, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

interface ChurchAppQRCardProps {
  url: string;
  /** Logo URL to overlay in the center of the QR code */
  logoUrl?: string | null;
  /** Used as the base filename when downloading (e.g. "grace-church" → "grace-church-app-qr.png") */
  downloadName?: string;
  /**
   * compact: vertical layout — QR centered, info below. Best for narrow columns (e.g. BrandingTab).
   * Default: horizontal — QR left, info right. Best for full-width cards.
   */
  compact?: boolean;
}

export default function ChurchAppQRCard({
  url,
  logoUrl,
  downloadName = 'church',
  compact = false,
}: ChurchAppQRCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Generate the display QR code (medium resolution)
  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 360,
      margin: 2,
      color: { dark: '#143348', light: '#ffffff' },
      errorCorrectionLevel: 'H', // H = up to 30% can be obscured by logo
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [url]);

  // Download high-resolution PNG with logo composited via canvas
  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const size = 512;
      const qrHD = await QRCode.toDataURL(url, {
        width: size,
        margin: 2,
        color: { dark: '#143348', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw QR code
      const qrImg = new Image();
      await new Promise<void>(resolve => {
        qrImg.onload = () => resolve();
        qrImg.src = qrHD;
      });
      ctx.drawImage(qrImg, 0, 0, size, size);

      // Overlay logo if available
      if (logoUrl) {
        try {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            logoImg.onload = () => resolve();
            logoImg.onerror = () => reject(new Error('CORS'));
            logoImg.src = logoUrl;
          });
          const logoSize = size * 0.22;
          const x = (size - logoSize) / 2;
          const y = (size - logoSize) / 2;
          const pad = 12;
          // Dark navy backing square (matches logo dark-background design)
          ctx.fillStyle = '#143348';
          ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2);
          ctx.drawImage(logoImg, x, y, logoSize, logoSize);
        } catch {
          // CORS blocked — download without logo overlay, QR is still valid
        }
      }

      const link = document.createElement('a');
      link.download = `${downloadName.replace(/\s+/g, '-').toLowerCase()}-app-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  }, [url, logoUrl, downloadName]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  if (!qrDataUrl) return null;

  const qrSize = compact ? 160 : 180;
  const logoOverlaySize = Math.round(qrSize * 0.24);

  const QRBlock = (
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="Church app QR code"
          className="rounded-xl border border-card-border"
          style={{ width: qrSize, height: qrSize }}
        />
        {logoUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-lg flex items-center justify-center"
              style={{ width: logoOverlaySize + 8, height: logoOverlaySize + 8, padding: 4, backgroundColor: '#143348' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="btn-secondary flex items-center gap-1.5 text-xs w-full justify-center"
      >
        <Download className="w-3.5 h-3.5" />
        {downloading ? 'Generating…' : 'Download PNG'}
      </button>
    </div>
  );

  const InfoBlock = (
    <div className={compact ? 'w-full' : 'flex-1 min-w-0'}>
      <p className={`text-foreground-muted mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
        Share this link or QR code with your congregation for quick access to your church&apos;s Daily DNA app.
      </p>
      <div className={`bg-background-secondary rounded-lg px-3 py-2 font-mono text-navy break-all mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
        {url}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className={`btn-primary flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'}`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn-secondary flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'}`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open App
        </a>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="card">
        <h3 className="font-semibold text-navy mb-3 flex items-center gap-2 text-sm">
          <QrCode className="w-4 h-4 text-gold" />
          Church App Link
        </h3>
        <div className="flex flex-col items-center gap-4">
          {QRBlock}
          {InfoBlock}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
        <QrCode className="w-5 h-5 text-gold" />
        Church App Link
      </h3>
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        {QRBlock}
        {InfoBlock}
      </div>
    </div>
  );
}
