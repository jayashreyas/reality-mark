
import { Deal, Task, Update, User, DealDocument, ChatMessage, Reminder, ChatChannel, Contact, Offer, Notification, CrmData, DealStatus, CalendarEvent, SmartImportRecord, SmartImportSummary, PropertyLookupResult } from '../types';

const SEED_TEAM_MEMBERS: User[] = [
  { id: 'u1', displayName: 'Shreyas', initials: 'S', role: 'admin', email: 'shreyas@realitymark.com', phone: '(555) 123-4567' },
  { id: 'u2', displayName: 'Sarah Sales', initials: 'SS', role: 'agent', email: 'sarah@realitymark.com', phone: '(555) 234-5678' },
];

const SEED_DEALS: Deal[] = [
  {
    id: 'd1',
    mlsNumber: 'MLS-230045',
    property_address: '124 Maple Ave',
    city: 'Springfield',
    state: 'PA',
    zip: '19064',
    property_type: 'Single Family',
    beds: 4,
    baths: 2.5,
    price: 550000,
    status: 'Active',
    commission_percent: 2.5,
    commission_amount: 13750,
    primaryAgentId: 'u1',
    primaryAgentName: 'Shreyas',
    clientName: 'Sarah Jenkins',
    type: 'Sale',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    documents: [],
    raw_data: { source: "Manual", confidence_score: 1.0, api_response: {} }
  }
];

class DataService {
  private load<T>(key: string, seed: T): T {
    try {
      const stored = localStorage.getItem(`reality_mark_${key}`);
      if (!stored) {
        localStorage.setItem(`reality_mark_${key}`, JSON.stringify(seed));
        return seed;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error(`Error loading key ${key}`, e);
      return seed;
    }
  }

  private save(key: string, data: any) {
    localStorage.setItem(`reality_mark_${key}`, JSON.stringify(data));
  }

  getUser(): User | null {
    const stored = localStorage.getItem('reality_mark_user');
    return stored ? JSON.parse(stored) : null;
  }

  login(email: string): User | null {
    const team = this.getTeamMembers();
    const user = team.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      localStorage.setItem('reality_mark_user', JSON.stringify(user));
      return user;
    }
    return null;
  }

  logout() {
    localStorage.removeItem('reality_mark_user');
  }

  getTeamMembers(): User[] {
    return this.load('team', SEED_TEAM_MEMBERS);
  }

  addTeamMember(member: User) {
    const team = this.getTeamMembers();
    team.push(member);
    this.save('team', team);
    return team;
  }

  deleteTeamMember(id: string) {
    let team = this.getTeamMembers();
    team = team.filter(u => u.id !== id);
    this.save('team', team);
    return team;
  }

  updateUser(user: User): User {
    let team = this.getTeamMembers();
    const index = team.findIndex(u => u.id === user.id);
    if (index !== -1) {
      team[index] = user;
      this.save('team', team);
      const currentUser = this.getUser();
      if (currentUser && currentUser.id === user.id) {
        localStorage.setItem('reality_mark_user', JSON.stringify(user));
      }
    }
    return user;
  }

  async getDeals(): Promise<Deal[]> {
    return this.load('deals', SEED_DEALS);
  }

  async createDeal(deal: Partial<Deal>): Promise<Deal> {
    const deals = await this.getDeals();
    const newDeal: Deal = { 
      id: `d${Date.now()}`,
      property_address: deal.property_address || 'Unnamed',
      city: deal.city || '',
      state: deal.state || '',
      zip: deal.zip || '',
      property_type: deal.property_type || '',
      beds: deal.beds || 0,
      baths: deal.baths || 0,
      lot_size: deal.lot_size || '',
      year_built: deal.year_built || 0,
      owner_name: deal.owner_name || '',
      price: deal.price || 0,
      status: deal.status || 'Active',
      commission_percent: deal.commission_percent || 2.5,
      commission_amount: (deal.price || 0) * ((deal.commission_percent || 2.5) / 100),
      primaryAgentId: deal.primaryAgentId || 'u1',
      primaryAgentName: deal.primaryAgentName || 'Admin',
      clientName: deal.clientName || deal.owner_name || 'Unnamed',
      type: deal.type || 'Sale',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [],
      raw_data: deal.raw_data,
      latitude: deal.latitude,
      longitude: deal.longitude,
      ai_summary: deal.ai_summary
    };
    deals.push(newDeal);
    this.save('deals', deals);
    return newDeal;
  }

  async lookupProperty(params: { address: string, lat: number, lng: number }): Promise<PropertyLookupResult> {
    // SIMULATED EXTERNAL API CALL (e.g. to Estated)
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    // In a real app, this route would be /api/property/lookup
    const isMockMatch = params.address.toLowerCase().includes('pennsylvania') || params.address.toLowerCase().includes('washington');
    
    return {
        address: params.address,
        city: isMockMatch ? 'Washington' : 'Philadelphia',
        state: isMockMatch ? 'DC' : 'PA',
        zip: isMockMatch ? '20500' : '19103',
        property_type: 'Single Family Residence',
        beds: 4,
        baths: 3,
        lot_size: '0.25 Acres',
        year_built: 1792,
        owner_name: isMockMatch ? 'Government of USA' : 'Miller Holdings LLC',
        last_sale_price: 1250000,
        last_sale_date: '2015-08-22',
        estimated_value: 1850000,
        parcel_id: 'BK-120-9912-X',
        latitude: params.lat,
        longitude: params.lng,
        confidence_score: 0.98,
        api_source: 'Estated (Tier 1 Verified)',
        raw_response: {
            zoning: 'Residential - R3',
            census_tract: '12.01',
            tax_amount: 14500,
            mortgage_indicator: true,
            equity_estimate: 0.65
        }
    };
  }

  async updateDealAISummary(dealId: string, summary: Deal['ai_summary']): Promise<void> {
    const deals = await this.getDeals();
    const index = deals.findIndex(d => d.id === dealId);
    if (index !== -1) {
      deals[index].ai_summary = summary;
      deals[index].updatedAt = new Date().toISOString();
      this.save('deals', deals);
    }
  }

  async updateDealStatus(deal: Deal, newStatus: DealStatus): Promise<void> {
    const deals = await this.getDeals();
    const index = deals.findIndex(d => d.id === deal.id);
    if (index !== -1) {
      const updatedDeal = { ...deals[index], status: newStatus, updatedAt: new Date().toISOString() };
      deals[index] = updatedDeal;
      this.save('deals', deals);
    }
  }

  async deleteDeal(id: string): Promise<void> {
    const currentDeals = this.load('deals', SEED_DEALS);
    const updatedDeals = currentDeals.filter(d => d.id !== id);
    this.save('deals', updatedDeals);
  }

  async getOffers(dealId: string): Promise<Offer[]> {
    const offers = this.load<Offer[]>('offers', []);
    return offers.filter(o => o.dealId === dealId).sort((a, b) => b.amount - a.amount);
  }

  async getAllOffers(): Promise<Offer[]> {
     return this.load<Offer[]>('offers', []);
  }

  async createOffer(offer: Partial<Offer>): Promise<Offer> {
    const offers = this.load<Offer[]>('offers', []);
    const newOffer: Offer = {
        id: `o${Date.now()}`,
        dealId: offer.dealId,
        propertyAddress: offer.propertyAddress || '',
        clientName: offer.clientName || 'Anonymous',
        amount: offer.amount || 0,
        status: offer.status || 'Pending',
        submittedDate: offer.submittedDate || new Date().toISOString(),
        documents: [],
        coBuyerName: offer.coBuyerName,
        buyerEmail: offer.buyerEmail,
        coBuyerEmail: offer.coBuyerEmail,
        buyerAddress: offer.buyerAddress,
        earnestMoneyPercent: offer.earnestMoneyPercent,
        loanType: offer.loanType
    };
    offers.push(newOffer);
    this.save('offers', offers);
    return newOffer;
  }

  // --- Fix: Added missing offer management methods ---
  async updateOffer(offer: Offer): Promise<Offer> {
    const offers = this.load<Offer[]>('offers', []);
    const index = offers.findIndex(o => o.id === offer.id);
    if (index !== -1) {
      offers[index] = offer;
      this.save('offers', offers);
    }
    return offer;
  }

  async deleteOffer(id: string): Promise<void> {
    const offers = this.load<Offer[]>('offers', []);
    const filtered = offers.filter(o => o.id !== id);
    this.save('offers', filtered);
  }

  async addOfferDocument(offerId: string, file: File): Promise<void> {
    const offers = this.load<Offer[]>('offers', []);
    const index = offers.findIndex(o => o.id === offerId);
    if (index !== -1) {
      const newDoc = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: 'other',
        url: '#',
        uploadedAt: new Date().toISOString()
      };
      offers[index].documents = [...(offers[index].documents || []), newDoc];
      this.save('offers', offers);
    }
  }

  async getTasks(): Promise<Task[]> {
    return this.load('tasks', []);
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    const tasks = await this.getTasks();
    const newTask: Task = {
      id: `t${Date.now()}-${Math.random()}`,
      dealId: task.dealId,
      offerId: task.offerId,
      title: task.title || 'New Task',
      status: task.status || 'To Do',
      priority: task.priority || 'Normal',
      assignedToName: task.assignedToName || 'Unassigned',
      dueDate: task.dueDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    this.save('tasks', tasks);
    return newTask;
  }

  async updateTask(task: Task): Promise<void> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      tasks[index] = task;
      this.save('tasks', tasks);
    }
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    this.save('tasks', filtered);
  }

  // --- Fix: Added missing Update/Activity methods ---
  async getUpdates(): Promise<Update[]> {
    return this.load('updates', []);
  }

  async getOfferUpdates(offerId: string): Promise<Update[]> {
    const updates = await this.getUpdates();
    return updates.filter(u => u.offerId === offerId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async addUpdate(update: Partial<Update>): Promise<Update> {
    const updates = await this.getUpdates();
    const newUpdate: Update = {
      id: `upd-${Date.now()}`,
      dealId: update.dealId,
      offerId: update.offerId,
      content: update.content || '',
      tag: update.tag || 'Note',
      userId: update.userId || 'u1',
      userName: update.userName || 'Unknown',
      timestamp: new Date().toISOString()
    };
    updates.push(newUpdate);
    this.save('updates', updates);
    return newUpdate;
  }

  async getContacts(): Promise<Contact[]> {
    return this.load('contacts', []);
  }

  async addContact(contact: Partial<Contact>): Promise<Contact> {
    const contacts = await this.getContacts();
    const newContact: Contact = {
      id: `c${Date.now()}`,
      name: contact.name || 'Unknown',
      email: contact.email || '',
      phone: contact.phone || '',
      type: contact.type || 'Lead',
      notes: contact.notes,
      lastContacted: contact.lastContacted
    };
    contacts.push(newContact);
    this.save('contacts', contacts);
    return newContact;
  }

  // --- Fix: Added missing Contact methods ---
  async addContacts(newContacts: Partial<Contact>[]): Promise<void> {
    for (const c of newContacts) {
      await this.addContact(c);
    }
  }

  async updateContact(contact: Contact): Promise<Contact> {
    const contacts = await this.getContacts();
    const index = contacts.findIndex(c => c.id === contact.id);
    if (index !== -1) {
      contacts[index] = contact;
      this.save('contacts', contacts);
    }
    return contact;
  }

  async deleteContact(id: string): Promise<void> {
    const contacts = await this.getContacts();
    const filtered = contacts.filter(c => c.id !== id);
    this.save('contacts', filtered);
  }

  async getReminders(userId: string): Promise<Reminder[]> {
    const reminders = this.load<Reminder[]>('reminders', []);
    return reminders.filter(r => r.userId === userId);
  }

  async addReminder(userId: string, content: string): Promise<Reminder> {
    const reminders = this.load<Reminder[]>('reminders', []);
    const reminder: Reminder = {
      id: `r${Date.now()}`,
      userId,
      content,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };
    reminders.push(reminder);
    this.save('reminders', reminders);
    return reminder;
  }

  async toggleReminder(id: string): Promise<void> {
    const reminders = this.load<Reminder[]>('reminders', []);
    const index = reminders.findIndex(r => r.id === id);
    if (index !== -1) {
      reminders[index].isCompleted = !reminders[index].isCompleted;
      this.save('reminders', reminders);
    }
  }

  async deleteReminder(id: string): Promise<void> {
    const reminders = this.load<Reminder[]>('reminders', []);
    const filtered = reminders.filter(r => r.id !== id);
    this.save('reminders', filtered);
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const notifications = this.load<Notification[]>('notifications', []);
    return notifications.filter(n => n.userId === userId);
  }

  async markNotificationRead(id: string): Promise<void> {
    const notifications = this.load<Notification[]>('notifications', []);
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].isRead = true;
      this.save('notifications', notifications);
    }
  }

  async clearNotifications(userId: string): Promise<void> {
    const notifications = this.load<Notification[]>('notifications', []);
    const filtered = notifications.filter(n => n.userId !== userId);
    this.save('notifications', filtered);
  }

  async getCRMDataSnapshot(): Promise<CrmData> {
    const deals = await this.getDeals();
    const tasks = await this.getTasks();
    const offers = await this.getAllOffers();
    const contacts = await this.getContacts();
    const teamMembers = this.getTeamMembers();
    const user = this.getUser();
    if (!user) throw new Error("User not authenticated");
    return { deals, tasks, offers, contacts, teamMembers, user };
  }

  async globalSearch(query: string): Promise<{ deals: Deal[], contacts: Contact[], offers: Offer[] }> {
    const term = query.toLowerCase();
    const deals = await this.getDeals();
    const contacts = await this.getContacts();
    const offers = await this.getAllOffers();

    return {
      deals: deals.filter(d => 
        d.property_address.toLowerCase().includes(term) || 
        d.clientName.toLowerCase().includes(term) ||
        d.mlsNumber?.toLowerCase().includes(term)
      ),
      contacts: contacts.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.email.toLowerCase().includes(term)
      ),
      offers: offers.filter(o => 
        o.clientName.toLowerCase().includes(term) ||
        o.propertyAddress.toLowerCase().includes(term)
      )
    };
  }

  // --- Fix: Added missing Chat methods ---
  async getChannels(): Promise<ChatChannel[]> {
    return this.load('channels', [
      { id: 'general', name: 'general', type: 'public' },
      { id: 'leads', name: 'leads', type: 'public' },
      { id: 'random', name: 'random', type: 'public' }
    ]);
  }

  async createChannel(name: string): Promise<ChatChannel> {
    const channels = await this.getChannels();
    const newChannel: ChatChannel = {
      id: `ch-${Date.now()}`,
      name: name.toLowerCase().replace(/\s+/g, '-'),
      type: 'public'
    };
    channels.push(newChannel);
    this.save('channels', channels);
    return newChannel;
  }

  async getMessages(channelId: string): Promise<ChatMessage[]> {
    const allMessages = this.load<ChatMessage[]>('chat_messages', []);
    return allMessages.filter(m => m.channelId === channelId);
  }

  async sendMessage(message: Partial<ChatMessage>): Promise<ChatMessage> {
    const allMessages = this.load<ChatMessage[]>('chat_messages', []);
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId: message.channelId || 'general',
      userId: message.userId || 'u1',
      userName: message.userName || 'Unknown',
      userInitials: message.userInitials || '?',
      content: message.content || '',
      timestamp: new Date().toISOString()
    };
    allMessages.push(newMessage);
    this.save('chat_messages', allMessages);
    return newMessage;
  }

  async clearMessages(channelId: string): Promise<void> {
    const allMessages = this.load<ChatMessage[]>('chat_messages', []);
    const filtered = allMessages.filter(m => m.channelId !== channelId);
    this.save('chat_messages', filtered);
  }

  async getGoogleEvents(): Promise<CalendarEvent[]> {
    return [];
  }

  // --- Fix: Added missing Smart Import method ---
  async processSmartImport(records: SmartImportRecord[]): Promise<SmartImportSummary> {
    let dealsCount = 0;
    let leadsCount = 0;
    let contactsCount = 0;

    for (const record of records) {
      if (record.record_type === 'ClosedDeal' || record.record_type === 'ActiveDeal') {
        await this.createDeal({
          property_address: record.data.address || 'Imported Address',
          city: record.data.city || '',
          zip: record.data.zip || '',
          property_type: record.data.property_type || 'Residential',
          beds: record.data.bedrooms || 0,
          price: record.data.sale_price || 0,
          status: record.record_type === 'ClosedDeal' ? 'Closed' : 'Active',
          owner_name: record.data.full_name,
          clientName: record.data.full_name,
          notes: record.data.notes
        });
        dealsCount++;
      } else if (record.record_type === 'Lead') {
        await this.addContact({
          name: record.data.full_name,
          type: 'Lead',
          notes: `${record.data.notes}\nInterested in: ${record.data.address || 'N/A'}`
        });
        leadsCount++;
      } else {
        await this.addContact({
          name: record.data.full_name,
          type: 'Other',
          notes: record.data.notes
        });
        contactsCount++;
      }
    }

    return { deals: dealsCount, leads: leadsCount, contacts: contactsCount };
  }
}

export const dataService = new DataService();
