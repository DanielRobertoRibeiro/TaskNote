import { describe, expect, it } from "vitest";

import type { Task } from "../types";
import { calculateStats, filterTasks } from "./task-utils";

const tasks: Task[] = [
  {
    id: "1",
    title: "Preparar apresentação",
    description: "Revisar métricas",
    status: "em_andamento",
    priority: "alta",
    due_at: new Date().toISOString(),
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: [{ id: "tag-1", name: "Trabalho" }],
  },
  {
    id: "2",
    title: "Comprar café",
    description: null,
    status: "concluida",
    priority: "baixa",
    due_at: null,
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: [],
  },
];

describe("task utils", () => {
  it("combina busca, status e prioridade", () => {
    const result = filterTasks(tasks, {
      query: "métricas",
      status: "em_andamento",
      priority: "alta",
    });
    expect(result.map((task) => task.id)).toEqual(["1"]);
  });

  it("calcula os indicadores do dashboard", () => {
    expect(calculateStats(tasks, 3)).toEqual({
      today: 1,
      inProgress: 1,
      completed: 1,
      notes: 3,
      progress: 50,
    });
  });
});
