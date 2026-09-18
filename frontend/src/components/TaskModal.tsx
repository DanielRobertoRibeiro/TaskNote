import { useState, type FormEvent } from "react";
import { CalendarDays, Loader2 } from "lucide-react";

import { toDateInput } from "../lib/format";
import type { Tag, Task, TaskDraft, TaskPriority } from "../types";
import { Modal } from "./Modal";

interface TaskModalProps {
  task: Task | null;
  tags: Tag[];
  saving: boolean;
  onSave: (draft: TaskDraft) => Promise<void>;
  onClose: () => void;
}

export function TaskModal({ task, tags, saving, onSave, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "media");
  const [dueAt, setDueAt] = useState(toDateInput(task?.due_at ?? null));
  const [tagIds, setTagIds] = useState<string[]>(task?.tags.map((tag) => tag.id) ?? []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({ title, description, priority, due_at: dueAt, tag_ids: tagIds });
  };

  const toggleTag = (id: string) => {
    setTagIds((current) =>
      current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id],
    );
  };

  return (
    <Modal
      title={task ? "Editar tarefa" : "Nova tarefa"}
      subtitle="Defina o próximo passo com clareza."
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={submit}>
        <label className="field field-wide">
          <span>Título</span>
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="O que precisa ser feito?"
            maxLength={200}
            required
          />
        </label>
        <label className="field field-wide">
          <span>Descrição</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Adicione contexto, referências ou critérios de conclusão."
            rows={4}
            maxLength={5000}
          />
        </label>
        <label className="field">
          <span>Prioridade</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </label>
        <label className="field">
          <span>Prazo</span>
          <span className="input-with-icon">
            <CalendarDays size={17} />
            <input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
          </span>
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
          <button className="button button-primary" disabled={saving || !title.trim()}>
            {saving && <Loader2 className="spin" size={17} />}
            {task ? "Salvar alterações" : "Criar tarefa"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
