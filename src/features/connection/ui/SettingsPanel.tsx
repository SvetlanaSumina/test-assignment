import type { SubmitEvent } from "react";
import type { Credentials } from "../model/types";
import { Icon } from "../../../shared/ui/icon/Icon";
import "./settings-panel.css";

type SettingsPanelProps = {
  credentials: Credentials;
  onCredentialsChange: (credentials: Credentials) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onDisconnect: () => void;
  onClose: () => void;
};

export function SettingsPanel({
  credentials,
  onCredentialsChange,
  onSubmit,
  onDisconnect,
  onClose,
}: SettingsPanelProps) {
  return (
    <div className="settings-backdrop" onClick={onClose}>
      <section className="settings-panel" onClick={(event) => event.stopPropagation()}>
        <button className="close-settings" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <div className="card-icon">
          <Icon name="settings" size={20} />
        </div>
        <p className="card-kicker">АККАУНТ</p>
        <h2>Настройки подключения</h2>
        <p className="card-description">
          Измените параметры GREEN-API или завершите сессию.
        </p>
        <form className="settings-form" onSubmit={onSubmit}>
          <label className="field-label" htmlFor="settingsUrl">
            API URL
          </label>
          <div className="input-wrap">
            <input
              id="settingsUrl"
              value={credentials.apiUrl}
              onChange={(event) =>
                onCredentialsChange({
                  ...credentials,
                  apiUrl: event.target.value,
                })
              }
            />
          </div>
          <label className="field-label" htmlFor="settingsId">
            ID инстанса
          </label>
          <div className="input-wrap">
            <input
              id="settingsId"
              value={credentials.idInstance}
              onChange={(event) =>
                onCredentialsChange({
                  ...credentials,
                  idInstance: event.target.value,
                })
              }
            />
          </div>
          <label className="field-label" htmlFor="settingsToken">
            Токен API
          </label>
          <div className="input-wrap">
            <input
              id="settingsToken"
              type="password"
              value={credentials.apiTokenInstance}
              onChange={(event) =>
                onCredentialsChange({
                  ...credentials,
                  apiTokenInstance: event.target.value,
                })
              }
            />
          </div>
          <button className="primary-button settings-save" type="submit">
            Сохранить изменения
          </button>
        </form>
        <button className="disconnect-button" onClick={onDisconnect}>
          <Icon name="logout" size={17} /> Отключить аккаунт
        </button>
      </section>
    </div>
  );
}
