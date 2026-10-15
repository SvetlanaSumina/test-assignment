import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, SubmitEvent } from "react";
import type { Chat, ChatMessage } from "../../../entities/chat/model/types";
import { normalizeRecipient } from "../../../entities/chat/lib/phone";
import {
  checkRecipientAccount,
  fetchChatHistory,
  sendTextMessage,
} from "../../../features/chat/api/chatApi";
import { consumeNotifications } from "../../../features/chat/api/notificationConsumer";
import { MAX_MESSAGE_LENGTH } from "../../../features/chat/model/constants";
import {
  clearSavedCredentials,
  persistChats,
  readSavedChats,
  readSavedCredentials,
  saveCredentials,
} from "../../../features/connection/lib/storage";
import type {
  ConnectionStatus,
  Credentials,
} from "../../../features/connection/model/types";
import { getErrorMessage } from "../../../shared/lib/format";

export function useMessenger() {
  const [credentials, setCredentials] = useState<Credentials>(readSavedCredentials);
  const [connected, setConnected] = useState(() => {
    const saved = readSavedCredentials();
    return Boolean(saved.idInstance && saved.apiTokenInstance);
  });
  const [showSettings, setShowSettings] = useState(false);
  const [phone, setPhone] = useState("");
  const [activePhone, setActivePhone] = useState("");
  const [chats, setChats] = useState<Chat[]>(readSavedChats);
  const [activeChatId, setActiveChatId] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("offline");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatsRef = useRef(chats);
  const credentialsReady = Boolean(
    credentials.idInstance.trim() && credentials.apiTokenInstance.trim(),
  );
  const activeChat = chats.find((chat) => chat.phone === activePhone);
  const messages = useMemo(() => activeChat?.messages ?? [], [activeChat?.messages]);

  const updateChatMessages = useCallback(
    (
      phoneNumber: string,
      chatId: string,
      update: (current: ChatMessage[]) => ChatMessage[],
      name?: string,
    ) => {
      setChats((current) => {
        const previous = current.find((chat) => chat.phone === phoneNumber);
        const nextChat: Chat = {
          phone: phoneNumber,
          chatId: chatId || previous?.chatId || "",
          name: previous?.name || name || `+${phoneNumber}`,
          messages: update(previous?.messages ?? []),
        };
        const next = previous
          ? current.map((chat) => (chat.phone === phoneNumber ? nextChat : chat))
          : [...current, nextChat];
        persistChats(next);
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  const saveConnection = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!credentialsReady) return;
    saveCredentials(credentials);
    setConnected(true);
    setStatus("connecting");
    setError("");
    setShowSettings(false);
  };

  const disconnect = () => {
    clearSavedCredentials();
    setConnected(false);
    setStatus("offline");
    setActivePhone("");
    setActiveChatId("");
    setError("");
  };

  const startChat = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = normalizeRecipient(phone);
    if (!digits) {
      setError(
        "Введите российский номер (+7 или 8) либо белорусский (+375 или 80), например +7 999 123-45-67",
      );
      return;
    }
    const existingChat = chats.find((chat) => chat.phone === digits);
    setActivePhone(digits);
    setActiveChatId(existingChat?.chatId || "");
    setPhone("");
    setError("");
    if (existingChat?.chatId) return;
    void checkRecipientAccount(credentials, digits)
      .then((chatId) => {
        setActiveChatId(chatId);
        updateChatMessages(digits, chatId, (current) => current);
      })
      .catch((chatError: unknown) => setError(getErrorMessage(chatError)));
  };

  const sendMessage = async (event?: SubmitEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || !activePhone || !activeChatId || sending) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      setError("Длина сообщения не должна превышать 4000 символов.");
      return;
    }
    setSending(true);
    setError("");
    const optimisticId = `local-${Date.now()}`;
    updateChatMessages(activePhone, activeChatId, (current) => [
      ...current,
      {
        id: optimisticId,
        text,
        direction: "outgoing",
        timestamp: Date.now(),
        status: "sending",
      },
    ]);
    setDraft("");
    try {
      const idMessage = await sendTextMessage(credentials, activeChatId, text);
      updateChatMessages(activePhone, activeChatId, (current) =>
        current.map((message) =>
          message.id === optimisticId
            ? {
                ...message,
                id: idMessage || optimisticId,
                status: "sent",
              }
            : message,
        ),
      );
    } catch (sendError) {
      updateChatMessages(activePhone, activeChatId, (current) =>
        current.filter((message) => message.id !== optimisticId),
      );
      setDraft(text);
      setError(getErrorMessage(sendError));
    } finally {
      setSending(false);
    }
  };

  const pollNotifications = useCallback(
    (signal: AbortSignal) =>
      consumeNotifications(credentials, signal, {
        getChats: () => chatsRef.current,
        updateChatMessages,
        onStatusChange: setStatus,
        onError: setError,
        getErrorMessage,
      }),
    [credentials, updateChatMessages],
  );

  const loadChatHistory = useCallback(
    async (phoneNumber: string, chatId: string, signal?: AbortSignal) => {
      const history = await fetchChatHistory(credentials, chatId, signal);
      if (history.length)
        updateChatMessages(phoneNumber, chatId, (current) => {
          const byId = new Map(current.map((message) => [message.id, message]));
          history.forEach((message) => byId.set(message.id, message));
          return [...byId.values()].sort((a, b) => a.timestamp - b.timestamp);
        });
    },
    [credentials, updateChatMessages],
  );

  useEffect(() => {
    if (!activePhone || !activeChatId) return;
    const controller = new AbortController();
    const startLoading = window.setTimeout(() => {
      void loadChatHistory(activePhone, activeChatId, controller.signal).catch(
        (historyError: unknown) => {
          if (!controller.signal.aborted) setError(getErrorMessage(historyError));
        },
      );
    }, 0);
    return () => {
      window.clearTimeout(startLoading);
      controller.abort();
    };
  }, [activeChatId, activePhone, loadChatHistory]);

  useEffect(() => {
    if (!connected || !credentialsReady) return;
    const controller = new AbortController();
    const startPolling = window.setTimeout(
      () => void pollNotifications(controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(startPolling);
      controller.abort();
    };
  }, [connected, credentialsReady, pollNotifications]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return {
    credentials,
    setCredentials,
    connected,
    showSettings,
    setShowSettings,
    phone,
    setPhone,
    activePhone,
    setActivePhone,
    chats,
    activeChatId,
    setActiveChatId,
    draft,
    setDraft,
    sending,
    status,
    error,
    setError,
    search,
    setSearch,
    credentialsReady,
    messages,
    messagesEndRef,
    saveConnection,
    disconnect,
    startChat,
    sendMessage,
    onComposerKeyDown,
  };
}
