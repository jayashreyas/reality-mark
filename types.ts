
export type DealType = 'Sale' | 'Rental';
export type DealStatus = 'Active' | 'Under Contract' | 'Pending' | 'Closed' | 'Cancelled' | 'Lead' | 'Lost';
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
  type: 'contract' | 'inspection' | 'closing' | 'other';
  url: string;
  uploadedAt: string;
}

export interface Deal {
  id: string;
  mlsNumber?: string;
  property_address: string;
  city?: string;
  state?: string;
  zip?: string;
  property_type?: string;
  beds?: number;
  baths?: number;
  lot_size?: string;
  year_built?: number;
  owner_name?: string;
  price: number;
  status: DealStatus;
  
  // Coordinates
  latitude?: number;
  longitude?: number;

  // Dates
  contract_date?: string;   // ISO String (YYYY-MM-DD)
  settlement_date?: string; // ISO String (YYYY-MM-DD)
  createdAt: string;
  updatedAt: string;

  // Financials
  commission_percent: number; 
  commission_amount: number;

  // Relations
  primaryAgentId: string;
  primaryAgentName: string;
  clientName: string;
  type: DealType;
  notes?: string;
  documents: DealDocument[];
  
  // AI Insights
  ai_summary?: {
    ownership_insights: string;
    market_positioning: string;
    negotiation_risks: string;
    investment_score: number;
    raw_text: string;
  };

  // Full Record Data
  raw_data?: {
    source: string;
    parcel_id?: string;
    confidence_score: number;
    api_response: any;
  };
}

export interface PropertyLookupResult {
  address: string;
  city: string;
  state: string;
  zip: string;
  property_type: string;
  beds: number;
  baths: number;
  lot_size: string;
  year_built: number;
  owner_name: string;
  last_sale_price: number;
  last_sale_date: string;
  estimated_value: number;
  parcel_id?: string;
  latitude: number;
  longitude: number;
  confidence_score: number;
  api_source: string;
  raw_response: any;
}

export interface Offer {
  id: string;
  dealId?: string; 
  propertyAddress: string;
  status: OfferStatus;
  submittedDate: string;
  notes?: string;
  clientName: string;
  amount: number;
  documents: any[];
  coBuyerName?: string;
  buyerEmail?: string;
  coBuyerEmail?: string;
  buyerAddress?: string;
  earnestMoneyPercent?: number;
  loanType?: 'Conventional' | 'FHA' | 'VA' | 'Cash' | 'Other';
}

export interface Task {
  id: string;
  dealId?: string;
  offerId?: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToName: string;
  dueDate: string;
  createdAt: string;
}

export interface Update {
  id: string;
  dealId?: string;
  offerId?: string;
  content: string;
  tag: UpdateTag;
  userId: string;
  userName: string;
  timestamp: string;
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
  linkTo?: string; 
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
  view: 'dashboard' | 'deals' | 'offers' | 'mytasks' | 'calendar' | 'team' | 'messages' | 'contacts' | 'profile';
  selectedDealId: string | null;
}

export interface SmartImportRecord {
  record_type: 'ClosedDeal' | 'ActiveDeal' | 'Lead' | 'Contact';
  data: {
    full_name: string;
    address: string | null;
    city: string | null;
    zip: string | null;
    property_type: string | null;
    bedrooms: number | null;
    sale_price: number | null;
    status: string | null;
    transaction_date: string | null;
    settlement_date?: string | null;
    contract_date?: string | null;
    notes: string;
  };
}

export interface SmartImportSummary {
  deals: number;
  leads: number;
  contacts: number;
}
