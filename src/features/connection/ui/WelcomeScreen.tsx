import type { SubmitEvent } from "react";
import type { Credentials } from "../model/types";
import { Icon } from "../../../shared/ui/icon/Icon";
import "./welcome-screen.css";

type WelcomeScreenProps = {
  credentials: Credentials;
  credentialsReady: boolean;
  onCredentialsChange: (credentials: Credentials) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

export function WelcomeScreen({
  credentials,
  credentialsReady,
  onCredentialsChange,
  onSubmit,
}: WelcomeScreenProps) {
  return (
    <section className="welcome-wrap">
      <div className="welcome-copy">
        <div className="eyebrow">
          <span className="eyebrow-line" /> ПРОСТОЕ ОБЩЕНИЕ
        </div>
        <h1>
          Ваши диалоги.
          <br />
          <span>На одной волне.</span>
        </h1>
        <p>
          Подключите GREEN-API и отправляйте текстовые сообщения в MAX — прямо из
          браузера.
        </p>
        <div className="feature-pills">
          <span>
            <i className="pill-check">
              <Icon name="check" size={13} />
            </i>{" "}
            Без лишних функций
          </span>
          <span>
            <i className="pill-check">
              <Icon name="check" size={13} />
            </i>{" "}
            В реальном времени
          </span>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-bubble bubble-left">Привет! 👋</div>
          <div className="art-bubble bubble-right">На связи ✨</div>
          <div className="art-center">
            <span className="brand-mark large">
              <span />
              <span />
              <span />
            </span>
          </div>
          <div className="art-spark spark-one">✳</div>
          <div className="art-spark spark-two">✦</div>
        </div>
      </div>
      <form className="connect-card" onSubmit={onSubmit}>
        <div className="card-icon">
          <Icon name="sparkle" size={21} />
        </div>
        <p className="card-kicker">НАЧНЁМ ЗНАКОМСТВО</p>
        <h2>Подключите аккаунт</h2>
        <p className="card-description">Введите данные вашего инстанса GREEN-API</p>
        <label className="field-label" htmlFor="apiUrl">
          API URL
        </label>
        <div className="input-wrap url-input">
          <span className="input-prefix">https://</span>
          <input
            id="apiUrl"
            value={credentials.apiUrl.replace(/^https?:\/\//, "")}
            onChange={(event) =>
              onCredentialsChange({
                ...credentials,
                apiUrl: `https://${event.target.value}`,
              })
            }
            placeholder="api.green-api.com"
            autoComplete="url"
          />
        </div>
        <label className="field-label" htmlFor="instanceId">
          ID инстанса
        </label>
        <div className="input-wrap">
          <input
            id="instanceId"
            value={credentials.idInstance}
            onChange={(event) =>
              onCredentialsChange({
                ...credentials,
                idInstance: event.target.value,
              })
            }
            placeholder="Например, 1101000001"
            autoComplete="username"
          />
        </div>
        <label className="field-label" htmlFor="apiToken">
          Токен API
        </label>
        <div className="input-wrap">
          <input
            id="apiToken"
            type="password"
            value={credentials.apiTokenInstance}
            onChange={(event) =>
              onCredentialsChange({
                ...credentials,
                apiTokenInstance: event.target.value,
              })
            }
            placeholder="Ваш apiTokenInstance"
            autoComplete="current-password"
          />
        </div>
        <button
          className="primary-button connect-button"
          type="submit"
          disabled={!credentialsReady}
        >
          Подключиться <Icon name="arrow" size={18} />
        </button>
        <p className="secure-note">
          <span className="secure-lock">✳</span> Данные хранятся только в сессии вкладки и
          используются для запросов к GREEN-API.
        </p>
      </form>
      <footer className="welcome-footer">
        <span>© 2026 greenchat</span>
        <span className="footer-status">
          <i /> Работает на GREEN-API
        </span>
      </footer>
    </section>
  );
}
