// src/types/index.ts

export type TableStatus = "COLLECTING" | "QUORUM_MET" | "DISPATCHED";
export type OrderStatus = "PENDING" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
export type BatchType = "QUORUM" | "RESIDUAL" | "MANUAL";
export type BatchStatus = "DISPATCHED" | "DELIVERED";
export type AdminRole = "ADMIN" | "WAITER";
export type NotificationType = "LOW_STOCK" | "SOLD_OUT" | "BATCH_READY" | "BATCH_DELIVERED";
export type AuthUser = AdminUser;
export type Course = "STARTER" | "MAIN" | "DESSERT";

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  quantity: number;
  quantityReserved: number;
  quantityRemaining: number;
  isAvailable: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface DinnerTable {
  id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  dispatchedAt?: string;
  residualDeadline?: string;
  orderedCount: number;
  pendingCount: number;
  quorumMetAt?: string;
  orders?: Order[];
  batches?: Batch[];
}

export interface Order {
  id: string;
  tableId: string;
  menuItemId: string;
  studentName: string;
  status: OrderStatus;
  batchId?: string;
  orderedAt: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  menuItem?: MenuItem;
  table?: DinnerTable;
}

export interface BatchSummaryItem {
  item: string;
  count: number;
  menuItemId: string;
}

export interface Batch {
  id: string;
  tableId: string;
  type: BatchType;
  status: BatchStatus;
  assignedWaiter?: string;
  summary: BatchSummaryItem[];
  dispatchedAt: string;
  deliveredAt?: string;
  orders?: Order[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  menuItemId?: string;
  batchId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface OrderSubmitPayload {
  studentName: string;
  tableNumber: number;
  menuItemId: string;
}

export interface OrderSubmitResponse {
  orderId: string;
  studentName: string;
  tableNumber: number;
  item: string;
  status: OrderStatus;
  message: string;
}

export interface DispatchPayload {
  assignedWaiter?: string;
}

// ─── BBQ Types ────────────────────────────────────────────────────────────────

export type BbqItemCategory = "COMPULSORY" | "PROTEIN" | "STARCH";

export interface BbqMenuItem {
  id: string;
  name: string;
  description?: string;
  category: BbqItemCategory;
  quantity: number;
  quantityReserved: number;
  quantityRemaining: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BbqOrder {
  id: string;
  studentName: string;
  department: string;
  proteinChoiceId: string;
  starchChoiceId: string;
  confirmedItems: string[]; // array of compulsory item IDs
  orderedAt: string;
  proteinChoice?: BbqMenuItem;
  starchChoice?: BbqMenuItem;
}

export interface BbqOrderSubmitPayload {
  studentName: string;
  department: string;
  proteinChoiceId: string;
  starchChoiceId: string;
  confirmedItems: string[];
}

export interface BbqOrderSubmitResponse {
  orderId: string;
  studentName: string;
  department: string;
  protein: string;
  starch: string;
  confirmedItems: string[];
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface DispatchResponse {
  batchId: string;
  tableNumber: number;
  type: BatchType;
  summary: BatchSummaryItem[];
  assignedWaiter?: string;
}
