import {
  FileText,
  LayoutDashboard,
  ListTodo,
  LogOut,
  RotateCcw,
  Tags,
} from "lucide-react";

import { initials } from "../lib/format";
import type { AppMode, AppView, User } from "../types";
import { Brand } from "./Brand";

interface SidebarProps {
  view: AppView;
  user: User;
  mode: AppMode;
  onViewChange: (view: AppView) => void;
  onLogout: () => void;
  onResetDemo: () => void;
}

const navigation: { id: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "tasks", label: "Tarefas", icon: ListTodo },
  { id: "notes", label: "Anotações", icon: FileText },
  { id: "tags", label: "Tags", icon: Tags },
];

export function Sidebar({
  view,
  user,
  mode,
  onViewChange,
  onLogout,
  onResetDemo,
}: SidebarProps) {
  return (
    <>
      <aside className="sidebar">
        <Brand />
        <nav className="sidebar-nav" aria-label="Navegação principal">
          <span className="nav-label">Menu</span>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={view === item.id ? "nav-item active" : "nav-item"}
                onClick={() => onViewChange(item.id)}
              >
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          {mode === "demo" && (
            <div className="demo-status">
              <span className="demo-dot" />
              <div><strong>Modo demonstração</strong><small>Dados salvos neste navegador</small></div>
            </div>
          )}
          <div className="profile-block">
            <span className="avatar">{initials(user.name)}</span>
            <div className="profile-copy">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
            <button className="icon-button" onClick={onLogout} title="Sair" aria-label="Sair">
              <LogOut size={18} />
            </button>
          </div>
          {mode === "demo" && (
            <button className="reset-demo" onClick={onResetDemo}>
              <RotateCcw size={14} /> Restaurar dados de exemplo
            </button>
          )}
        </div>
      </aside>

      <nav className="mobile-nav" aria-label="Navegação móvel">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => onViewChange(item.id)}
            >
              <Icon size={20} />
              <span>{item.label.replace("Visão geral", "Início")}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
