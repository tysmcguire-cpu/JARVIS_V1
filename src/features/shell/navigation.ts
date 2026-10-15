export const navigation = [
  { slug: "dashboard", label: "Dashboard", group: "Overview" },
  { slug: "finances", label: "Finances", group: "Workspace" },
  { slug: "education", label: "Education", group: "Workspace" },
  { slug: "calendar", label: "Calendar", group: "Workspace" },
  { slug: "career", label: "Career", group: "Workspace" },
  { slug: "projects", label: "Projects", group: "Workspace" },
  { slug: "goals", label: "Goals", group: "Workspace" },
  { slug: "notes", label: "Notes", group: "Workspace" },
  { slug: "assistant", label: "AI Assistant", group: "System" },
  { slug: "notifications", label: "Notifications", group: "System" },
  { slug: "settings", label: "Settings", group: "System" }
] as const;
export type ModuleSlug = typeof navigation[number]["slug"];
export function findModule(slug: string) { return navigation.find(item => item.slug === slug); }
