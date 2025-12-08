
import { Deal, Task, Update, User, DealDocument, ChatMessage, Reminder, ChatChannel, Contact, Offer } from '../types';

// Seed data
const SEED_TEAM_MEMBERS: User[] = [
  { id: 'u1', displayName: 'Shreyas', initials: 'S', role: 'admin', email: 'shreyas@realitymark.com', phone: '(555) 123-4567' },
  { id: 'u2', displayName: 'Sarah Sales', initials: 'SS', role: 'agent', email: 'sarah@realitymark.com', phone: '(555) 234-5678' },
  { id: 'u3', displayName: 'Mike Manager', initials: 'MM', role: 'agent', email: 'mike@realitymark.com', phone: '(555) 345-6789' },
  { id: 'u4', displayName: 'Linda Legal', initials: 'LL', role: 'agent', email: 'linda@realitymark.com', phone: '(555) 456-7890' },
];

const SEED_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Sarah Jenkins', email: 'sarah.j@example.com', phone: '(555) 123-4567', type: 'Seller', notes: 'Prefers texts. Selling due to relocation.', lastContacted: new Date().toISOString() },
  { id: 'c2', name: 'Michael Bond', email: 'm.bond@example.com', phone: '(555) 987-6543', type: 'Buyer', notes: 'Looking for penthouse suites only.', lastContacted: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'c3', name: 'John Doe', email: 'john@example.com', phone: '(555) 555-5555', type: 'Lead', notes: 'Met at open house. Interested in 3bd/2ba.', lastContacted: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: 'c4', name: 'Best Photos Inc', email: 'book@bestphotos.com', phone: '(555) 111-2222', type: 'Vendor', notes: 'Our go-to photographer.', lastContacted: new Date(Date.now() - 86400000 * 20).toISOString() },
];

const SEED_DEALS: Deal[] = [
  {
    id: 'd1',
    clientName: 'Sarah Jenkins',
    address: '124 Maple Ave, Springfield',
    type: 'Sale',
    status: 'Active',
    primaryAgentId: 'u1',
    primaryAgentName: 'Shreyas',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    price: 550000,
    commissionRate: 2.5,
    documents: [
      { id: 'doc1', name: 'Agency Disclosure.pdf', type: 'pdf', url: '#', uploadedAt: new Date().toISOString() },
      { id: 'doc2', name: 'Listing Agreement.pdf', type: 'pdf', url: '#', uploadedAt: new Date().toISOString() }
    ]
  },
  {
    id: 'd2',
    clientName: 'TechCorp Inc.',
    address: '500 Innovation Blvd, Suite 200',
    type: 'Rental',
    status: 'Under Contract',
    primaryAgentId: 'u1',
    primaryAgentName: 'Shreyas',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    price: 4500, // Monthly rent
    commissionRate: 100, // 1 month rent
    documents: [
      { id: 'doc3', name: 'Lease Draft v1.pdf', type: 'pdf', url: '#', uploadedAt: new Date().toISOString() }
    ]
  },
  {
    id: 'd3',
    clientName: 'Michael Bond',
    address: '88 Skyview Penthouse',
    type: 'Sale',
    status: 'Lead',
    primaryAgentId: 'u1',
    primaryAgentName: 'Shreyas',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
    price: 1200000,
    commissionRate: 3.0,
    documents: []
  }
];

const SEED_OFFERS: Offer[] = [
  {
    id: 'o1',
    dealId: 'd1',
    clientName: 'Robert Buyer',
    amount: 540000,
    status: 'Pending',
    submittedDate: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Pre-approved. Flexible closing timeline.',
    documents: [
      { id: 'odoc1', name: 'Offer Letter.pdf', type: 'pdf', url: '#', uploadedAt: new Date().toISOString() }
    ]
  }
];

const SEED_TASKS: Task[] = [
  {
    id: 't1',
    dealId: 'd1',
    title: 'Schedule Photographer',
    status: 'To Do',
    priority: 'High',
    assignedToName: 'Shreyas',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 't2',
    dealId: 'd1',
    title: 'Order Sign Installation',
    status: 'Completed',
    priority: 'Normal',
    assignedToName: 'Shreyas',
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 't3',
    dealId: 'd2',
    title: 'Draft Lease Agreement',
    status: 'In Progress',
    priority: 'High',
    assignedToName: 'Shreyas',
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
];

const SEED_UPDATES: Update[] = [
  {
    id: 'up1',
    dealId: 'd1',
    content: 'Client agreed to list at $550k. Needs painting first.',
    tag: 'Call',
    userId: 'u1',
    userName: 'Shreyas',
    timestamp: new Date(Date.now() - 100000000).toISOString(),
  }
];

const SEED_CHANNELS: ChatChannel[] = [
  { id: 'general', name: 'General', type: 'public' },
  { id: 'leads', name: 'Leads', type: 'public' },
  { id: 'random', name: 'Random', type: 'public' },
];

const SEED_MESSAGES: ChatMessage[] = [
  { id: 'm1', channelId: 'general', userId: 'u2', userName: 'Sarah Sales', userInitials: 'SS', content: 'Has anyone seen the keys for 124 Maple?', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'm2', channelId: 'general', userId: 'u1', userName: 'Shreyas', userInitials: 'S', content: 'Yes, they are in the lockbox.', timestamp: new Date(Date.now() - 3500000).toISOString() },
  { id: 'm3', channelId: 'leads', userId: 'u3', userName: 'Mike Manager', userInitials: 'MM', content: 'New lead coming in for downtown rentals.', timestamp: new Date(Date.now() - 100000).toISOString() },
];

const SEED_REMINDERS: Reminder[] = [
  { id: 'r1', userId: 'u1', content: 'Call back installer', isCompleted: false, createdAt: new Date().toISOString() },
  { id: 'r2', userId: 'u1', content: 'Buy coffee for office', isCompleted: true, createdAt: new Date().toISOString() },
];

const MOCK_GOOGLE_EVENTS = [
  {
    id: 'g1',
    title: 'Client Meeting: Sarah Jenkins',
    start: new Date(Date.now() + 86400000 * 2).toISOString(), // +2 days
    end: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString(),
    source: 'google' as const,
  },
  {
    id: 'g2',
    title: 'Open House Prep',
    start: new Date(Date.now() + 86400000 * 4).toISOString(), // +4 days
    end: new Date(Date.now() + 86400000 * 4 + 7200000).toISOString(),
    source: 'google' as const,
  }
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

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

  // --- Auth & User ---
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
      // Update session user if it matches current
      const currentUser = this.getUser();
      if (currentUser && currentUser.id === user.id) {
        localStorage.setItem('reality_mark_user', JSON.stringify(user));
      }
    }
    return user;
  }

  // --- Contacts ---
  async getContacts(): Promise<Contact[]> {
    await delay(200);
    return this.load('contacts', SEED_CONTACTS);
  }

  async addContact(contact: Omit<Contact, 'id'>): Promise<Contact> {
    const contacts = await this.getContacts();
    const newContact: Contact = {
      ...contact,
      id: `c${Date.now()}-${Math.random()}`,
      lastContacted: new Date().toISOString()
    };
    contacts.push(newContact);
    this.save('contacts', contacts);
    return newContact;
  }

  async addContacts(newContactsData: Omit<Contact, 'id' | 'lastContacted'>[]): Promise<Contact[]> {
    const contacts = await this.getContacts();
    const createdContacts: Contact[] = newContactsData.map(c => ({
      ...c,
      id: `c${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lastContacted: undefined // imported contacts haven't been contacted yet
    }));
    
    // Add all to array
    contacts.push(...createdContacts);
    this.save('contacts', contacts);
    
    // Simulate slight delay for bulk op
    await delay(500);
    return createdContacts;
  }

  async updateContact(contact: Contact): Promise<void> {
    const contacts = await this.getContacts();
    const index = contacts.findIndex(c => c.id === contact.id);
    if (index !== -1) {
      contacts[index] = contact;
      this.save('contacts', contacts);
    }
  }

  async deleteContact(id: string): Promise<void> {
    let contacts = await this.getContacts();
    contacts = contacts.filter(c => c.id !== id);
    this.save('contacts', contacts);
  }

  // --- Chat ---
  async getChannels(): Promise<ChatChannel[]> {
    await delay(100);
    return this.load('channels', SEED_CHANNELS);
  }

  async createChannel(name: string): Promise<ChatChannel> {
    const channels = await this.getChannels();
    const newChannel: ChatChannel = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      type: 'public'
    };
    channels.push(newChannel);
    this.save('channels', channels);
    return newChannel;
  }

  async getMessages(channelId: string): Promise<ChatMessage[]> {
    await delay(100);
    const msgs = this.load<ChatMessage[]>('messages', SEED_MESSAGES);
    return msgs.filter(m => m.channelId === channelId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async sendMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    const msgs = this.load<ChatMessage[]>('messages', SEED_MESSAGES);
    const newMsg: ChatMessage = {
      ...msg,
      id: `m${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    msgs.push(newMsg);
    this.save('messages', msgs);
    return newMsg;
  }

  async clearMessages(channelId: string): Promise<void> {
    let msgs = this.load<ChatMessage[]>('messages', SEED_MESSAGES);
    msgs = msgs.filter(m => m.channelId !== channelId);
    this.save('messages', msgs);
  }

  // --- Reminders ---
  async getReminders(userId: string): Promise<Reminder[]> {
    const reminders = this.load<Reminder[]>('reminders', SEED_REMINDERS);
    return reminders.filter(r => r.userId === userId);
  }

  async addReminder(userId: string, content: string): Promise<Reminder> {
    const reminders = this.load<Reminder[]>('reminders', SEED_REMINDERS);
    const newReminder: Reminder = {
      id: `r${Date.now()}`,
      userId,
      content,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };
    reminders.push(newReminder);
    this.save('reminders', reminders);
    return newReminder;
  }

  async toggleReminder(id: string): Promise<void> {
    const reminders = this.load<Reminder[]>('reminders', SEED_REMINDERS);
    const index = reminders.findIndex(r => r.id === id);
    if (index !== -1) {
      reminders[index].isCompleted = !reminders[index].isCompleted;
      this.save('reminders', reminders);
    }
  }

  async deleteReminder(id: string) {
    let reminders = this.load<Reminder[]>('reminders', SEED_REMINDERS);
    reminders = reminders.filter(r => r.id !== id);
    this.save('reminders', reminders);
  }

  // --- Deals ---
  async getDeals(): Promise<Deal[]> {
    await delay(300);
    return this.load('deals', SEED_DEALS);
  }

  async createDeal(deal: Deal): Promise<Deal> {
    const deals = await this.getDeals();
    const newDeal: Deal = { 
      ...deal, 
      id: `d${Date.now()}`, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString(),
      price: 0,
      commissionRate: deal.type === 'Sale' ? 2.5 : 0,
      documents: []
    };
    deals.push(newDeal);
    this.save('deals', deals);
    
    if (newDeal.type === 'Sale') {
      await this.createTask({ dealId: newDeal.id, title: 'Send Agency Disclosure', priority: 'High', status: 'To Do', assignedToName: newDeal.primaryAgentName, dueDate: new Date().toISOString(), createdAt: new Date().toISOString(), id: '' });
      await this.createTask({ dealId: newDeal.id, title: 'Schedule Photography', priority: 'Normal', status: 'To Do', assignedToName: newDeal.primaryAgentName, dueDate: new Date().toISOString(), createdAt: new Date().toISOString(), id: '' });
    } else {
      await this.createTask({ dealId: newDeal.id, title: 'Verify Income/Credit', priority: 'High', status: 'To Do', assignedToName: newDeal.primaryAgentName, dueDate: new Date().toISOString(), createdAt: new Date().toISOString(), id: '' });
    }
    
    await this.addUpdate({ dealId: newDeal.id, content: 'Deal created', tag: 'Note', userId: newDeal.primaryAgentId, userName: newDeal.primaryAgentName, timestamp: new Date().toISOString(), id: '' });

    return newDeal;
  }

  async updateDeal(deal: Deal): Promise<void> {
    const deals = await this.getDeals();
    const index = deals.findIndex(d => d.id === deal.id);
    if (index !== -1) {
      deals[index] = { ...deal, updatedAt: new Date().toISOString() };
      this.save('deals', deals);
    }
  }

  // --- Offers ---
  async getAllOffers(): Promise<Offer[]> {
    await delay(100);
    return this.load<Offer[]>('offers', SEED_OFFERS);
  }

  async getOffers(dealId: string): Promise<Offer[]> {
    await delay(100);
    const offers = this.load<Offer[]>('offers', SEED_OFFERS);
    return offers.filter(o => o.dealId === dealId).sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
  }

  async createOffer(offer: Omit<Offer, 'id'>): Promise<Offer> {
    const offers = this.load<Offer[]>('offers', SEED_OFFERS);
    const newOffer: Offer = {
      ...offer,
      id: `o${Date.now()}`,
    };
    offers.push(newOffer);
    this.save('offers', offers);
    
    // Log activity
    await this.addUpdate({
      dealId: offer.dealId,
      content: `New offer received from ${offer.clientName} for $${offer.amount.toLocaleString()}`,
      tag: 'Note',
      userId: this.getUser()?.id || 'unknown',
      userName: this.getUser()?.displayName || 'Unknown',
      timestamp: new Date().toISOString(),
      id: ''
    });

    return newOffer;
  }

  async updateOffer(offer: Offer): Promise<void> {
    const offers = this.load<Offer[]>('offers', SEED_OFFERS);
    const index = offers.findIndex(o => o.id === offer.id);
    if (index !== -1) {
      offers[index] = offer;
      this.save('offers', offers);
    }
  }

  async deleteOffer(offerId: string): Promise<void> {
    let offers = this.load<Offer[]>('offers', SEED_OFFERS);
    offers = offers.filter(o => o.id !== offerId);
    this.save('offers', offers);
  }

  async addOfferDocument(offerId: string, file: File): Promise<DealDocument> {
    await delay(300);
    const offers = this.load<Offer[]>('offers', SEED_OFFERS);
    const index = offers.findIndex(o => o.id === offerId);
    if (index === -1) throw new Error("Offer not found");

    const newDoc: DealDocument = {
      id: `odoc${Date.now()}`,
      name: file.name,
      type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'other',
      url: '#',
      uploadedAt: new Date().toISOString()
    };
    
    if (!offers[index].documents) offers[index].documents = [];
    offers[index].documents.push(newDoc);
    this.save('offers', offers);
    return newDoc;
  }

  // --- Documents ---
  async addDocument(dealId: string, file: File): Promise<DealDocument> {
    await delay(500); 
    const deals = await this.getDeals();
    const dealIndex = deals.findIndex(d => d.id === dealId);
    
    if (dealIndex === -1) throw new Error("Deal not found");
    
    const newDoc: DealDocument = {
      id: `doc${Date.now()}`,
      name: file.name,
      type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'other',
      url: '#',
      uploadedAt: new Date().toISOString()
    };

    deals[dealIndex].documents.push(newDoc);
    this.save('deals', deals);
    
    await this.addUpdate({
      dealId,
      content: `Uploaded document: ${file.name}`,
      tag: 'Document',
      userId: this.getUser()?.id || 'unknown',
      userName: this.getUser()?.displayName || 'Unknown',
      timestamp: new Date().toISOString(),
      id: ''
    });

    return newDoc;
  }

  async createGoogleFile(dealId: string, name: string, type: 'google-doc' | 'google-sheet' | 'google-slide'): Promise<DealDocument> {
    await delay(300);
    const deals = await this.getDeals();
    const dealIndex = deals.findIndex(d => d.id === dealId);
    if (dealIndex === -1) throw new Error("Deal not found");

    const newDoc: DealDocument = {
      id: `g${Date.now()}`,
      name: name,
      type: type,
      url: '#', // In a real app, this would be the drive file URL
      uploadedAt: new Date().toISOString()
    };

    deals[dealIndex].documents.push(newDoc);
    this.save('deals', deals);
    
    const typeLabel = type === 'google-doc' ? 'Google Doc' : type === 'google-sheet' ? 'Google Sheet' : 'Google Slide';

    await this.addUpdate({
        dealId,
        content: `Created new ${typeLabel}: ${name}`,
        tag: 'Document',
        userId: this.getUser()?.id || 'unknown',
        userName: this.getUser()?.displayName || 'Unknown',
        timestamp: new Date().toISOString(),
        id: ''
    });

    return newDoc;
  }

  // --- Tasks ---
  async getTasks(): Promise<Task[]> {
    await delay(200);
    return this.load('tasks', SEED_TASKS);
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    const tasks = await this.getTasks();
    const newTask: Task = {
      id: `t${Date.now()}-${Math.random()}`,
      dealId: task.dealId!,
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

  async deleteTask(taskId: string): Promise<void> {
    let tasks = await this.getTasks();
    tasks = tasks.filter(t => t.id !== taskId);
    this.save('tasks', tasks);
  }

  // --- Updates ---
  async getUpdates(dealId: string): Promise<Update[]> {
    await delay(200);
    const updates = this.load<Update[]>('updates', SEED_UPDATES);
    return updates.filter(u => u.dealId === dealId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async addUpdate(update: Partial<Update>): Promise<Update> {
    const updates = this.load<Update[]>('updates', SEED_UPDATES);
    const newUpdate: Update = {
      id: `u${Date.now()}`,
      dealId: update.dealId!,
      content: update.content!,
      tag: update.tag || 'Note',
      userId: update.userId!,
      userName: update.userName!,
      timestamp: new Date().toISOString(),
    };
    updates.push(newUpdate);
    this.save('updates', updates);
    return newUpdate;
  }

  // --- Google Calendar ---
  async getGoogleEvents(): Promise<any[]> {
    await delay(500);
    return MOCK_GOOGLE_EVENTS;
  }
}

export const dataService = new DataService();
