import {
  ArrowRight,
  BookOpenText,
  CalendarCheck2,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileText,
  Plus,
} from "lucide-react";

import { calculateStats } from "../lib/task-utils";
import { formatDate, formatLongDate, isOverdue, priorityLabels } from "../lib/format";
import type { AppView, Note, Task, TaskStatus, User } from "../types";
import { PageHeader } from "../components/PageHeader";

interface OverviewProps {
  user: User;
  tasks: Task[];
  notes: Note[];
  onViewChange: (view: AppView) => void;
  onNewTask: () => void;
  onNewNote: () => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

export function Overview({
  user,
  tasks,
  notes,
  onViewChange,
  onNewTask,
  onNewNote,
  onStatusChange,
}: OverviewProps) {
  const stats = calculateStats(tasks, notes.length);
  const firstName = user.name.split(" ")[0];
  const upcoming = [...tasks]
    .filter((task) => task.status !== "concluida")
    .sort((a, b) => {
      if (!a.due_at) return 1;
      if (!b.due_at) return -1;
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    })
    .slice(0, 4);
  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);
  const chartValues = [42, 58, 36, 72, Math.max(46, stats.progress), 64, 34];

  return (
    <div className="page overview-page">
      <PageHeader
        eyebrow={formatLongDate()}
        title={`Olá, ${firstName}!`}
        description="Aqui está o panorama do seu dia. Um passo de cada vez."
        action={
          <button className="button button-primary" onClick={onNewTask}>
            <Plus size={18} /> Nova tarefa
          </button>
        }
      />

      <section className="stats-grid" aria-label="Resumo">
        <article className="stat-card stat-blue">
          <span className="stat-icon"><CalendarCheck2 size={21} /></span>
          <div><strong>{stats.today}</strong><span>Para hoje</span></div>
          <small>Seu foco imediato</small>
        </article>
        <article className="stat-card stat-amber">
          <span className="stat-icon"><Clock3 size={21} /></span>
          <div><strong>{stats.inProgress}</strong><span>Em andamento</span></div>
          <small>Continue avançando</small>
        </article>
        <article className="stat-card stat-green">
          <span className="stat-icon"><CheckCircle2 size={21} /></span>
          <div><strong>{stats.completed}</strong><span>Concluídas</span></div>
          <small>Bom trabalho!</small>
        </article>
        <article className="stat-card stat-violet">
          <span className="stat-icon"><FileText size={21} /></span>
          <div><strong>{stats.notes}</strong><span>Anotações</span></div>
          <small>Ideias registradas</small>
        </article>
      </section>

      <section className="overview-grid">
        <article className="panel progress-panel">
          <div className="panel-heading">
            <div><span className="panel-kicker">Ritmo da semana</span><h2>Seu progresso</h2></div>
            <strong>{stats.progress}%</strong>
          </div>
          <div className="chart" aria-label={`Progresso semanal de ${stats.progress}%`}>
            {chartValues.map((value, index) => (
              <div className="chart-column" key={index}>
                <span style={{ height: `${value}%` }} className={index === 4 ? "highlight" : ""} />
                <small>{["S", "T", "Q", "Q", "S", "S", "D"][index]}</small>
              </div>
            ))}
          </div>
          <div className="progress-footer">
            <span><span className="legend-dot" /> Tarefas concluídas</span>
            <span>{stats.completed} de {tasks.length} no total</span>
          </div>
        </article>

        <article className="panel focus-panel">
          <span className="panel-kicker">Foco do dia</span>
          <div className="focus-ring" style={{ "--progress": `${stats.progress * 3.6}deg` } as React.CSSProperties}>
            <span><strong>{stats.progress}%</strong><small>concluído</small></span>
          </div>
          <h2>{stats.progress >= 70 ? "Ótimo ritmo!" : "Siga em frente"}</h2>
          <p>{stats.today ? `${stats.today} tarefa${stats.today > 1 ? "s" : ""} para hoje.` : "Nenhuma pendência vence hoje."}</p>
        </article>
      </section>

      <section className="overview-grid overview-lists">
        <article className="panel">
          <div className="panel-heading">
            <div><span className="panel-kicker">Prioridades</span><h2>Próximas tarefas</h2></div>
            <button className="text-button" onClick={() => onViewChange("tasks")}>Ver todas <ArrowRight size={15} /></button>
          </div>
          <div className="compact-task-list">
            {upcoming.length ? upcoming.map((task) => (
              <div className="compact-task" key={task.id}>
                <button
                  className={`task-check ${task.status === "em_andamento" ? "active" : ""}`}
                  onClick={() => onStatusChange(task, task.status === "pendente" ? "em_andamento" : "concluida")}
                  aria-label={`Avançar status de ${task.title}`}
                >
                  {task.status === "em_andamento" ? <CircleDot size={15} /> : null}
                </button>
                <div className="compact-task-copy">
                  <strong>{task.title}</strong>
                  <span className={isOverdue(task.due_at) ? "overdue" : ""}>{formatDate(task.due_at)}</span>
                </div>
                <span className={`priority-dot priority-${task.priority}`} title={priorityLabels[task.priority]} />
              </div>
            )) : <div className="empty-inline">Nenhuma tarefa pendente. Aproveite o momento!</div>}
          </div>
          <button className="panel-add" onClick={onNewTask}><Plus size={16} /> Adicionar tarefa</button>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div><span className="panel-kicker">Memória externa</span><h2>Anotações recentes</h2></div>
            <button className="text-button" onClick={() => onViewChange("notes")}>Ver todas <ArrowRight size={15} /></button>
          </div>
          <div className="compact-note-list">
            {recentNotes.map((note, index) => (
              <button className={`compact-note note-tone-${index % 3}`} key={note.id} onClick={() => onViewChange("notes")}>
                <span className="note-mini-icon"><BookOpenText size={17} /></span>
                <span><strong>{note.title}</strong><small>{note.content}</small></span>
              </button>
            ))}
          </div>
          <button className="panel-add" onClick={onNewNote}><Plus size={16} /> Nova anotação</button>
        </article>
      </section>
    </div>
  );
}
