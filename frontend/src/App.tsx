import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";

import { AuthScreen } from "./components/AuthScreen";
import { NoteModal } from "./components/NoteModal";
import { Sidebar } from "./components/Sidebar";
import { TaskModal } from "./components/TaskModal";
import { createApiService, nextStatus } from "./lib/api";
import { createDemoService, resetDemoData } from "./lib/demo-store";
import { clearSession, getSession, saveSession } from "./lib/session";
import type {
  AppView,
  Note,
  NoteDraft,
  Session,
  Tag,
  Task,
  TaskDraft,
  TaskNoteService,
  TaskStatus,
} from "./types";
import { NotesView } from "./views/NotesView";
import { Overview } from "./views/Overview";
import { TagsView } from "./views/TagsView";
import { TasksView } from "./views/TasksView";

interface ToastState {
  type: "success" | "error";
  message: string;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [view, setView] = useState<AppView>("overview");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const service = useMemo<TaskNoteService | null>(() => {
    if (!session) return null;
    return session.mode === "demo"
      ? createDemoService()
      : createApiService(session.token ?? "");
  }, [session]);

  const notify = useCallback((message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
  }, []);

  const loadData = useCallback(async () => {
    if (!service) return;
    setLoading(true);
    try {
      const [loadedTasks, loadedNotes, loadedTags] = await Promise.all([
        service.listTasks(),
        service.listNotes(),
        service.listTags(),
      ]);
      setTasks(loadedTasks);
      setNotes(loadedNotes);
      setTags(loadedTags);
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Não foi possível carregar os dados.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify, service]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const authenticate = (nextSession: Session) => {
    saveSession(nextSession);
    setSession(nextSession);
  };

  const logout = () => {
    clearSession();
    setSession(null);
    setTasks([]);
    setNotes([]);
    setTags([]);
  };

  const handleTaskSave = async (draft: TaskDraft) => {
    if (!service) return;
    setSaving(true);
    try {
      if (editingTask) {
        await service.updateTask(editingTask.id, draft);
        notify("Tarefa atualizada.");
      } else {
        await service.createTask(draft);
        notify("Tarefa criada.");
      }
      setTaskModalOpen(false);
      setEditingTask(null);
      await loadData();
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Não foi possível salvar a tarefa.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleNoteSave = async (draft: NoteDraft) => {
    if (!service) return;
    setSaving(true);
    try {
      if (editingNote) {
        await service.updateNote(editingNote.id, draft);
        notify("Anotação atualizada.");
      } else {
        await service.createNote(draft);
        notify("Anotação criada.");
      }
      setNoteModalOpen(false);
      setEditingNote(null);
      await loadData();
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Não foi possível salvar a anotação.", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (task: Task, status?: TaskStatus) => {
    if (!service) return;
    try {
      await service.updateTaskStatus(task.id, status ?? nextStatus(task.status));
      await loadData();
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Não foi possível alterar o status.", "error");
    }
  };

  const deleteTask = async (task: Task) => {
    if (!service || !window.confirm(`Excluir a tarefa “${task.title}”?`)) return;
    try {
      await service.deleteTask(task.id);
      notify("Tarefa excluída. As anotações vinculadas foram preservadas.");
      await loadData();
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Não foi possível excluir a tarefa.", "error");
    }
  };

  const deleteNote = async (note: Note) => {
    if (!service || !window.confirm(`Excluir a anotação “${note.title}”?`)) return;
    try {
      await service.deleteNote(note.id);
      notify("Anotação excluída.");
      await loadData();
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Não foi possível excluir a anotação.", "error");
    }
  };

  const createTag = async (name: string) => {
    if (!service) return;
    try {
      await service.createTag(name);
      notify("Tag criada.");
      await loadData();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Não foi possível criar a tag.";
      notify(message, "error");
      throw reason;
    }
  };

  const deleteTag = async (tag: Tag) => {
    if (!service || !window.confirm(`Excluir a tag “${tag.name}”?`)) return;
    try {
      await service.deleteTag(tag.id);
      notify("Tag excluída. As tarefas e anotações foram mantidas.");
      await loadData();
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Não foi possível excluir a tag.", "error");
    }
  };

  const restoreDemo = () => {
    resetDemoData();
    notify("Dados de demonstração restaurados.");
    void loadData();
  };

  const openNewTask = () => { setEditingTask(null); setTaskModalOpen(true); };
  const openEditTask = (task: Task) => { setEditingTask(task); setTaskModalOpen(true); };
  const openNewNote = () => { setEditingNote(null); setNoteModalOpen(true); };
  const openEditNote = (note: Note) => { setEditingNote(note); setNoteModalOpen(true); };

  if (!session) return <AuthScreen onAuthenticated={authenticate} />;

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        user={session.user}
        mode={session.mode}
        onViewChange={setView}
        onLogout={logout}
        onResetDemo={restoreDemo}
      />
      <main className="app-content">
        {loading ? (
          <div className="app-loader"><Loader2 className="spin" size={30} /><span>Organizando seu espaço...</span></div>
        ) : (
          <>
            {view === "overview" && (
              <Overview
                user={session.user}
                tasks={tasks}
                notes={notes}
                onViewChange={setView}
                onNewTask={openNewTask}
                onNewNote={openNewNote}
                onStatusChange={(task, status) => void updateStatus(task, status)}
              />
            )}
            {view === "tasks" && (
              <TasksView
                tasks={tasks}
                onNew={openNewTask}
                onEdit={openEditTask}
                onDelete={(task) => void deleteTask(task)}
                onStatusChange={(task, status) => void updateStatus(task, status)}
              />
            )}
            {view === "notes" && (
              <NotesView
                notes={notes}
                tasks={tasks}
                onNew={openNewNote}
                onEdit={openEditNote}
                onDelete={(note) => void deleteNote(note)}
              />
            )}
            {view === "tags" && (
              <TagsView tags={tags} tasks={tasks} notes={notes} onCreate={createTag} onDelete={(tag) => void deleteTag(tag)} />
            )}
          </>
        )}
      </main>

      {taskModalOpen && (
        <TaskModal
          task={editingTask}
          tags={tags}
          saving={saving}
          onSave={handleTaskSave}
          onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
        />
      )}
      {noteModalOpen && (
        <NoteModal
          note={editingNote}
          tasks={tasks}
          tags={tags}
          saving={saving}
          onSave={handleNoteSave}
          onClose={() => { setNoteModalOpen(false); setEditingNote(null); }}
        />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.type === "success" ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} aria-label="Fechar"><X size={16} /></button>
        </div>
      )}
    </div>
  );
}
