const dateCourte = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const dateLongue = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const nombre = new Intl.NumberFormat("fr-FR");

/** Les dates métier sont des jours calendaires (YYYY-MM-DD) : formatées en UTC pour ne pas glisser. */
function enDate(valeur: string | Date) {
  return typeof valeur === "string"
    ? new Date(`${valeur.slice(0, 10)}T00:00:00Z`)
    : valeur;
}

export function formaterDateCourte(valeur: string | Date | null) {
  return valeur ? dateCourte.format(enDate(valeur)) : "—";
}

export function formaterDate(valeur: string | Date | null) {
  return valeur ? dateLongue.format(enDate(valeur)) : "—";
}

export function formaterNombre(valeur: number) {
  return nombre.format(Math.round(valeur));
}
