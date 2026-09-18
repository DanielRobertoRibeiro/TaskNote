import type {
  Note,
  NoteDraft,
  Page,
  Tag,
  Task,
  TaskDraft,
  TaskNoteService,
  TaskStatus,
  User,
} from "../types";
import { dateInputToIso } from "./format";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

interface ErrorResponse {
  error?: {
    message?: string;
  };
}

const API_URL_KEY = "tasknote_api_url";

export function getApiUrl() {
  const configured = localStorage.getItem(API_URL_KEY) || import.meta.env.VITE_API_URL;
  return (configured || "http://localhost:8000").replace(/\/$/, "");
}

export function setApiUrl(value: string) {
  localStorage.setItem(API_URL_KEY, value.trim().replace(/\/$/, ""));
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, { ...init, headers });
  } catch {
    throw new Error(
      "Não foi possível acessar a API. Confira a URL, o servidor e a configuração de CORS.",
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorResponse;
    throw new Error(body.error?.message || `A requisição falhou (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  return request<TokenResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(name: string, email: string, password: string) {
  await request<User>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  return login(email, password);
}

export function createApiService(token: string): TaskNoteService {
  const withToken = <T>(path: string, init?: RequestInit) => request<T>(path, init, token);
  const taskPayload = (draft: TaskDraft) => ({
    ...draft,
    due_at: draft.due_at ? dateInputToIso(draft.due_at) : null,
  });
  const notePayload = (draft: NoteDraft) => ({
    ...draft,
    task_id: draft.task_id || null,
  });

  return {
    async listTasks() {
      const page = await withToken<Page<Task>>("/api/v1/tasks?page_size=100");
      return page.items;
    },
    createTask(draft) {
      return withToken<Task>("/api/v1/tasks", {
        method: "POST",
        body: JSON.stringify(taskPayload(draft)),
      });
    },
    updateTask(id, draft) {
      return withToken<Task>(`/api/v1/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(taskPayload(draft)),
      });
    },
    updateTaskStatus(id, status) {
      return withToken<Task>(`/api/v1/tasks/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    deleteTask(id) {
      return withToken<void>(`/api/v1/tasks/${id}`, { method: "DELETE" });
    },
    async listNotes() {
      const page = await withToken<Page<Note>>("/api/v1/notes?page_size=100");
      return page.items;
    },
    createNote(draft) {
      return withToken<Note>("/api/v1/notes", {
        method: "POST",
        body: JSON.stringify(notePayload(draft)),
      });
    },
    updateNote(id, draft) {
      return withToken<Note>(`/api/v1/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(notePayload(draft)),
      });
    },
    deleteNote(id) {
      return withToken<void>(`/api/v1/notes/${id}`, { method: "DELETE" });
    },
    listTags() {
      return withToken<Tag[]>("/api/v1/tags");
    },
    createTag(name) {
      return withToken<Tag>("/api/v1/tags", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    },
    deleteTag(id) {
      return withToken<void>(`/api/v1/tags/${id}`, { method: "DELETE" });
    },
  };
}

export function nextStatus(status: TaskStatus): TaskStatus {
  if (status === "pendente") return "em_andamento";
  if (status === "em_andamento") return "concluida";
  return "pendente";
}
