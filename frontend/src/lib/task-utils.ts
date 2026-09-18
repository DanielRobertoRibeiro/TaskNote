import type { Task, TaskFilters } from "../types";
import { isToday } from "./format";

export function filterTasks(tasks: Task[], filters: TaskFilters) {
  const query = filters.query.trim().toLocaleLowerCase("pt-BR");
  return tasks.filter((task) => {
    const matchesQuery =
      !query ||
      task.title.toLocaleLowerCase("pt-BR").includes(query) ||
      task.description?.toLocaleLowerCase("pt-BR").includes(query) ||
      task.tags.some((tag) => tag.name.toLocaleLowerCase("pt-BR").includes(query));
    const matchesStatus = filters.status === "todos" || task.status === filters.status;
    const matchesPriority =
      filters.priority === "todas" || task.priority === filters.priority;
    return Boolean(matchesQuery && matchesStatus && matchesPriority);
  });
}

export function calculateStats(tasks: Task[], noteCount: number) {
  const completed = tasks.filter((task) => task.status === "concluida").length;
  return {
    today: tasks.filter((task) => isToday(task.due_at) && task.status !== "concluida").length,
    inProgress: tasks.filter((task) => task.status === "em_andamento").length,
    completed,
    notes: noteCount,
    progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
  };
}
