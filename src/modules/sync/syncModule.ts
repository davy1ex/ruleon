import { startSync } from "../../domain/db";
import { useOutlinerStore } from "../../store/outlinerStore";

export async function init(url: string, apiKey: string): Promise<void> {
  await startSync(url, apiKey, (status) =>
    useOutlinerStore.getState().setSyncStatus(status),
  );
}
