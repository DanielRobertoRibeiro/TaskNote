import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Settings2, Sparkles } from "lucide-react";

import { getApiUrl, login, register, setApiUrl } from "../lib/api";
import { demoUser } from "../lib/demo-store";
import type { Session } from "../types";
import { Brand } from "./Brand";

interface AuthScreenProps {
  onAuthenticated: (session: Session) => void;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiUrl, setApiUrlValue] = useState(getApiUrl());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    setApiUrl(apiUrl);
    try {
      const result = isRegister
        ? await register(name, email, password)
        : await login(email, password);
      onAuthenticated({ mode: "api", token: result.access_token, user: result.user });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível autenticar.");
    } finally {
      setLoading(false);
    }
  };

  const enterDemo = () => {
    onAuthenticated({ mode: "demo", user: demoUser });
  };

  return (
    <main className="auth-layout">
      <section className="auth-showcase">
        <div className="auth-showcase-inner">
          <Brand />
          <div className="auth-message">
            <span className="eyebrow eyebrow-light">
              <Sparkles size={14} /> Produtividade com clareza
            </span>
            <h1>Transforme planos em progresso.</h1>
            <p>
              Tarefas, notas e ideias conectadas em um espaço simples para você focar no que
              realmente importa.
            </p>
          </div>
          <div className="auth-benefits">
            <span><CheckCircle2 size={18} /> Prioridades visíveis</span>
            <span><CheckCircle2 size={18} /> Notas sempre no contexto</span>
            <span><CheckCircle2 size={18} /> Seu progresso em um olhar</span>
          </div>
          <div className="auth-orbit" aria-hidden="true">
            <span className="orbit-card orbit-card-one">3 tarefas concluídas</span>
            <span className="orbit-card orbit-card-two">Foco da semana · 72%</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand"><Brand /></div>
          <span className="eyebrow">Bem-vindo ao TaskNote</span>
          <h2>{isRegister ? "Crie seu espaço" : "Entre na sua conta"}</h2>
          <p className="auth-subtitle">
            {isRegister
              ? "Comece agora a organizar suas próximas conquistas."
              : "Continue de onde parou e coloque o dia em movimento."}
          </p>

          <form onSubmit={submit} className="auth-form">
            {isRegister && (
              <label>
                <span>Nome</span>
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Como podemos chamar você?"
                  minLength={2}
                  required
                />
              </label>
            )}
            <label>
              <span>E-mail</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@exemplo.com"
                required
              />
            </label>
            <label>
              <span>Senha</span>
              <span className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  minLength={isRegister ? 8 : 1}
                  required
                />
                <button
                  type="button"
                  className="icon-button password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            {error && <div className="form-error" role="alert">{error}</div>}

            <button className="button button-primary button-large" disabled={loading}>
              {loading ? <Loader2 className="spin" size={19} /> : null}
              {isRegister ? "Criar conta" : "Entrar"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <button className="api-settings-toggle" onClick={() => setShowSettings((value) => !value)}>
            <Settings2 size={15} /> Configurar endereço da API
          </button>
          {showSettings && (
            <label className="api-settings">
              <span>URL base da FastAPI</span>
              <input value={apiUrl} onChange={(event) => setApiUrlValue(event.target.value)} />
            </label>
          )}

          <div className="auth-divider"><span>ou</span></div>
          <button className="button button-demo" onClick={enterDemo}>
            <Sparkles size={18} /> Explorar demonstração
          </button>
          <p className="demo-caption">Funciona no navegador e não exige cadastro.</p>

          <p className="auth-switch">
            {isRegister ? "Já possui uma conta?" : "Ainda não possui uma conta?"}{" "}
            <button onClick={() => { setIsRegister((value) => !value); setError(""); }}>
              {isRegister ? "Entrar" : "Criar conta"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
