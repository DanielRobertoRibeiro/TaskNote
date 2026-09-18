import { Hash, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { Note, Tag, Task } from "../types";
import { PageHeader } from "../components/PageHeader";

interface TagsViewProps {
  tags: Tag[];
  tasks: Task[];
  notes: Note[];
  onCreate: (name: string) => Promise<void>;
  onDelete: (tag: Tag) => void;
}

export function TagsView({ tags, tasks, notes, onCreate, onDelete }: TagsViewProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate(name);
      setName("");
    } finally {
      setSaving(false);
    }
  };

  const countUsage = (id: string) =>
    tasks.filter((task) => task.tags.some((tag) => tag.id === id)).length +
    notes.filter((note) => note.tags.some((tag) => tag.id === id)).length;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Contexto"
        title="Tags"
        description="Agrupe assuntos e encontre tudo com mais rapidez."
      />
      <section className="tags-layout">
        <article className="panel tag-create-card">
          <span className="tag-hero-icon"><TagIcon size={25} /></span>
          <h2>Nova tag</h2>
          <p>Use nomes curtos que representem projetos, áreas ou contextos.</p>
          <form onSubmit={submit}>
            <label className="field">
              <span>Nome</span>
              <span className="input-with-icon"><Hash size={17} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Faculdade" maxLength={50} /></span>
            </label>
            <button className="button button-primary" disabled={saving || !name.trim()}><Plus size={17} /> Criar tag</button>
          </form>
        </article>

        <article className="panel tag-list-card">
          <div className="panel-heading">
            <div><span className="panel-kicker">Biblioteca</span><h2>Suas tags</h2></div>
            <span className="tag-total">{tags.length}</span>
          </div>
          <div className="tag-management-list">
            {tags.map((tag, index) => {
              const usage = countUsage(tag.id);
              return (
                <div className="tag-management-row" key={tag.id}>
                  <span className={`tag-color tag-color-${index % 5}`}><Hash size={16} /></span>
                  <div><strong>{tag.name}</strong><small>{usage} {usage === 1 ? "uso" : "usos"}</small></div>
                  <button className="icon-button danger" onClick={() => onDelete(tag)} aria-label={`Excluir ${tag.name}`}><Trash2 size={17} /></button>
                </div>
              );
            })}
            {!tags.length && <div className="empty-inline">Crie sua primeira tag para organizar melhor.</div>}
          </div>
        </article>
      </section>
    </div>
  );
}
