
export type ListingStatus = 'Coming Soon' | 'Active' | 'Under Contract' | 'Sold' | 'Expired';
export type OfferStatus = 'Draft' | 'Submitted' | 'Countered' | 'Accepted' | 'Lost' | 'Withdrawn' | 'Rejected';
export type DealStatus = 'Lead' | 'Active' | 'Under Contract' | 'Pending' | 'Closed';
export type TaskStatus = 'To Do' | 'In Progress' | 'Waiting' | 'Completed';
export type TaskPriority = 'High' | 'Normal' | 'Low';
export type UpdateTag = 'Note' | 'Call' | 'Email' | 'Document' | 'Meeting' | 'WhatsApp';
export type UserRole = 'admin' | 'agent';
export type ContactType = 'Lead' | 'Buyer' | 'Seller' | 'Vendor' | 'Other';
export type FinancingType = 'Cash' | 'Conventional' | 'FHA' | 'VA' | 'Other';

export interface User {
  id: string;
  displayName: string;
  initials: string;
  role: UserRole;
  email?: string;
  phone?: string;
}

export interface Listing {
  id: string;
  // --- Professional Data Schema (Exact Match) ---
  MLSNumber?: string;
  PropertyAddressFormatted: string;
  PropertyCityState?: string;
  Zipcode?: string;
  Zip4?: string;
  CarrierRoute?: string;
  PropDoNotMail?: string;
  OwnerNames?: string;
  OwnerLastName?: string;
  OwnerFirstName?: string;
  Owner2LastName?: string;
  Owner2FirstName?: string;
  Owner3LastName?: string;
  Owner3FirstName?: string;
  Owner4LastName?: string;
  Owner4FirstName?: string;
  OwnerCareOf?: string;
  OwnerAddress?: string;
  OwnerCityState?: string;
  OwnerZipCode?: string;
  OwnerZip4?: string;
  OwnerCarrierRoute?: string;
  OwnerDoNotMail?: string;
  OwnerOccupied?: string;
  Municipality?: string;
  SubdivisionNeighborhood?: string;
  TaxID?: string;
  TaxIDAlt?: string;
  TaxMap?: string;
  Block?: string;
  Lot?: string;
  QualCode?: string;
  SchoolDistrict?: string;
  CensusTractBlock?: string;
  TaxYear?: string;
  AnnualTax?: number | string;
  CountyTax?: number | string;
  MunicipalTax?: number | string;
  SchoolTax?: number | string;
  TotalLandAsmt?: number | string;
  TotalBldgAsmt?: number | string;
  TaxableTotalAsmt?: number | string;
  DeedRecordDate?: string;
  SettleDate?: string;
  SaleAmt?: number | string;
  SaleType?: string;
  PropertyClass?: string;
  CondoYN?: string;
  LandUse?: string;
  LotFrontage?: string;
  LotDepth?: string;
  LotSqFt?: number | string;
  LotAcres?: number | string;
  LotShape?: string;
  Zoning?: string;
  CountyLandDesc?: string;
  BldgSqFtTotal?: number | string;
  Stories?: string;
  Bedrooms?: number | string;
  Exterior?: string;
  BsmtDesc?: string;
  FireplaceTotal?: number | string;
  GrgType?: string;
  PoolType?: string;
  HeatDelivery?: string;
  YearBuilt?: number | string;
  YearRemod?: number | string;
  CountyBldgDesc?: string;

  // --- Pipeline System Fields ---
  status: ListingStatus;
  price: number;
  seller_name: string;
  address: string; // Legacy fallback
  commission_rate: number;
  commission_amount: number;
  notes?: string;
  primaryAgentId: string;
  primaryAgentName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  address: string;
  client_name: string;
  price: number;
  status: DealStatus;
  transaction_type: 'Sale' | 'Purchase' | 'Lease';
  commission_rate: number;
  commission_amount: number;
  notes?: string;
  listed_date?: string;
  settlement_date?: string;
  createdAt: string;
  updatedAt: string;
  property_type?: string;
  beds?: number;
  baths?: number;
  city?: string;
  state?: string;
  zip?: string;
  ai_summary?: {
    ownership_insights: string;
    market_positioning: string;
    negotiation_risks: string;
    investment_score: number;
    raw_text: string;
  };
  raw_data?: any;
}

export interface Offer {
  id: string;
  listing_id?: string;
  deal_id?: string;
  buyer_name: string;
  buyer_email?: string;
  property_address: string;
  offer_price: number;
  earnest_money: number;
  down_payment: number;
  financing_type: FinancingType;
  contingencies?: string;
  closing_date?: string;
  status: OfferStatus;
  agent_notes?: string;
  created_at: string;
  documents?: DealDocument[];
  clientName?: string;
  propertyAddress?: string;
  amount?: number;
  notes?: string;
  submitted_at?: string;
  submittedDate?: string;
  coBuyerName?: string;
  coBuyerEmail?: string;
  buyerAddress?: string;
  earnestMoneyPercent?: number;
  loanType?: FinancingType;
}

export interface Task { 
  id: string; 
  listingId?: string; 
  offerId?: string; 
  dealId?: string;
  title: string; 
  status: TaskStatus; 
  priority: TaskPriority; 
  assignedToName: string; 
  dueDate: string; 
  createdAt: string; 
}

export interface Contact { id: string; name: string; email: string; phone: string; type: ContactType; notes?: string; lastContacted?: string; isStarred?: boolean; }
export interface Update { id: string; offerId?: string; listingId?: string; content: string; tag: UpdateTag; userId: string; userName: string; timestamp: string; }
export interface DealDocument { id: string; name: string; url: string; uploadedAt: string; }

export interface ChatMessage { id: string; channelId: string; userId: string; userName: string; userInitials: string; content: string; timestamp: string; }
export interface ChatChannel { id: string; name: string; createdAt: string; }
export interface CalendarEvent { id: string; title: string; start: string; end: string; }
export type GoogleCalendarStatus = 'disconnected' | 'connecting' | 'connected';
export interface Reminder { id: string; title: string; date: string; }

export interface PropertyLookupResult {
  address: string;
  city: string;
  state: string;
  zip: string;
  owner_name?: string;
  property_type?: string;
  year_built?: number;
  last_sale_price?: number;
  last_sale_date?: string;
  estimated_value?: number;
  confidence_score?: number;
  parcel_id?: string;
  api_source?: string;
  beds?: number;
  baths?: number;
  raw_response?: any;
}

export interface SmartImportRecord {
  record_type: 'Listing' | 'Offer' | 'Contact' | 'Task';
  data: any;
}

export interface SmartImportSummary {
  listings: number;
  offers: number;
  contacts: number;
  tasks: number;
}

export interface AppState { currentUser: User | null; view: 'dashboard' | 'listings' | 'offers' | 'mytasks' | 'calendar' | 'team' | 'messages' | 'contacts' | 'profile' | 'deals'; selectedId: string | null; }
export interface CrmData { listings: Listing[]; tasks: Task[]; offers: Offer[]; contacts: Contact[]; teamMembers: User[]; user: User; deals: Deal[]; }
