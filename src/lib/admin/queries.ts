import "server-only";
import { all, first } from "../db";
import type { Entity } from "./entities";

export type AdminRow = Record<string, string | number | null>;

const PER_PAGE = 50;

function selectFor(entity: Entity) {
  if (entity.table === "albums") {
    return `SELECT a.*,
      (SELECT COUNT(*) FROM album_images i WHERE i.album_id = a.id) AS image_count,
      COALESCE(a.cover, (SELECT thumb FROM album_images i WHERE i.album_id = a.id ORDER BY sort_order, id LIMIT 1)) AS cover_or_first
      FROM albums a`;
  }
  return `SELECT * FROM ${entity.table}`;
}

export async function listRows(entity: Entity, q: string, page: number) {
  const where: string[] = [];
  const params: string[] = [];
  if (q && entity.search?.length) {
    where.push(`(${entity.search.map((c) => `${c} LIKE ?`).join(" OR ")})`);
    for (let i = 0; i < entity.search.length; i++) params.push(`%${q}%`);
  }
  const whereSql = where.length ? ` WHERE ${where.join(" AND ")}` : "";
  const total = (await first<{ n: number }>(`SELECT COUNT(*) AS n FROM ${entity.table}${whereSql}`, ...params))?.n ?? 0;
  const rows = await all<AdminRow>(
    `${selectFor(entity)}${whereSql} ORDER BY ${entity.orderBy} LIMIT ${PER_PAGE} OFFSET ${(page - 1) * PER_PAGE}`,
    ...params,
  );
  return { rows, total, pages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}

export async function getRow(entity: Entity, id: number) {
  return first<AdminRow>(`SELECT * FROM ${entity.table} WHERE id = ?`, id);
}

/** Befintliga värden i en kolumn, används som förslag i formulär (t.ex. kategorier). */
export async function distinctValues(entity: Entity, column: string) {
  const rows = await all<{ v: string }>(
    `SELECT DISTINCT ${column} AS v FROM ${entity.table} WHERE ${column} IS NOT NULL AND ${column} != '' ORDER BY v`,
  );
  return rows.map((r) => r.v);
}

export async function suggestionsFor(entity: Entity) {
  const out: Record<string, string[]> = {};
  for (const f of entity.fields) {
    if (f.suggestionsFrom) out[f.suggestionsFrom] = await distinctValues(entity, f.suggestionsFrom);
  }
  return out;
}
