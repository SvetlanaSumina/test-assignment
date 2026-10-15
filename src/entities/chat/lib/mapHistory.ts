import type { ChatMessage } from "../model/types";

type HistoryMessage = {
  idMessage?: string;
  timestamp?: number;
  type?: string;
  typeWebhook?: string;
  typeMessage?: string;
  textMessage?: string;
  body?: {
    idMessage?: string;
    timestamp?: number;
    typeWebhook?: string;
    messageData?: {
      typeMessage?: string;
      textMessageData?: { textMessage?: string };
    };
  };
  messageData?: {
    typeMessage?: string;
    textMessageData?: { textMessage?: string };
  };
};

type ChatHistoryResponse = {
  messages?: unknown[];
  chatHistory?: unknown[];
};

export function mapChatHistory(result: unknown): ChatMessage[] {
  const response = result as ChatHistoryResponse;
  const entries = Array.isArray(result)
    ? result
    : (response.messages ?? response.chatHistory ?? []);

  return entries.flatMap((entry): ChatMessage[] => {
    if (!entry || typeof entry !== "object") return [];

    const outer = entry as HistoryMessage;
    const item = outer.body
      ? {
          ...outer.body,
          typeWebhook: outer.body.typeWebhook || outer.typeWebhook,
        }
      : outer;
    const text = item.messageData?.textMessageData?.textMessage ?? item.textMessage;

    if (
      !text ||
      !(
        item.messageData?.typeMessage === "textMessage" ||
        item.typeMessage === "textMessage" ||
        typeof item.textMessage === "string"
      )
    ) {
      return [];
    }

    const timestamp = item.timestamp || Date.now() / 1000;
    const direction =
      item.typeWebhook?.toLowerCase().includes("outgoing") ||
      item.type?.toLowerCase().includes("out")
        ? "outgoing"
        : "incoming";

    return [
      {
        id: item.idMessage || `history-${timestamp}-${text.slice(0, 12)}`,
        text,
        direction,
        timestamp: timestamp * 1000,
        status: "sent",
      },
    ];
  });
}
