
import { Deal, Task, Update, User, DealDocument, ChatMessage, Reminder, ChatChannel, Contact, Offer, Notification, CrmData } from '../types';

const SEED_TEAM_MEMBERS: User[] = [
  { id: 'u1', displayName: 'Shreyas', initials: 'S', role: 'admin', email: 'shreyas@realitymark.com', phone: '(555) 123-4567' },
  { id: 'u2', displayName: 'Sarah Sales', initials: 'SS', role: 'agent', email: 'sarah@realitymark.com', phone: '(555) 234-5678' },
  { id: 'u3', displayName: 'Mike Manager', initials: 'MM', role: 'agent', email: 'mike@realitymark.com', phone: '(555) 345-6789' },
  { id: 'u4', displayName: 'Linda Legal', initials: 'LL', role: 'agent', email: 'linda@realitymark.com', phone: '(555) 456-7890' },
];

const SEED_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Sarah Jenkins', email: 'sarah.j@example.com', phone: '(555) 123-4567', type: 'Seller', notes: 'Prefers texts. Selling due to relocation.', lastContacted: new Date().toISOString() },
  { id: 'c2', name: 'Michael Bond', email: 'm.bond@example.com', phone: '(555) 987-6543', type: 'Buyer', notes: 'Looking for penthouse suites only.', lastContacted: new Date(Date.now() - 86400000 * 5).toISOString() },
];

const SEED_DEALS: Deal[] = [
  {
    id: 'd1',
    mlsNumber: 'MLS-230045',
    category: 'Resi',
    subType: 'Detached',
    city: 'Springfield',
    beds: 4,
    baths: 2.5,
    contractualInfo: 'Ready',
    searchId: 'S-991',
    officeName: 'Reality Mark HQ',
    statusDate: new Date().toISOString(),
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
    documents: []
  },
  {
    id: 'd2',
    mlsNumber: 'MLS-559281',
    category: 'Comm',
    subType: 'Office',
    city: 'Metro City',
    beds: 0,
    baths: 2,
    contractualInfo: 'Pending',
    searchId: 'S-104',
    officeName: 'Reality Mark HQ',
    statusDate: new Date(Date.now() - 86400000).toISOString(),
    clientName: 'TechCorp Inc.',
    address: '500 Innovation Blvd, Suite 200',
    type: 'Rental',
    status: 'Under Contract',
    primaryAgentId: 'u1',
    primaryAgentName: 'Shreyas',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    price: 4500,
    commissionRate: 100,
    documents: []
  }
];

const SEED_OFFERS: Offer[] = [
  {
    id: 'o1',
    dealId: 'd1',
    propertyAddress: '124 Maple Ave, Springfield',
    clientName: 'Robert Buyer',
    amount: 540000,
    status: 'Pending',
    submittedDate: new Date(Date.now() - 86400000).toISOString(),
    documents: []
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
  }
];

const SEED_CHANNELS: ChatChannel[] = [
  { id: 'general', name: 'General', type: 'public' },
];

const SEED_MESSAGES: ChatMessage[] = [];
const SEED_REMINDERS: Reminder[] = [];
const SEED_NOTIFICATIONS: Notification[] = [];
const SEED_UPDATES: Update[] = [];

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

  async getContacts(): Promise<Contact[]> {
    return this.load('contacts', SEED_CONTACTS);
  }

  async addContact(contact: Omit<Contact, 'id'>): Promise<Contact> {
    const contacts = await this.getContacts();
    const newContact: Contact = {
      ...contact,
      id: `c${Date.now()}`,
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
      lastContacted: undefined
    }));
    contacts.push(...createdContacts);
    this.save('contacts', contacts);
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

  async getChannels(): Promise<ChatChannel[]> {
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
    const msgs = this.load<ChatMessage[]>('messages', SEED_MESSAGES);
    return msgs.filter(m => m.channelId === channelId);
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

  async getNotifications(userId: string): Promise<Notification[]> {
    const notifications = this.load<Notification[]>('notifications', SEED_NOTIFICATIONS);
    return notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markNotificationRead(id: string): Promise<void> {
    const notifications = this.load<Notification[]>('notifications', SEED_NOTIFICATIONS);
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].isRead = true;
      this.save('notifications', notifications);
    }
  }

  async clearNotifications(userId: string): Promise<void> {
    let notifications = this.load<Notification[]>('notifications', SEED_NOTIFICATIONS);
    notifications = notifications.filter(n => n.userId !== userId);
    this.save('notifications', notifications);
  }

  async getDeals(): Promise<Deal[]> {
    return this.load('deals', SEED_DEALS);
  }

  async createDeal(deal: Partial<Deal>): Promise<Deal> {
    const deals = await this.getDeals();
    const newDeal: Deal = { 
      clientName: deal.clientName || 'Unnamed',
      address: deal.address || 'No Address',
      type: deal.type || 'Sale',
      status: deal.status || 'Lead',
      primaryAgentId: deal.primaryAgentId || 'u1',
      primaryAgentName: deal.primaryAgentName || 'Admin',
      price: deal.price || 0,
      commissionRate: deal.commissionRate || 2.5,
      id: `d${Date.now()}`, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString(),
      statusDate: new Date().toISOString(),
      documents: []
    };
    deals.push(newDeal);
    this.save('deals', deals);
    return newDeal;
  }

  async addDeals(dealsData: Partial<Deal>[]): Promise<Deal[]> {
    const deals = await this.getDeals();
    const currentUser = this.getUser();
    const newDeals: Deal[] = dealsData.map((d, i) => ({
        ...d,
        id: `d${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusDate: new Date().toISOString(),
        primaryAgentId: currentUser?.id || 'u1',
        primaryAgentName: currentUser?.displayName || 'Admin',
        clientName: d.clientName || 'Unnamed',
        address: d.address || 'No Address',
        type: d.type || 'Sale',
        status: d.status || 'Lead',
        price: d.price || 0,
        commissionRate: d.commissionRate || 2.5,
        documents: []
    }));
    deals.push(...newDeals);
    this.save('deals', deals);
    return newDeals;
  }

  async updateDeal(deal: Deal): Promise<void> {
    const deals = await this.getDeals();
    const index = deals.findIndex(d => d.id === deal.id);
    if (index !== -1) {
      deals[index] = { ...deal, updatedAt: new Date().toISOString() };
      this.save('deals', deals);
    }
  }

  async getAllOffers(): Promise<Offer[]> {
    return this.load<Offer[]>('offers', SEED_OFFERS);
  }

  async getOffers(dealId: string): Promise<Offer[]> {
    const offers = await this.getAllOffers();
    return offers.filter(o => o.dealId === dealId);
  }

  async createOffer(offer: Omit<Offer, 'id'>): Promise<Offer> {
    const offers = await this.getAllOffers();
    const newOffer: Offer = { ...offer, id: `o${Date.now()}` };
    offers.push(newOffer);
    this.save('offers', offers);
    return newOffer;
  }

  async addOffers(offersData: Partial<Offer>[]): Promise<Offer[]> {
    const offers = await this.getAllOffers();
    const newOffers: Offer[] = offersData.map(o => ({
        ...o,
        id: `o${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        status: o.status || 'Pending',
        submittedDate: o.submittedDate || new Date().toISOString(),
        propertyAddress: o.propertyAddress || '',
        clientName: o.clientName || '',
        amount: o.amount || 0,
        documents: []
    }));
    offers.push(...newOffers);
    this.save('offers', offers);
    return newOffers;
  }

  async updateOffer(offer: Offer): Promise<void> {
    const offers = await this.getAllOffers();
    const index = offers.findIndex(o => o.id === offer.id);
    if (index !== -1) {
      offers[index] = offer;
      this.save('offers', offers);
    }
  }

  async deleteOffer(offerId: string): Promise<void> {
    let offers = await this.getAllOffers();
    offers = offers.filter(o => o.id !== offerId);
    this.save('offers', offers);
  }

  async addOfferDocument(offerId: string, file: File): Promise<DealDocument> {
    const offers = await this.getAllOffers();
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

  async addDocument(dealId: string, file: File): Promise<DealDocument> {
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
    return newDoc;
  }

  async createGoogleFile(dealId: string, name: string, type: 'google-doc' | 'google-sheet' | 'google-slide'): Promise<DealDocument> {
    const deals = await this.getDeals();
    const dealIndex = deals.findIndex(d => d.id === dealId);
    if (dealIndex === -1) throw new Error("Deal not found");
    const newDoc: DealDocument = {
      id: `g${Date.now()}`,
      name: name,
      type: type,
      url: '#',
      uploadedAt: new Date().toISOString()
    };
    deals[dealIndex].documents.push(newDoc);
    this.save('deals', deals);
    return newDoc;
  }

  async getTasks(): Promise<Task[]> {
    return this.load('tasks', SEED_TASKS);
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

  async deleteTask(taskId: string): Promise<void> {
    let tasks = await this.getTasks();
    tasks = tasks.filter(t => t.id !== taskId);
    this.save('tasks', tasks);
  }

  async getUpdates(dealId: string): Promise<Update[]> {
    const updates = this.load<Update[]>('updates', SEED_UPDATES);
    return updates.filter(u => u.dealId === dealId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getOfferUpdates(offerId: string): Promise<Update[]> {
    const updates = this.load<Update[]>('updates', SEED_UPDATES);
    return updates.filter(u => u.offerId === offerId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async addUpdate(update: Partial<Update>): Promise<Update> {
    const updates = this.load<Update[]>('updates', SEED_UPDATES);
    const newUpdate: Update = {
      id: `u${Date.now()}`,
      dealId: update.dealId,
      offerId: update.offerId,
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

  async getGoogleEvents(): Promise<any[]> {
    await delay(500);
    return [];
  }

  async globalSearch(query: string): Promise<{ deals: Deal[], contacts: Contact[], offers: Offer[] }> {
    const q = query.toLowerCase();
    const deals = (await this.getDeals()).filter(d => 
        d.address.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q)
    ).slice(0, 3);
    const contacts = (await this.getContacts()).filter(c => 
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    ).slice(0, 3);
    const offers = (await this.getAllOffers()).filter(o => 
        o.clientName.toLowerCase().includes(q) || (o.propertyAddress && o.propertyAddress.toLowerCase().includes(q))
    ).slice(0, 3);
    return { deals, contacts, offers };
  }

  async getCRMDataSnapshot(): Promise<CrmData> {
    const deals = await this.getDeals();
    const tasks = await this.getTasks();
    const offers = await this.getAllOffers();
    const contacts = await this.getContacts();
    const teamMembers = this.getTeamMembers();
    const user = this.getUser();
    if (!user) throw new Error("User not authenticated for snapshot");
    return { deals, tasks, offers, contacts, teamMembers, user };
  }
}

export const dataService = new DataService();
