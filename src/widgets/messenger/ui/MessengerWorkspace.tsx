import type { KeyboardEvent, RefObject, SubmitEvent } from "react";
import type { Chat, ChatMessage } from "../../../entities/chat/model/types";
import type { ConnectionStatus } from "../../../features/connection/model/types";
import { Icon } from "../../../shared/ui/icon/Icon";
import { formatTime } from "../../../shared/lib/format";
import "./messenger-workspace.css";

type MessengerWorkspaceProps = {
  chats: Chat[];
  messages: ChatMessage[];
  activePhone: string;
  activeChatId: string;
  phone: string;
  search: string;
  draft: string;
  sending: boolean;
  status: ConnectionStatus;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onPhoneChange: (phone: string) => void;
  onSearchChange: (search: string) => void;
  onDraftChange: (draft: string) => void;
  onStartChat: (event: SubmitEvent<HTMLFormElement>) => void;
  onSend: (event?: SubmitEvent<HTMLFormElement>) => void;
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSelectChat: (chat: Chat) => void;
  onOpenSettings: () => void;
};

export function MessengerWorkspace({
  chats,
  messages,
  activePhone,
  activeChatId,
  phone,
  search,
  draft,
  sending,
  status,
  messagesEndRef,
  onPhoneChange,
  onSearchChange,
  onDraftChange,
  onStartChat,
  onSend,
  onComposerKeyDown,
  onSelectChat,
  onOpenSettings,
}: MessengerWorkspaceProps) {
  const chatLabel = activePhone ? `+${activePhone}` : "";
  const filteredChats = chats.filter(
    (chat) =>
      !search ||
      chat.name.toLowerCase().includes(search.toLowerCase()) ||
      chat.phone.includes(search.replace(/\D/g, "")),
  );

  return (
    <section className="messenger">
      <aside className="sidebar">
        <div className="sidebar-heading">
          <div>
            <p className="section-eyebrow">ВАШЕ ПРОСТРАНСТВО</p>
            <h2>
              Сообщения <span className="message-count">{chats.length || ""}</span>
            </h2>
          </div>
          <button
            className="icon-button new-chat-button"
            onClick={() => document.getElementById("phone")?.focus()}
            aria-label="Новый чат"
          >
            <Icon name="plus" />
          </button>
        </div>
        <form className="search-box" onSubmit={(event) => event.preventDefault()}>
          <Icon name="search" size={17} />
          <input
            aria-label="Поиск чатов"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Найти диалог"
          />
        </form>
        <form className="new-chat-form" onSubmit={onStartChat}>
          <label htmlFor="phone">НОВЫЙ ДИАЛОГ</label>
          <div className="new-chat-input">
            <input
              id="phone"
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              placeholder="Номер, например +7 999..."
              inputMode="tel"
            />
            <button type="submit" aria-label="Начать чат">
              <Icon name="arrow" size={17} />
            </button>
          </div>
        </form>
        <div className="chat-list-label">НЕДАВНИЕ</div>
        {chats.length ? (
          filteredChats.map((chat) => (
            <button
              className={`chat-list-item ${chat.phone === activePhone ? "selected" : ""}`}
              key={chat.phone}
              onClick={() => onSelectChat(chat)}
            >
              <span className="avatar">{chat.phone.slice(-2)}</span>
              <span className="chat-list-copy">
                <b>+{chat.phone}</b>
                <span className="chat-preview">
                  {chat.messages.at(-1)?.text || "Новый диалог"}
                </span>
              </span>
              <span className="chat-list-time">
                {chat.messages.length ? formatTime(chat.messages.at(-1)!.timestamp) : ""}
              </span>
            </button>
          ))
        ) : (
          <div className="empty-chats">
            <span className="empty-chat-icon">✳</span>
            <b>Пока тихо</b>
            <span>
              Начните новый диалог,
              <br />и он появится здесь
            </span>
          </div>
        )}
        <div className="sidebar-bottom">
          <div className="connected-account">
            <span className="account-avatar">G</span>
            <span className="connected-account-copy">
              <b>GREEN-API</b>
              <span className="connection-presence">
                <i className={status} />
                {status === "online"
                  ? "Подключено"
                  : status === "connecting"
                    ? "Подключаемся…"
                    : "Нет соединения"}
              </span>
            </span>
            <button
              className="account-menu"
              onClick={onOpenSettings}
              aria-label="Настройки аккаунта"
            >
              <Icon name="settings" size={17} />
            </button>
          </div>
        </div>
      </aside>
      <section className="chat-panel">
        {activePhone ? (
          <>
            <header className="chat-header">
              <div className="chat-person">
                <span className="avatar large-avatar">{activePhone.slice(-2)}</span>
                <span className="chat-person-copy">
                  <b>{chatLabel}</b>
                  <span className="chat-presence">
                    <i className={status} />
                    {status === "online"
                      ? "В сети"
                      : status === "connecting"
                        ? "Подключение к MAX…"
                        : "Ожидаем соединения"}
                  </span>
                </span>
              </div>
              <div className="chat-header-tag">
                <span className="max-mini-logo">M</span> MAX{" "}
                <span className="header-tag-divider" /> GREEN-API
              </div>
            </header>
            <div className="chat-background">
              <div className="date-divider">
                <span>СЕГОДНЯ</span>
              </div>
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <div className="empty-illustration">
                    <span className="empty-illustration-icon">✳</span>
                    <span className="empty-orbit" />
                  </div>
                  <h3>Здесь начинается диалог</h3>
                  <p>
                    Напишите первое сообщение —<br />
                    оно появится в этом чате.
                  </p>
                  <div className="encrypted-note">
                    <span>✦</span> Текстовые сообщения через GREEN-API
                  </div>
                </div>
              ) : (
                <div className="messages">
                  {messages.map((message) => (
                    <article
                      className={`message-row ${message.direction}`}
                      key={message.id}
                    >
                      <div className="message-bubble">
                        {message.text}
                        <div className="message-meta">
                          <time>{formatTime(message.timestamp)}</time>
                          {message.direction === "outgoing" && (
                            <span
                              className={`message-status ${message.status === "sending" ? "pending" : ""}`}
                            >
                              <Icon name="check" size={13} />
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            <form className="composer" onSubmit={onSend}>
              <div className="composer-box">
                <textarea
                  value={draft}
                  onChange={(event) => onDraftChange(event.target.value)}
                  onKeyDown={onComposerKeyDown}
                  placeholder={
                    activeChatId ? "Напишите сообщение..." : "Проверяем номер MAX…"
                  }
                  rows={1}
                  aria-label="Текст сообщения"
                  maxLength={4000}
                />
                <div className="composer-tools">
                  <span className="composer-hint">
                    Enter — отправить <span>·</span> Shift + Enter — новая строка
                  </span>
                  <span className="character-count">{draft.length}/4000</span>
                </div>
              </div>
              <button
                type="submit"
                className="send-button"
                disabled={!draft.trim() || !activeChatId || sending}
                aria-label="Отправить сообщение"
              >
                <Icon name="send" size={19} />
              </button>
            </form>
            <div className="chat-footnote">
              Сообщения отправляются через защищённое соединение GREEN-API
            </div>
          </>
        ) : (
          <div className="no-chat">
            <div className="no-chat-icon">
              <Icon name="sparkle" size={27} />
            </div>
            <h2>Время для хорошего диалога</h2>
            <p>Введите номер телефона слева, чтобы начать переписку в MAX.</p>
            <button
              className="subtle-button"
              onClick={() => document.getElementById("phone")?.focus()}
            >
              Начать новый чат <Icon name="arrow" size={16} />
            </button>
            <span className="no-chat-glow" />
          </div>
        )}
      </section>
    </section>
  );
}
