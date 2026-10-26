import type { TopCategory, TopPlace, TopRanking } from '../types';

export type RankedPlace = {
  place: TopPlace;
  // Puesto que se muestra (1, 2, 3…). Los empates comparten puesto ("1, 1, 3").
  // 0 si nadie lo ordenó todavía en lo que se está mirando.
  rank: number;
  // Suma de puestos: menos puntos = más arriba. No se le muestra al usuario.
  points: number;
};

// Puntos que le da una persona a cada lugar en una categoría: el 1º suma 1,
// el 2º suma 2… Si ordenó la categoría pero le falta algún lugar (por ejemplo,
// uno que se sumó después), ese lugar queda último, para que no salga
// beneficiado por no haber sido evaluado. Si no ordenó nada, no cuenta.
function pointsFromRanking(ranking: TopRanking | undefined, placeIds: Set<string>): Map<string, number> | null {
  if (!ranking) return null;
  const ordered: string[] = [];
  for (const id of ranking.placeIds) {
    if (placeIds.has(id) && !ordered.includes(id)) ordered.push(id);
  }
  if (ordered.length === 0) return null;

  const points = new Map<string, number>();
  ordered.forEach((id, index) => points.set(id, index + 1));
  const last = ordered.length + 1;
  placeIds.forEach((id) => {
    if (!points.has(id)) points.set(id, last);
  });
  return points;
}

export function computeTopRanking(
  places: TopPlace[],
  categories: TopCategory[],
  rankings: TopRanking[],
  filter: { categoryId?: string; userId?: string }
): RankedPlace[] {
  const placeIds = new Set(places.map((p) => p.id));
  const categoryIds = filter.categoryId ? [filter.categoryId] : categories.map((c) => c.id);
  const userIds = filter.userId
    ? [filter.userId]
    : Array.from(new Set(rankings.map((r) => r.userId)));

  const totals = new Map<string, number>();
  let anyRanking = false;
  for (const categoryId of categoryIds) {
    for (const userId of userIds) {
      const ranking = rankings.find((r) => r.categoryId === categoryId && r.userId === userId);
      const points = pointsFromRanking(ranking, placeIds);
      if (!points) continue;
      anyRanking = true;
      points.forEach((value, id) => totals.set(id, (totals.get(id) ?? 0) + value));
    }
  }

  const sorted = [...places].sort((a, b) => {
    const pa = totals.get(a.id);
    const pb = totals.get(b.id);
    if (pa !== undefined && pb !== undefined && pa !== pb) return pa - pb;
    if (pa === undefined && pb !== undefined) return 1;
    if (pb === undefined && pa !== undefined) return -1;
    return a.name.localeCompare(b.name, 'es');
  });

  let previousPoints: number | undefined;
  let previousRank = 0;
  return sorted.map((place, index) => {
    const points = totals.get(place.id);
    if (!anyRanking || points === undefined) return { place, rank: 0, points: 0 };
    const rank = points === previousPoints ? previousRank : index + 1;
    previousPoints = points;
    previousRank = rank;
    return { place, rank, points };
  });
}

// Orden con el que arranca el editor: el que la persona ya guardó, y al final
// los lugares que todavía no había ordenado.
export function initialOrder(places: TopPlace[], ranking: TopRanking | undefined): string[] {
  const placeIds = places.map((p) => p.id);
  const saved = (ranking?.placeIds ?? []).filter((id, i, arr) => placeIds.includes(id) && arr.indexOf(id) === i);
  return [...saved, ...placeIds.filter((id) => !saved.includes(id))];
}
