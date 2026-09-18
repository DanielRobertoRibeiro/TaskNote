import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import type { Note, NoteDraft, Tag, Task } from "../types";
import { Modal } from "./Modal";

interface NoteModalProps {
  note: Note | null;
  tasks: Task[];
  tags: Tag[];
  saving: boolean;
  onSave: (draft: NoteDraft) => Promise<void>;
  onClose: () => void;
}

export function NoteModal({ note, tasks, tags, saving, onSave, onClose }: NoteModalProps) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [taskId, setTaskId] = useState(note?.task_id ?? "");
  const [tagIds, setTagIds] = useState<string[]>(note?.tags.map((tag) => tag.id) ?? []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({ title, content, task_id: taskId, tag_ids: tagIds });
  };

  const toggleTag = (id: string) => {
    setTagIds((current) =>
      current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id],
    );
  };

  return (
    <Modal
      title={note ? "Editar anotação" : "Nova anotação"}
      subtitle="Capture uma ideia antes que ela escape."
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={submit}>
        <label className="field field-wide">
          <span>Título</span>
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Dê um nome para esta anotação"
            maxLength={200}
            required
          />
        </label>
        <label className="field field-wide">
          <span>Conteúdo</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Escreva ideias, decisões, referências..."
            rows={7}
            maxLength={20000}
            required
          />
        </label>
        <label className="field field-wide">
          <span>Tarefa relacionada <small>opcional</small></span>
          <select value={taskId} onChange={(event) => setTaskId(event.target.value)}>
            <option value="">Sem tarefa vinculada</option>
            {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
          </select>
        </label>
        {tags.length > 0 && (
          <fieldset className="field field-wide tag-selector">
            <legend>Tags</legend>
            <div>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={tagIds.includes(tag.id) ? "tag-choice selected" : "tag-choice"}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <footer className="modal-actions field-wide">
          <button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button>
          <button className="button button-primary" disabled={saving || !title.trim() || !content.trim()}>
            {saving && <Loader2 className="spin" size={17} />}
            {note ? "Salvar alterações" : "Criar anotação"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
