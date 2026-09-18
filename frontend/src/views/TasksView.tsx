import { CalendarDays, Check, Circle, Edit3, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { formatDate, isOverdue, priorityLabels, statusLabels } from "../lib/format";
import { filterTasks } from "../lib/task-utils";
import type { Task, TaskFilters, TaskPriority, TaskStatus } from "../types";
import { PageHeader } from "../components/PageHeader";

interface TasksViewProps {
  tasks: Task[];
  onNew: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

export function TasksView({ tasks, onNew, onEdit, onDelete, onStatusChange }: TasksViewProps) {
  const [filters, setFilters] = useState<TaskFilters>({ query: "", status: "todos", priority: "todas" });
  const visibleTasks = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Organização"
        title="Tarefas"
        description={`${tasks.filter((task) => task.status !== "concluida").length} itens pedem sua atenção.`}
        action={<button className="button button-primary" onClick={onNew}><Plus size={18} /> Nova tarefa</button>}
      />

      <section className="toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            value={filters.query}
            onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            placeholder="Buscar por título, descrição ou tag"
          />
        </label>
        <select
          aria-label="Filtrar por status"
          value={filters.status}
          onChange={(event) => setFilters({ ...filters, status: event.target.value as TaskStatus | "todos" })}
        >
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluídas</option>
        </select>
        <select
          aria-label="Filtrar por prioridade"
          value={filters.priority}
          onChange={(event) => setFilters({ ...filters, priority: event.target.value as TaskPriority | "todas" })}
        >
          <option value="todas">Todas as prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
      </section>

      <section className="task-board">
        <header className="list-summary">
          <span>{visibleTasks.length} {visibleTasks.length === 1 ? "tarefa" : "tarefas"}</span>
          <div className="summary-key">
            <span><i className="priority-dot priority-alta" />Alta</span>
            <span><i className="priority-dot priority-media" />Média</span>
            <span><i className="priority-dot priority-baixa" />Baixa</span>
          </div>
        </header>
        <div className="task-list">
          {visibleTasks.map((task) => {
            const completed = task.status === "concluida";
            return (
              <article className={completed ? "task-row completed" : "task-row"} key={task.id}>
                <button
                  className={`task-check ${completed ? "checked" : task.status === "em_andamento" ? "active" : ""}`}
                  onClick={() => onStatusChange(task, completed ? "pendente" : "concluida")}
                  aria-label={completed ? `Reabrir ${task.title}` : `Concluir ${task.title}`}
                >
                  {completed ? <Check size={15} /> : <Circle size={13} />}
                </button>
                <div className="task-main">
                  <div className="task-title-line">
                    <h3>{task.title}</h3>
                    <span className={`priority-badge priority-${task.priority}`}>{priorityLabels[task.priority]}</span>
                  </div>
                  {task.description && <p>{task.description}</p>}
                  <div className="task-meta">
                    <span className={`status-badge status-${task.status}`}>{statusLabels[task.status]}</span>
                    <span className={isOverdue(task.due_at, completed) ? "due-date overdue" : "due-date"}>
                      <CalendarDays size={14} /> {formatDate(task.due_at)}
                    </span>
                    {task.tags.map((tag) => <span className="tag" key={tag.id}>#{tag.name}</span>)}
                  </div>
                </div>
                <div className="row-actions">
                  <button className="icon-button" onClick={() => onEdit(task)} aria-label={`Editar ${task.title}`}><Edit3 size={17} /></button>
                  <button className="icon-button danger" onClick={() => onDelete(task)} aria-label={`Excluir ${task.title}`}><Trash2 size={17} /></button>
                </div>
              </article>
            );
          })}
          {!visibleTasks.length && (
            <div className="empty-state">
              <span><Check size={28} /></span>
              <h3>Nada por aqui</h3>
              <p>Ajuste os filtros ou crie uma nova tarefa.</p>
              <button className="button button-primary" onClick={onNew}><Plus size={17} /> Criar tarefa</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
