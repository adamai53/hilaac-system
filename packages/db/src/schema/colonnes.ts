import { timestamp } from "drizzle-orm/pg-core";

export const horodatage = {
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
  misAJourLe: timestamp("mis_a_jour_le", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
