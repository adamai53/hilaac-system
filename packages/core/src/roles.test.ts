import { describe, expect, it } from "vitest";
import { espaceDuRole, ROLES_CLIENT, ROLES_EQUIPE } from "./roles";

describe("espaceDuRole", () => {
  it.each(ROLES_EQUIPE)("%s → espace équipe", (role) => {
    expect(espaceDuRole(role)).toBe("equipe");
  });

  it.each(ROLES_CLIENT)("%s → espace client", (role) => {
    expect(espaceDuRole(role)).toBe("client");
  });
});
