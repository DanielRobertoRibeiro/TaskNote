import { Edit3, FileText, Link2, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { formatDate } from "../lib/format";
import type { Note, Task } from "../types";
import { PageHeader } from "../components/PageHeader";

interface NotesViewProps {
  notes: Note[];
  tasks: Task[];
  onNew: () => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export function NotesView({ notes, tasks, onNew, onEdit, onDelete }: NotesViewProps) {
  const [query, setQuery] = useState("");
  const visibleNotes = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return notes;
    return notes.filter(
      (note) =>
        note.title.toLocaleLowerCase("pt-BR").includes(normalized) ||
        note.content.toLocaleLowerCase("pt-BR").includes(normalized) ||
        note.tags.some((tag) => tag.name.toLocaleLowerCase("pt-BR").includes(normalized)),
    );
  }, [notes, query]);
  const taskName = (id: string | null) => tasks.find((task) => task.id === id)?.title;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Conhecimento"
        title="Anotações"
        description="Ideias, decisões e referências sempre à mão."
        action={<button className="button button-primary" onClick={onNew}><Plus size={18} /> Nova anotação</button>}
      />
      <section className="toolbar notes-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nas anotações" />
        </label>
        <span className="result-count">{visibleNotes.length} {visibleNotes.length === 1 ? "registro" : "registros"}</span>
      </section>

      <section className="notes-grid">
        {visibleNotes.map((note, index) => (
          <article className={`note-card note-card-${index % 4}`} key={note.id}>
            <header>
              <span className="note-icon"><FileText size={18} /></span>
              <div className="row-actions">
                <button className="icon-button" onClick={() => onEdit(note)} aria-label={`Editar ${note.title}`}><Edit3 size={16} /></button>
                <button className="icon-button danger" onClick={() => onDelete(note)} aria-label={`Excluir ${note.title}`}><Trash2 size={16} /></button>
              </div>
            </header>
            <h2>{note.title}</h2>
            <p>{note.content}</p>
            <div className="note-tags">{note.tags.map((tag) => <span className="tag" key={tag.id}>#{tag.name}</span>)}</div>
            <footer>
              <span>{formatDate(note.updated_at, { year: "numeric" })}</span>
              {note.task_id && taskName(note.task_id) && <span className="linked-task"><Link2 size={13} /> {taskName(note.task_id)}</span>}
            </footer>
          </article>
        ))}
        {!visibleNotes.length && (
          <div className="empty-state notes-empty">
            <span><FileText size={28} /></span>
            <h3>Nenhuma anotação encontrada</h3>
            <p>Registre uma ideia ou ajuste sua busca.</p>
            <button className="button button-primary" onClick={onNew}><Plus size={17} /> Nova anotação</button>
          </div>
        )}
      </section>
    </div>
  );
}
