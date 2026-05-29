// src/lib/api.ts

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pau_dinner_token");
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(data.error || "An unexpected error occurred.");
  }

  return data as T;
}

export const authAPI = {
  register: (body: { name: string; email: string; password: string; role?: string; inviteCode?: string }) =>
    apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
};

export const courseAPI = {
  getActive: () => apiFetch<{ success: boolean; openCourses: string[] }>("/api/course"),
  setActive: (openCourses: string[]) =>
    apiFetch("/api/course", { method: "POST", body: JSON.stringify({ openCourses }) }, true),
};

export const menuAPI = {
  getAll: (course?: string) =>
    apiFetch<{ success: boolean; menu: unknown[]; grouped: Record<string, unknown[]> }>(
      course ? `/api/menu?course=${course}` : "/api/menu"
    ),
  create: (body: unknown) =>
    apiFetch("/api/menu", { method: "POST", body: JSON.stringify(body) }, true),
  update: (id: string, body: unknown) =>
    apiFetch(`/api/menu/${id}`, { method: "PATCH", body: JSON.stringify(body) }, true),
  delete: (id: string) =>
    apiFetch(`/api/menu/${id}`, { method: "DELETE" }, true),
};

export const ordersAPI = {
  place: (body: { studentName: string; tableNumber: number; items: { menuItemId: string; variant?: string | null }[]; specialNotes?: string }) =>
    apiFetch("/api/orders", { method: "POST", body: JSON.stringify(body) }),
  getByTable: (tableNumber: number, course?: string) =>
    apiFetch(`/api/orders?tableNumber=${tableNumber}${course ? `&course=${course}` : ""}`, {}, true),
};

export const tablesAPI = {
  getAll: () => apiFetch("/api/tables", {}, true),
};

export const adminAPI = {
  dispatch: (tableNumber: number, waiterId?: string) =>
    apiFetch("/api/admin/dispatch", { method: "POST", body: JSON.stringify({ tableNumber, waiterId }) }, true),

  getNotifications: (params?: { unreadOnly?: boolean; type?: string }) => {
    const qs = new URLSearchParams();
    if (params?.unreadOnly) qs.set("unreadOnly", "true");
    if (params?.type) qs.set("type", params.type);
    return apiFetch(`/api/admin/notifications?${qs.toString()}`, {}, true);
  },

  markNotificationRead: (id: string) =>
    apiFetch(`/api/admin/notifications/${id}`, { method: "PATCH" }, true),

  markAllNotificationsRead: () =>
    apiFetch("/api/admin/notifications/read-all", { method: "PATCH" }, true),

  getWaiters: () => apiFetch("/api/admin/waiters", {}, true),
};