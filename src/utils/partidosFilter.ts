export function filterPartidos(
  partidos: any[],
  tournamentIds: (number | "*")[],
  dia: string
) {
  let filtered = partidos;


  // superadmin or full access
  if (!tournamentIds.includes("*")) {
    filtered = filtered.filter(p =>
      tournamentIds.includes(p.torneoId)
    );
  }

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

