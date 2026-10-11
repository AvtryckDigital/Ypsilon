import "server-only";
import { getEnv } from "./cf";

type Param = string | number | null;

async function prepare(sql: string, params: Param[]) {
  const { DB } = await getEnv();
  return DB.prepare(sql).bind(...params);
}

/** Hämtar alla rader. */
export async function all<T>(sql: string, ...params: Param[]): Promise<T[]> {
  const res = await (await prepare(sql, params)).all<T>();
  return res.results ?? [];
}

/** Hämtar första raden, eller null. */
export async function first<T>(sql: string, ...params: Param[]): Promise<T | null> {
  return (await (await prepare(sql, params)).first<T>()) ?? null;
}

/** Kör en ändring och returnerar id för en eventuell ny rad. */
export async function run(sql: string, ...params: Param[]) {
  const res = await (await prepare(sql, params)).run();
  return { lastId: Number(res.meta.last_row_id ?? 0), changes: Number(res.meta.changes ?? 0) };
}

/** Kör flera ändringar i en transaktion. */
export async function batch(statements: { sql: string; params?: Param[] }[]) {
  const { DB } = await getEnv();
  if (statements.length === 0) return;
  await DB.batch(statements.map((s) => DB.prepare(s.sql).bind(...(s.params ?? []))));
}
