import { QRCodeSVG } from "qrcode.react";
import { buildSyncDeepLink } from "../../config/sync";

interface SyncSetupQrProps {
  url: string;
  apiKey: string;
  enabled: boolean;
}

export function SyncSetupQr({ url, apiKey, enabled }: SyncSetupQrProps) {
  if (!enabled || !url.trim() || !apiKey.trim()) {
    return null;
  }

  const deepLink = buildSyncDeepLink(url, apiKey);

  return (
    <div className="flex flex-col items-center gap-2 rounded border border-border bg-surface-secondary p-4">
      <QRCodeSVG value={deepLink} size={160} level="M" />
      <p className="text-center text-xs text-text-muted">
        Scan on phone to configure sync
      </p>
      <code className="break-all rounded bg-surface-input px-2 py-1 text-center font-mono text-[10px] text-text-muted">
        {deepLink}
      </code>
    </div>
  );
}
