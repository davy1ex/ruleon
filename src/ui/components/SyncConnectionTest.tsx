import { useState } from "react";
import { checkSyncServerHealth } from "../../domain/sync/healthCheck";
import { Button } from "../Button";

interface SyncConnectionTestProps {
  url: string;
  apiKey: string;
  enabled: boolean;
}

export function SyncConnectionTest({
  url,
  apiKey,
  enabled,
}: SyncConnectionTestProps) {
  const [status, setStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setStatus(null);
    const result = await checkSyncServerHealth(url, apiKey);
    setStatus({ ok: result.ok, message: result.message });
    setTesting(false);
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        label={testing ? "Testing…" : "Test connection"}
        onClick={() => {
          if (testing || !url.trim() || !apiKey.trim()) {
            return;
          }
          void handleTest();
        }}
        variant="ghost"
      />
      {status ? (
        <p
          className={`text-xs ${
            status.ok ? "text-status-success" : "text-status-error"
          }`}
        >
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
