// src/types/index.ts

export type UserRole = "ADMIN" | "WAITER";
export type TableStatus = "COLLECTING" | "QUORUM_MET" | "DISPATCHED";
export type OrderStatus = "PENDING" | "DISPATCHED" | "SERVED";
export type NotificationType = "LOW_STOCK" | "SOLD_OUT" | "DISPATCHED" | "NEW_ORDER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
  quantity: number;
  isAvailable: boolean;
}

export interface DinnerTable {
  id: string;
  tableNumber: number;
  capacity: number;
  orderedCount: number;
  status: TableStatus;
  quorumMetAt?: string;
  dispatchedAt?: string;
  waiterId?: string;
  assignedWaiter?: User;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
}

export interface Order {
  id: string;
  studentName: string;
  tableId: string;
  tableNumber: number;
  status: OrderStatus;
  specialNotes?: string;
  items: OrderItem[];
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface TableSummary {
  [itemName: string]: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
