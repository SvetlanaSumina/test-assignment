import type { Credentials } from "../../connection/model/types";
import type { ChatMessage } from "../../../entities/chat/model/types";
import { mapChatHistory } from "../../../entities/chat/lib/mapHistory";
import { CHAT_HISTORY_LIMIT } from "../model/constants";
import { apiEndpoint } from "../../../shared/api/greenApi";

export async function checkRecipientAccount(
  credentials: Credentials,
  phoneNumber: string,
) {
  const response = await fetch(apiEndpoint(credentials, "checkAccount"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: Number(phoneNumber) }),
  });
  const result = (await response.json().catch(() => ({}))) as {
    exist?: boolean;
    chatId?: string;
    reason?: string;
  };

  if (!response.ok) {
    throw new Error(
      result.reason || `Не удалось проверить MAX-номер (${response.status})`,
    );
  }
  if (!result.exist || !result.chatId) {
    throw new Error("На этом номере не найден аккаунт MAX.");
  }
  return result.chatId;
}

export async function sendTextMessage(
  credentials: Credentials,
  chatId: string,
  text: string,
) {
  const response = await fetch(apiEndpoint(credentials, "sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message: text }),
  });
  const result = (await response.json().catch(() => ({}))) as {
    idMessage?: string;
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(result.message || result.error || `Ошибка API (${response.status})`);
  }
  return result.idMessage;
}

export async function fetchChatHistory(
  credentials: Credentials,
  chatId: string,
  signal?: AbortSignal,
): Promise<ChatMessage[]> {
  const response = await fetch(apiEndpoint(credentials, "getChatHistory"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, count: CHAT_HISTORY_LIMIT }),
    signal,
  });
  const result = (await response.json().catch(() => ({}))) as unknown;

  if (!response.ok) {
    throw new Error(`Не удалось загрузить историю чата (${response.status})`);
  }
  return mapChatHistory(result);
}
