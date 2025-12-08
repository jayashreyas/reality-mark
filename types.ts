
export type DealType = 'Sale' | 'Rental';
export type DealStatus = 'Lead' | 'Active' | 'Under Contract' | 'Closed' | 'Lost';
export type TaskStatus = 'To Do' | 'In Progress' | 'Waiting' | 'Completed';
export type TaskPriority = 'High' | 'Normal' | 'Low';
export type UpdateTag = 'Note' | 'Call' | 'Email' | 'Document' | 'Meeting';
export type UserRole = 'admin' | 'agent';
export type GoogleCalendarStatus = 'disconnected' | 'connecting' | 'connected';

export interface User {
  id: string;
  displayName: string;
  initials: string;
  role: UserRole;
  email?: string;
}

export interface Deal {
  id: string;
  clientName: string;
  address: string;
  type: DealType;
  status: DealStatus;
  primaryAgentId: string;
  primaryAgentName: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  notes?: string;
}

export interface Task {
  id: string;
  dealId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToName: string;
  dueDate: string; // ISO String
  createdAt: string;
}

export interface Update {
  id: string;
  dealId: string;
  content: string;
  tag: UpdateTag;
  userId: string;
  userName: string;
  timestamp: string; // ISO String
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  source?: 'google';
}

export interface AppState {
  currentUser: User;
  view: 'dashboard' | 'deals' | 'mytasks' | 'calendar' | 'deal-room' | 'team';
  selectedDealId: string | null;
}