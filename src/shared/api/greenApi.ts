import type { Credentials } from "../../features/connection/model/types";

export function apiEndpoint(credentials: Credentials, method: string) {
  const baseUrl = credentials.apiUrl.trim().replace(/\/$/, "");
  return `${baseUrl}/waInstance${encodeURIComponent(credentials.idInstance)}/${method}/${encodeURIComponent(credentials.apiTokenInstance)}`;
}

export function waitForRetry(signal: AbortSignal, delayMs: number) {
  return new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(timeout);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timeout = window.setTimeout(finish, delayMs);
    signal.addEventListener("abort", finish, { once: true });
  });
}
