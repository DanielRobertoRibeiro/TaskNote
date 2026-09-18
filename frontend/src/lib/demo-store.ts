import type {
  Note,
  NoteDraft,
  Tag,
  Task,
  TaskDraft,
  TaskNoteService,
  TaskStatus,
  User,
} from "../types";
import { dateInputToIso } from "./format";

interface DemoData {
  tasks: Task[];
  notes: Note[];
  tags: Tag[];
}

const STORE_KEY = "tasknote_demo_data_v1";

export const demoUser: User = {
  id: "demo-user",
  name: "Daniel Ribeiro",
  email: "demo@tasknote.app",
  created_at: new Date().toISOString(),
};

function relativeDate(days: number, hour = 18) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function seedData(): DemoData {
  const now = new Date().toISOString();
  const tags: Tag[] = [
    { id: "tag-trabalho", name: "Trabalho", created_at: now },
    { id: "tag-pessoal", name: "Pessoal", created_at: now },
    { id: "tag-estudos", name: "Estudos", created_at: now },
    { id: "tag-ideias", name: "Ideias", created_at: now },
  ];
  const tag = (id: string) => {
    const match = tags.find((item) => item.id === id)!;
    return { id: match.id, name: match.name };
  };

  return {
    tags,
    tasks: [
      {
        id: "task-apresentacao",
        title: "Preparar apresentação do produto",
        description: "Revisar métricas, organizar a narrativa e ensaiar a demonstração.",
        status: "em_andamento",
        priority: "alta",
        due_at: relativeDate(0),
        completed_at: null,
        created_at: relativeDate(-4),
        updated_at: relativeDate(-1),
        tags: [tag("tag-trabalho")],
      },
      {
        id: "task-fastapi",
        title: "Revisar documentação da API",
        description: "Conferir exemplos de autenticação e filtros no Swagger.",
        status: "pendente",
        priority: "media",
        due_at: relativeDate(1),
        completed_at: null,
        created_at: relativeDate(-3),
        updated_at: relativeDate(-2),
        tags: [tag("tag-estudos"), tag("tag-trabalho")],
      },
      {
        id: "task-leitura",
        title: "Finalizar capítulo sobre arquitetura",
        description: "Registrar os principais aprendizados nas anotações.",
        status: "pendente",
        priority: "baixa",
        due_at: relativeDate(3),
        completed_at: null,
        created_at: relativeDate(-2),
        updated_at: relativeDate(-2),
        tags: [tag("tag-estudos")],
      },
      {
        id: "task-planejamento",
        title: "Planejar prioridades da semana",
        description: "Separar entregas importantes e bloquear tempo de foco.",
        status: "concluida",
        priority: "media",
        due_at: relativeDate(-1),
        completed_at: relativeDate(-1, 16),
        created_at: relativeDate(-5),
        updated_at: relativeDate(-1, 16),
        tags: [tag("tag-pessoal")],
      },
      {
        id: "task-backup",
        title: "Organizar backup dos projetos",
        description: null,
        status: "concluida",
        priority: "baixa",
        due_at: relativeDate(-2),
        completed_at: relativeDate(-2, 15),
        created_at: relativeDate(-7),
        updated_at: relativeDate(-2, 15),
        tags: [tag("tag-pessoal")],
      },
    ],
    notes: [
      {
        id: "note-apresentacao",
        task_id: "task-apresentacao",
        title: "Estrutura da apresentação",
        content:
          "Começar pelo problema, mostrar o fluxo principal e encerrar com os ganhos de segurança e organização.",
        created_at: relativeDate(-2),
        updated_at: relativeDate(-1),
        tags: [tag("tag-trabalho")],
      },
      {
        id: "note-api",
        task_id: "task-fastapi",
        title: "Decisões técnicas",
        content:
          "Manter as regras nos serviços, consultas nos repositórios e contratos HTTP nos schemas Pydantic.",
        created_at: relativeDate(-3),
        updated_at: relativeDate(-2),
        tags: [tag("tag-estudos"), tag("tag-ideias")],
      },
      {
        id: "note-ideias",
        task_id: null,
        title: "Próximas evoluções",
        content:
          "Avaliar lembretes, calendário, compartilhamento de listas e busca textual avançada.",
        created_at: relativeDate(-1),
        updated_at: relativeDate(-1),
        tags: [tag("tag-ideias")],
      },
    ],
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function load(): DemoData {
  const saved = localStorage.getItem(STORE_KEY);
  if (!saved) {
    const seed = seedData();
    localStorage.setItem(STORE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(saved) as DemoData;
  } catch {
    const seed = seedData();
    localStorage.setItem(STORE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function save(data: DemoData) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function tagsFor(data: DemoData, ids: string[]) {
  return data.tags
    .filter((tag) => ids.includes(tag.id))
    .map(({ id, name }) => ({ id, name }));
}

export function resetDemoData() {
  localStorage.removeItem(STORE_KEY);
}

export function createDemoService(): TaskNoteService {
  return {
    async listTasks() {
      return clone(load().tasks);
    },
    async createTask(draft: TaskDraft) {
      const data = load();
      const now = new Date().toISOString();
      const task: Task = {
        id: crypto.randomUUID(),
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        priority: draft.priority,
        status: "pendente",
        due_at: draft.due_at ? dateInputToIso(draft.due_at) : null,
        completed_at: null,
        created_at: now,
        updated_at: now,
        tags: tagsFor(data, draft.tag_ids),
      };
      data.tasks.unshift(task);
      save(data);
      return clone(task);
    },
    async updateTask(id: string, draft: TaskDraft) {
      const data = load();
      const task = data.tasks.find((item) => item.id === id);
      if (!task) throw new Error("Tarefa não encontrada.");
      Object.assign(task, {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        priority: draft.priority,
        due_at: draft.due_at ? dateInputToIso(draft.due_at) : null,
        updated_at: new Date().toISOString(),
        tags: tagsFor(data, draft.tag_ids),
      });
      save(data);
      return clone(task);
    },
    async updateTaskStatus(id: string, status: TaskStatus) {
      const data = load();
      const task = data.tasks.find((item) => item.id === id);
      if (!task) throw new Error("Tarefa não encontrada.");
      task.status = status;
      task.completed_at = status === "concluida" ? new Date().toISOString() : null;
      task.updated_at = new Date().toISOString();
      save(data);
      return clone(task);
    },
    async deleteTask(id: string) {
      const data = load();
      data.tasks = data.tasks.filter((task) => task.id !== id);
      data.notes = data.notes.map((note) =>
        note.task_id === id ? { ...note, task_id: null } : note,
      );
      save(data);
    },
    async listNotes() {
      return clone(load().notes);
    },
    async createNote(draft: NoteDraft) {
      const data = load();
      const now = new Date().toISOString();
      const note: Note = {
        id: crypto.randomUUID(),
        title: draft.title.trim(),
        content: draft.content.trim(),
        task_id: draft.task_id || null,
        created_at: now,
        updated_at: now,
        tags: tagsFor(data, draft.tag_ids),
      };
      data.notes.unshift(note);
      save(data);
      return clone(note);
    },
    async updateNote(id: string, draft: NoteDraft) {
      const data = load();
      const note = data.notes.find((item) => item.id === id);
      if (!note) throw new Error("Anotação não encontrada.");
      Object.assign(note, {
        title: draft.title.trim(),
        content: draft.content.trim(),
        task_id: draft.task_id || null,
        updated_at: new Date().toISOString(),
        tags: tagsFor(data, draft.tag_ids),
      });
      save(data);
      return clone(note);
    },
    async deleteNote(id: string) {
      const data = load();
      data.notes = data.notes.filter((note) => note.id !== id);
      save(data);
    },
    async listTags() {
      return clone(load().tags);
    },
    async createTag(name: string) {
      const data = load();
      const normalized = name.trim().toLocaleLowerCase("pt-BR");
      if (data.tags.some((tag) => tag.name.toLocaleLowerCase("pt-BR") === normalized)) {
        throw new Error("Já existe uma tag com este nome.");
      }
      const tag: Tag = {
        id: crypto.randomUUID(),
        name: name.trim(),
        created_at: new Date().toISOString(),
      };
      data.tags.push(tag);
      save(data);
      return clone(tag);
    },
    async deleteTag(id: string) {
      const data = load();
      data.tags = data.tags.filter((tag) => tag.id !== id);
      data.tasks = data.tasks.map((task) => ({
        ...task,
        tags: task.tags.filter((tag) => tag.id !== id),
      }));
      data.notes = data.notes.map((note) => ({
        ...note,
        tags: note.tags.filter((tag) => tag.id !== id),
      }));
      save(data);
    },
  };
}
