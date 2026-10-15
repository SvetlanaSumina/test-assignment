import { SettingsPanel } from "../features/connection/ui/SettingsPanel";
import { WelcomeScreen } from "../features/connection/ui/WelcomeScreen";
import { useMessenger } from "../widgets/messenger/model/useMessenger";
import { MessengerWorkspace } from "../widgets/messenger/ui/MessengerWorkspace";
import { Icon } from "../shared/ui/icon/Icon";
import "./app.css";
import "../shared/ui/form-controls.css";
import "../shared/ui/feedback.css";

export default function App() {
  const messenger = useMessenger();

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="MAX messenger home">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">
            green<span>chat</span>
          </span>
        </a>
        <div className="topbar-center">
          <span className="topbar-dot" /> GREEN-API{" "}
          <span className="topbar-divider">/</span> MAX messenger
        </div>
        <button
          className="icon-button top-settings"
          aria-label="Настройки"
          onClick={() => messenger.setShowSettings((value) => !value)}
        >
          <Icon name="settings" />
        </button>
      </header>

      {!messenger.connected ? (
        <WelcomeScreen
          credentials={messenger.credentials}
          credentialsReady={messenger.credentialsReady}
          onCredentialsChange={messenger.setCredentials}
          onSubmit={messenger.saveConnection}
        />
      ) : (
        <MessengerWorkspace
          chats={messenger.chats}
          messages={messenger.messages}
          activePhone={messenger.activePhone}
          activeChatId={messenger.activeChatId}
          phone={messenger.phone}
          search={messenger.search}
          draft={messenger.draft}
          sending={messenger.sending}
          status={messenger.status}
          messagesEndRef={messenger.messagesEndRef}
          onPhoneChange={messenger.setPhone}
          onSearchChange={messenger.setSearch}
          onDraftChange={messenger.setDraft}
          onStartChat={messenger.startChat}
          onSend={messenger.sendMessage}
          onComposerKeyDown={messenger.onComposerKeyDown}
          onSelectChat={(chat) => {
            messenger.setActivePhone(chat.phone);
            messenger.setActiveChatId(chat.chatId);
            messenger.setError("");
          }}
          onOpenSettings={() => messenger.setShowSettings((value) => !value)}
        />
      )}

      {messenger.error && messenger.connected && (
        <div className="toast-error" role="alert">
          <span>!</span>
          <p>{messenger.error}</p>
          <button onClick={() => messenger.setError("")} aria-label="Закрыть">
            ×
          </button>
        </div>
      )}
      {messenger.showSettings && messenger.connected && (
        <SettingsPanel
          credentials={messenger.credentials}
          onCredentialsChange={messenger.setCredentials}
          onSubmit={messenger.saveConnection}
          onDisconnect={messenger.disconnect}
          onClose={() => messenger.setShowSettings(false)}
        />
      )}
    </main>
  );
}
