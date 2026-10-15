import type { Credentials } from "../model/types";
import type { Chat } from "../../../entities/chat/model/types";

export const CREDENTIALS_STORAGE_KEY = "green-max-chat-credentials";
export const CHATS_STORAGE_KEY = "green-max-chat-history";
export const INITIAL_CREDENTIALS: Credentials = {
  apiUrl: "https://api.green-api.com",
  idInstance: "",
  apiTokenInstance: "",
};

export function readSavedCredentials(): Credentials {
  try {
    const saved = sessionStorage.getItem(CREDENTIALS_STORAGE_KEY);
    return saved
      ? {
          ...INITIAL_CREDENTIALS,
          ...(JSON.parse(saved) as Partial<Credentials>),
        }
      : INITIAL_CREDENTIALS;
  } catch {
    return INITIAL_CREDENTIALS;
  }
}

export function saveCredentials(credentials: Credentials) {
  sessionStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials));
}

export function clearSavedCredentials() {
  sessionStorage.removeItem(CREDENTIALS_STORAGE_KEY);
}

export function readSavedChats(): Chat[] {
  try {
    const saved = localStorage.getItem(CHATS_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Chat[]) : [];
  } catch {
    return [];
  }
}

export function persistChats(chats: Chat[]) {
  localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
}
