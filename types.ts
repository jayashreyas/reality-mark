
export type DealType = 'Sale' | 'Rental';
export type DealStatus = 'Lead' | 'Active' | 'Under Contract' | 'Closed' | 'Lost';
export type TaskStatus = 'To Do' | 'In Progress' | 'Waiting' | 'Completed';
export type TaskPriority = 'High' | 'Normal' | 'Low';
export type UpdateTag = 'Note' | 'Call' | 'Email' | 'Document' | 'Meeting' | 'WhatsApp';
export type UserRole = 'admin' | 'agent';
export type GoogleCalendarStatus = 'disconnected' | 'connecting' | 'connected';
export type ContactType = 'Buyer' | 'Seller' | 'Lead' | 'Vendor' | 'Other';
export type OfferStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Countered' | 'Withdrawn';

export interface User {
  id: string;
  displayName: string;
  initials: string;
  role: UserRole;
  email?: string;
  phone?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: ContactType;
  notes?: string;
  lastContacted?: string;
}

export interface DealDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'google-doc' | 'google-sheet' | 'google-slide' | 'other';
  url: string;
  uploadedAt: string;
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
  
  // Financials
  price: number;
  commissionRate: number; // Percentage (e.g. 2.5)

  // Documents
  documents: DealDocument[];
}

export interface Offer {
  id: string;
  dealId?: string; // Optional now, offers can be standalone
  status: OfferStatus;
  submittedDate: string; // ISO String
  notes?: string;
  documents: DealDocument[];

  // Property Details
  propertyAddress: string;

  // Buyer Details
  clientName: string; // Primary Buyer
  coBuyerName?: string;
  buyerEmail?: string;
  coBuyerEmail?: string;
  buyerAddress?: string;

  // Financial Terms
  amount: number; // Offer Price
  earnestMoneyPercent?: number; // EMD in %
  loanType?: 'Cash' | 'Conventional' | 'FHA' | 'VA' | 'Other';
}

export interface Task {
  id: string;
  dealId?: string; // Optional
  offerId?: string; // Optional, for Offer-specific tasks
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToName: string;
  dueDate: string; // ISO String
  createdAt: string;
}

export interface Update {
  id: string;
  dealId?: string;
  offerId?: string; // Added for Offer-specific updates
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

export interface ChatChannel {
  id: string;
  name: string;
  type: 'public' | 'private';
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userInitials: string;
  content: string;
  timestamp: string;
}

export interface Reminder {
  id: string;
  userId: string;
  content: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  linkTo?: string; // e.g. 'deals' or 'tasks'
}

export interface CrmData {
  deals: Deal[];
  tasks: Task[];
  offers: Offer[];
  contacts: Contact[];
  teamMembers: User[];
  user: User;
}

export interface AppState {
  currentUser: User | null;
  view: 'dashboard' | 'deals' | 'offers' | 'mytasks' | 'calendar' | 'deal-room' | 'team' | 'messages' | 'contacts' | 'profile';
  selectedDealId: string | null;
}