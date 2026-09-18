export type TaskStatus = "pendente" | "em_andamento" | "concluida";
export type TaskPriority = "baixa" | "media" | "alta";
export type AppView = "overview" | "tasks" | "notes" | "tags";
export type AppMode = "demo" | "api";

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  tags: Pick<Tag, "id" | "name">[];
}

export interface Note {
  id: string;
  task_id: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: Pick<Tag, "id" | "name">[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface TaskDraft {
  title: string;
  description: string;
  priority: TaskPriority;
  due_at: string;
  tag_ids: string[];
}

export interface NoteDraft {
  title: string;
  content: string;
  task_id: string;
  tag_ids: string[];
}

export interface Session {
  mode: AppMode;
  user: User;
  token?: string;
}

export interface TaskFilters {
  query: string;
  status: TaskStatus | "todos";
  priority: TaskPriority | "todas";
}

export interface TaskNoteService {
  listTasks(): Promise<Task[]>;
  createTask(draft: TaskDraft): Promise<Task>;
  updateTask(id: string, draft: TaskDraft): Promise<Task>;
  updateTaskStatus(id: string, status: TaskStatus): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  listNotes(): Promise<Note[]>;
  createNote(draft: NoteDraft): Promise<Note>;
  updateNote(id: string, draft: NoteDraft): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  listTags(): Promise<Tag[]>;
  createTag(name: string): Promise<Tag>;
  deleteTag(id: string): Promise<void>;
}
