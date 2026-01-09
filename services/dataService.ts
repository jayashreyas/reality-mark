
import { 
  Listing, Task, User, Contact, Offer, ListingStatus, OfferStatus, 
  Update, ContactType, UserRole, Deal, DealStatus, ChatChannel, ChatMessage,
  CalendarEvent, PropertyLookupResult, SmartImportRecord, SmartImportSummary,
  CrmData
} from '../types';

class DataService {
  private load<T>(key: string, seed: T): T {
    try {
      const stored = localStorage.getItem(`reality_mark_${key}`);
      return stored ? JSON.parse(stored) : seed;
    } catch (e) {
      console.error(`Error loading ${key}:`, e);
      return seed;
    }
  }

  private save(key: string, data: any) {
    try {
      localStorage.setItem(`reality_mark_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
    }
  }

  // --- Deals ---
  async getDeals(): Promise<Deal[]> { return this.load('deals', []); }
  async createDeal(deal: Partial<Deal>): Promise<Deal> {
    const all = await this.getDeals();
    const nd: Deal = { id: `d-${Date.now()}`, address: deal.address || 'Unknown', client_name: deal.client_name || 'TBD', price: deal.price || 0, status: deal.status || 'Active', transaction_type: deal.transaction_type || 'Sale', commission_rate: deal.commission_rate || 2.5, commission_amount: (deal.price || 0) * ((deal.commission_rate || 2.5) / 100), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...deal } as Deal;
    all.push(nd);
    this.save('deals', all);
    return nd;
  }
  async updateDeal(deal: Deal): Promise<Deal> {
    const all = await this.getDeals();
    const idx = all.findIndex(d => d.id === deal.id);
    if (idx !== -1) { deal.updatedAt = new Date().toISOString(); all[idx] = deal; this.save('deals', all); return deal; }
    throw new Error("Deal not found");
  }

  // --- Listings ---
  async getListings(): Promise<Listing[]> { return this.load('listings', []); }
  async createListing(listing: Partial<Listing>): Promise<Listing> {
    const all = await this.getListings();
    const nl: Listing = { 
      id: `l-${Date.now()}`, 
      address: listing.PropertyAddressFormatted || listing.address || 'Unnamed Listing', 
      status: listing.status || 'Active', 
      seller_name: listing.OwnerNames || listing.seller_name || 'Anonymous', 
      price: listing.price || Number(listing.SaleAmt) || 0, 
      commission_rate: listing.commission_rate || 2.5, 
      commission_amount: (listing.price || 0) * 0.025, 
      primaryAgentId: listing.primaryAgentId || 'u1', 
      primaryAgentName: listing.primaryAgentName || 'Agent', 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString(), 
      ...listing 
    } as Listing;
    all.push(nl);
    this.save('listings', all);
    return nl;
  }
  async updateListing(listing: Listing): Promise<Listing> {
    const all = await this.getListings();
    const idx = all.findIndex(l => l.id === listing.id);
    if (idx !== -1) { listing.updatedAt = new Date().toISOString(); all[idx] = listing; this.save('listings', all); return listing; }
    throw new Error("Listing not found");
  }

  // --- Offers ---
  async getOffers(): Promise<Offer[]> { return this.load('offers', []); }
  async createOffer(offer: Partial<Offer>): Promise<Offer> {
    const all = await this.getOffers();
    const no: Offer = { id: `o-${Date.now()}`, buyer_name: offer.buyer_name || 'Unnamed Buyer', property_address: offer.property_address || 'TBD', offer_price: offer.offer_price || 0, status: offer.status || 'Draft', financing_type: offer.financing_type || 'Conventional', created_at: new Date().toISOString(), ...offer } as Offer;
    all.push(no);
    this.save('offers', all);
    return no;
  }
  async getOffersByDeal(dealId: string): Promise<Offer[]> {
    const all = await this.getOffers();
    return all.filter(o => o.deal_id === dealId || o.listing_id === dealId);
  }
  async updateOffer(offer: Offer): Promise<Offer> {
    const all = await this.getOffers();
    const idx = all.findIndex(o => o.id === offer.id);
    if (idx !== -1) { all[idx] = offer; this.save('offers', all); return offer; }
    throw new Error("Offer not found");
  }
  async deleteOffer(id: string): Promise<void> {
    const all = await this.getOffers();
    this.save('offers', all.filter(d => d.id !== id));
  }
  async addOfferDocument(offerId: string, file: File): Promise<void> {
    const all = await this.getOffers();
    const idx = all.findIndex(o => o.id === offerId);
    if (idx !== -1) { const doc = { id: `doc-${Date.now()}`, name: file.name, url: URL.createObjectURL(file), uploadedAt: new Date().toISOString() }; all[idx].documents = [...(all[idx].documents || []), doc]; this.save('offers', all); }
  }

  // --- Contacts ---
  async getContacts(): Promise<Contact[]> { return this.load('contacts', [{ id: 'c1', name: 'Homer Simpson', email: 'homer@donuts.com', phone: '555-0101', type: 'Lead', isStarred: true }]); }
  async addContact(c: Partial<Contact>): Promise<Contact> {
    const cs = await this.getContacts();
    const nc = { id: `c-${Date.now()}`, isStarred: false, ...c } as Contact;
    cs.push(nc);
    this.save('contacts', cs);
    return nc;
  }
  async toggleStar(id: string) {
    const cs = await this.getContacts();
    const idx = cs.findIndex(x => x.id === id);
    if (idx !== -1) { cs[idx].isStarred = !cs[idx].isStarred; this.save('contacts', cs); }
  }

  // --- User & Team ---
  getUser(): User | null { 
    try {
      return JSON.parse(localStorage.getItem('reality_mark_user') || 'null'); 
    } catch (e) {
      return null;
    }
  }
  login(email: string) { const user = { id: 'u1', displayName: 'Admin User', initials: 'AU', role: 'admin' as UserRole, email }; localStorage.setItem('reality_mark_user', JSON.stringify(user)); return user; }
  logout() { localStorage.removeItem('reality_mark_user'); }
  updateUser(user: User) { localStorage.setItem('reality_mark_user', JSON.stringify(user)); }
  getTeamMembers(): User[] { return this.load('team_members', [{ id: 'u1', displayName: 'Admin User', initials: 'AU', role: 'admin', email: 'admin@reality.com' }]); }
  addTeamMember(member: User): User[] { const all = this.getTeamMembers(); all.push(member); this.save('team_members', all); return all; }
  deleteTeamMember(id: string): User[] { const all = this.getTeamMembers().filter(m => m.id !== id); this.save('team_members', all); return all; }

  // --- Tasks ---
  async getTasks(): Promise<Task[]> { return this.load('tasks', []); }
  async createTask(task: Partial<Task>): Promise<Task> {
    const all = await this.getTasks();
    const nt = { id: `t-${Date.now()}`, createdAt: new Date().toISOString(), status: 'To Do', priority: 'Normal', ...task } as Task;
    all.push(nt);
    this.save('tasks', all);
    return nt;
  }
  async updateTask(task: Task): Promise<Task> {
    const all = await this.getTasks();
    const idx = all.findIndex(t => t.id === task.id);
    if (idx !== -1) { all[idx] = task; this.save('tasks', all); return task; }
    throw new Error("Task not found");
  }
  async deleteTask(id: string): Promise<void> {
    const all = await this.getTasks();
    this.save('tasks', all.filter(t => t.id !== id));
  }

  // --- Helpers ---
  async getGoogleEvents(): Promise<CalendarEvent[]> { return [{ id: 'e1', title: 'Listing Presentation', start: new Date().toISOString(), end: new Date(Date.now() + 3600000).toISOString() }]; }
  async getChannels(): Promise<ChatChannel[]> { return this.load('channels', [{ id: 'general', name: 'general', createdAt: new Date().toISOString() }]); }
  async createChannel(name: string): Promise<ChatChannel> { const all = await this.getChannels(); const nc = { id: `ch-${Date.now()}`, name, createdAt: new Date().toISOString() }; all.push(nc); this.save('channels', all); return nc; }
  async getMessages(channelId: string): Promise<ChatMessage[]> { return this.load(`messages_${channelId}`, []); }
  async sendMessage(msg: Partial<ChatMessage>): Promise<ChatMessage> { const key = `messages_${msg.channelId}`; const all = this.load(key, []); const nm = { id: `m-${Date.now()}`, timestamp: new Date().toISOString(), ...msg } as ChatMessage; all.push(nm); this.save(key, all); return nm; }
  async clearMessages(channelId: string): Promise<void> { this.save(`messages_${channelId}`, []); }

  async getCRMDataSnapshot(): Promise<CrmData> { return { listings: await this.getListings(), offers: await this.getOffers(), contacts: await this.getContacts(), tasks: await this.getTasks(), deals: await this.getDeals(), teamMembers: this.getTeamMembers(), user: this.getUser() || { id: 'u1', displayName: 'Admin User', initials: 'AU', role: 'admin' as UserRole } }; }

  async processSmartImport(records: SmartImportRecord[]): Promise<SmartImportSummary> {
    const summary = { listings: 0, offers: 0, contacts: 0, tasks: 0 };
    for (const rec of records) {
      if (rec.record_type === 'Listing') {
        await this.createListing(rec.data);
        summary.listings++;
      } else if (rec.record_type === 'Offer') {
        await this.createOffer(rec.data);
        summary.offers++;
      } else if (rec.record_type === 'Contact') {
        await this.addContact({ name: rec.data.full_name, email: rec.data.email, phone: rec.data.phone, type: rec.data.contact_type || 'Buyer' });
        summary.contacts++;
      } else if (rec.record_type === 'Task') {
        await this.createTask({ title: rec.data.title || 'Imported Task', dueDate: rec.data.due_date || new Date().toISOString() });
        summary.tasks++;
      }
    }
    return summary;
  }

  async lookupProperty(query: { address: string, lat: number, lng: number }): Promise<PropertyLookupResult> { return { address: query.address, city: 'Springfield', state: 'IL', zip: '62704', owner_name: 'John Seller', property_type: 'Single Family', year_built: 1995, estimated_value: 450000, confidence_score: 0.95, api_source: 'Zillow/MLS', beds: 3, baths: 2, raw_response: { internal_id: 'prop_123' } }; }
  async getOfferUpdates(id: string): Promise<Update[]> { return this.load(`offer_updates_${id}`, []); }
  async getListingUpdates(id: string): Promise<Update[]> { return this.load(`listing_updates_${id}`, []); }
  async addUpdate(u: Partial<Update>): Promise<Update> { const key = u.offerId ? `offer_updates_${u.offerId}` : `listing_updates_${u.listingId}`; const all = this.load(key, []); const nu = { id: `up-${Date.now()}`, timestamp: new Date().toISOString(), ...u } as Update; all.push(nu); this.save(key, all); return nu; }
  async updateDealStatus(deal: Deal, status: DealStatus): Promise<Deal> { return this.updateDeal({ ...deal, status }); }
  async updateDealAISummary(id: string, aiSummary: Deal['ai_summary']): Promise<void> { const all = await this.getDeals(); const idx = all.findIndex(d => d.id === id); if (idx !== -1) { all[idx].ai_summary = aiSummary; this.save('deals', all); } }
  async deleteDeal(id: string): Promise<void> { const all = await this.getDeals(); this.save('deals', all.filter(d => d.id !== id)); }
}

export const dataService = new DataService();
