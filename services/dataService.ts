import { Deal, Task, Update, DealType, DealStatus, TaskStatus, TaskPriority, User } from '../types';

// Seed data to make the app look alive immediately
const SEED_USER: User = { id: 'u1', displayName: 'Alex Broker', initials: 'AB' };

const SEED_TEAM_MEMBERS: User[] = [
  { id: 'u1', displayName: 'Alex Broker', initials: 'AB' },
  { id: 'u2', displayName: 'Sarah Sales', initials: 'SS' },
  { id: 'u3', displayName: 'Mike Manager', initials: 'MM' },
  { id: 'u4', displayName: 'Linda Legal', initials: 'LL' },
];

const SEED_DEALS: Deal[] = [
  {
    id: 'd1',
    clientName: 'Sarah Jenkins',
    address: '124 Maple Ave, Springfield',
    type: 'Sale',
    status: 'Active',
    primaryAgentId: 'u1',
    primaryAgentName: 'Alex Broker',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'd2',
    clientName: 'TechCorp Inc.',
    address: '500 Innovation Blvd, Suite 200',
    type: 'Rental',
    status: 'Under Contract',
    primaryAgentId: 'u1',
    primaryAgentName: 'Alex Broker',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'd3',
    clientName: 'Michael Bond',
    address: '88 Skyview Penthouse',
    type: 'Sale',
    status: 'Lead',
    primaryAgentId: 'u1',
    primaryAgentName: 'Alex Broker',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const SEED_TASKS: Task[] = [
  {
    id: 't1',
    dealId: 'd1',
    title: 'Schedule Photographer',
    status: 'To Do',
    priority: 'High',
    assignedToName: 'Alex Broker',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 't2',
    dealId: 'd1',
    title: 'Order Sign Installation',
    status: 'Completed',
    priority: 'Normal',
    assignedToName: 'Alex Broker',
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 't3',
    dealId: 'd2',
    title: 'Draft Lease Agreement',
    status: 'In Progress',
    priority: 'High',
    assignedToName: 'Alex Broker',
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
    userName: 'Alex Broker',
    timestamp: new Date(Date.now() - 100000000).toISOString(),
  }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

class DataService {
  private load<T>(key: string, seed: T): T {
    const stored = localStorage.getItem(`reality_mark_${key}`);
    if (!stored) {
      localStorage.setItem(`reality_mark_${key}`, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(stored);
  }

  private save(key: string, data: any) {
    localStorage.setItem(`reality_mark_${key}`, JSON.stringify(data));
  }

  // --- User ---
  getUser(): User {
    return this.load('user', SEED_USER);
  }

  getTeamMembers(): User[] {
    return SEED_TEAM_MEMBERS;
  }

  updateUser(user: User) {
    this.save('user', user);
  }

  // --- Deals ---
  async getDeals(): Promise<Deal[]> {
    await delay(300);
    return this.load('deals', SEED_DEALS);
  }

  async createDeal(deal: Deal): Promise<Deal> {
    const deals = await this.getDeals();
    const newDeal = { ...deal, id: `d${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    deals.push(newDeal);
    this.save('deals', deals);
    
    // Auto-generate tasks
    if (newDeal.type === 'Sale') {
      await this.createTask({ dealId: newDeal.id, title: 'Send Agency Disclosure', priority: 'High', status: 'To Do', assignedToName: newDeal.primaryAgentName, dueDate: new Date().toISOString(), createdAt: new Date().toISOString(), id: '' });
      await this.createTask({ dealId: newDeal.id, title: 'Schedule Photography', priority: 'Normal', status: 'To Do', assignedToName: newDeal.primaryAgentName, dueDate: new Date().toISOString(), createdAt: new Date().toISOString(), id: '' });
    } else {
      await this.createTask({ dealId: newDeal.id, title: 'Verify Income/Credit', priority: 'High', status: 'To Do', assignedToName: newDeal.primaryAgentName, dueDate: new Date().toISOString(), createdAt: new Date().toISOString(), id: '' });
    }
    
    // Initial update
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
}

export const dataService = new DataService();