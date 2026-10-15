import type { Chat, ChatMessage } from "../../../entities/chat/model/types";
import type { Notification } from "../../../entities/chat/model/notification";
import { normalizeRecipient } from "../../../entities/chat/lib/phone";
import type { Credentials } from "../../connection/model/types";
import {
  EMPTY_NOTIFICATION_RETRY_MS,
  NOTIFICATION_ERROR_RETRY_MS,
  NOTIFICATION_RECEIVE_TIMEOUT_SECONDS,
} from "../model/constants";
import { apiEndpoint, waitForRetry } from "../../../shared/api/greenApi";

export type NotificationConsumerHandlers = {
  getChats: () => Chat[];
  updateChatMessages: (
    phone: string,
    chatId: string,
    update: (messages: ChatMessage[]) => ChatMessage[],
    name?: string,
  ) => void;
  onStatusChange: (status: "online" | "offline") => void;
  onError: (message: string) => void;
  getErrorMessage: (error: unknown) => string;
};

async function acknowledgeNotification(
  credentials: Credentials,
  receiptId: number,
  signal: AbortSignal,
) {
  const response = await fetch(
    `${apiEndpoint(credentials, "deleteNotification")}/${receiptId}`,
    { method: "DELETE", signal },
  );
  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Не удалось подтвердить уведомление (${response.status})${details ? `: ${details}` : ""}`,
    );
  }
}

function addNotificationMessage(
  notification: Notification,
  chats: Chat[],
  updateChatMessages: NotificationConsumerHandlers["updateChatMessages"],
) {
  const body = notification.body;
  const senderChat = body?.senderData?.chatId || "";
  const senderPhone = body?.senderData?.senderPhoneNumber
    ? normalizeRecipient(String(body.senderData.senderPhoneNumber))
    : null;
  const matchedChat =
    chats.find(
      (chat) =>
        (chat.chatId && chat.chatId === senderChat) ||
        (senderPhone && chat.phone === senderPhone),
    ) ?? (senderChat ? { phone: `chat-${senderChat}`, chatId: senderChat } : undefined);
  const isMessage =
    body?.typeWebhook === "incomingMessageReceived" ||
    body?.typeWebhook === "outgoingAPIMessageReceived";

  if (isMessage && body?.messageData?.typeMessage === "textMessage") {
    const text = body.messageData.textMessageData?.textMessage;
    const targetPhone =
      matchedChat?.phone || senderPhone || (senderChat ? `chat-${senderChat}` : "");
    const targetChatId = matchedChat?.chatId || senderChat;
    if (text && body.idMessage && targetPhone && targetChatId) {
      updateChatMessages(
        targetPhone,
        targetChatId,
        (current) =>
          current.some((message) => message.id === body.idMessage)
            ? current
            : [
                ...current,
                {
                  id: body.idMessage!,
                  text,
                  direction:
                    body.typeWebhook === "outgoingAPIMessageReceived"
                      ? "outgoing"
                      : "incoming",
                  timestamp: (body.timestamp || Date.now() / 1000) * 1000,
                  status: "sent",
                },
              ],
        body.senderData?.chatName ||
          body.senderData?.senderName ||
          (senderPhone ? `+${senderPhone}` : `Чат ${senderChat}`),
      );
    }
  }

  if (
    body?.typeWebhook === "incomingMessageReceived" &&
    body.messageData?.typeMessage !== "textMessage"
  ) {
    const targetPhone =
      matchedChat?.phone || senderPhone || (senderChat ? `chat-${senderChat}` : "");
    const targetChatId = matchedChat?.chatId || senderChat;
    if (
      body.idMessage &&
      targetPhone &&
      targetChatId &&
      chats.some((chat) => chat.phone === targetPhone)
    ) {
      updateChatMessages(targetPhone, targetChatId, (current) =>
        current.some((message) => message.id === body.idMessage)
          ? current
          : [
              ...current,
              {
                id: body.idMessage!,
                text: "Получено нетекстовое сообщение",
                direction: "incoming",
                timestamp: (body.timestamp || Date.now() / 1000) * 1000,
              },
            ],
      );
    }
  }
}

export async function consumeNotifications(
  credentials: Credentials,
  signal: AbortSignal,
  handlers: NotificationConsumerHandlers,
) {
  while (!signal.aborted) {
    try {
      const response = await fetch(
        `${apiEndpoint(credentials, "receiveNotification")}?receiveTimeout=${NOTIFICATION_RECEIVE_TIMEOUT_SECONDS}`,
        { signal },
      );
      if (!response.ok) {
        throw new Error(`Ошибка получения сообщений (${response.status})`);
      }
      handlers.onStatusChange("online");
      if (response.status === 204) {
        await waitForRetry(signal, EMPTY_NOTIFICATION_RETRY_MS);
        continue;
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        await waitForRetry(signal, EMPTY_NOTIFICATION_RETRY_MS);
        continue;
      }

      let notification: Notification | null;
      try {
        notification = JSON.parse(responseText) as Notification | null;
      } catch {
        handlers.onError(
          "GREEN-API вернул некорректное уведомление; продолжаю получать очередь.",
        );
        notification = null;
      }

      if (!notification) {
        const receiptId = Number(responseText);
        if (Number.isFinite(receiptId) && receiptId > 0) {
          await fetch(apiEndpoint(credentials, `deleteNotification/${receiptId}`), {
            method: "DELETE",
            signal,
          });
        }
        continue;
      }

      addNotificationMessage(
        notification,
        handlers.getChats(),
        handlers.updateChatMessages,
      );
      const receiptId = notification.receiptId ?? (Number(responseText) || undefined);
      if (receiptId !== undefined) {
        await acknowledgeNotification(credentials, receiptId, signal);
      }
    } catch (error) {
      if (signal.aborted) break;
      handlers.onStatusChange("offline");
      handlers.onError(handlers.getErrorMessage(error));
      await waitForRetry(signal, NOTIFICATION_ERROR_RETRY_MS);
    }
  }
}
