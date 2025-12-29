export function filterPartidos(
  partidos: any[],
  role: string,
  dia: string
) {
  let filtered = partidos;

  if (role === 'pro') filtered = filtered.filter(p => [47, 39].includes(p.torneoId));
  if (role === 'ed') filtered = filtered.filter(p => [42].includes(p.torneoId));

  return filtered
    .filter(p => p.dia === dia)
    .map(p => ({
      ...p,
      g1: p.g1 ?? null,
      g2: p.g2 ?? null,
      desempate: p.desempate ?? '',
      editando: false,
    }));
}
