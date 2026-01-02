
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { DealList } from './views/DealList';
import { MyTasks } from './views/MyTasks';
import { CalendarView } from './views/CalendarView';
import { DealRoomModal } from './views/DealRoom';
import { TeamManagement } from './views/TeamManagement';
import { Chat } from './views/Chat';
import { Contacts } from './views/Contacts';
import { Login } from './views/Login';
import { Profile } from './views/Profile';
import { OffersList } from './views/OffersList';
import { AppState, Deal, Task, Update, User, Offer, Contact } from './types';
import { dataService } from './services/dataService';
import { Modal, InputGroup, Button } from './components/Shared';

export default function App() {
  const [view, setView] = useState<AppState['view']>('dashboard');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data State
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  
  // View Details (Fetched when deal opened)
  const [activeUpdates, setActiveUpdates] = useState<Update[]>([]);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  
  // UI State
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New Deal Form State
  const [newDealClient, setNewDealClient] = useState('');
  const [newDealAddress, setNewDealAddress] = useState('');

  useEffect(() => {
    const user = dataService.getUser();
    setCurrentUser(user);
    if (user) refreshData();
    else setIsLoading(false);
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [d, t, tm, offers, c] = await Promise.all([
        dataService.getDeals(),
        dataService.getTasks(),
        dataService.getTeamMembers(),
        dataService.getAllOffers(),
        dataService.getContacts()
      ]);
      
      setDeals(d);
      setTasks(t);
      setTeamMembers(tm);
      setAllOffers(offers);
      setContacts(c);
    } catch (error) {
      console.error("Refresh Data Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDealId && currentUser) {
      Promise.all([
        dataService.getUpdates(selectedDealId),
        dataService.getOffers(selectedDealId)
      ]).then(([u, o]) => {
        setActiveUpdates(u);
        setActiveOffers(o);
      });
    }
  }, [selectedDealId, currentUser]);

  const handleNavigate = (newView: AppState['view']) => setView(newView);
  const handleOpenDeal = (id: string) => setSelectedDealId(id);
  const handleCloseDealModal = () => setSelectedDealId(null);
  const handleLogout = () => { setCurrentUser(null); setView('dashboard'); };
  const handleLogin = (user: User) => { setCurrentUser(user); refreshData(); };

  const handleCreateDeal = async () => {
    if (!newDealClient || !newDealAddress || !currentUser) return;
    setIsLoading(true);
    const newDeal = await dataService.createDeal({
      clientName: newDealClient,
      address: newDealAddress,
      primaryAgentId: currentUser.id,
      primaryAgentName: currentUser.displayName,
    });
    setNewDealClient('');
    setNewDealAddress('');
    setIsNewDealModalOpen(false);
    await refreshData();
    handleOpenDeal(newDeal.id);
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;
  if (isLoading && deals.length === 0) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-indigo-600 font-medium">Loading Reality Mark...</div>;

  const selectedDeal = deals.find(d => d.id === selectedDealId);
  const dealTasks = tasks.filter(t => t.dealId === selectedDealId);

  return (
    <Layout user={currentUser} currentView={view} onNavigate={handleNavigate} onLogout={handleLogout}>
      {view === 'dashboard' && (
        <Dashboard 
          deals={deals} tasks={tasks} user={currentUser} 
          onNavigate={handleNavigate} onOpenDeal={handleOpenDeal} 
          offers={allOffers} onCreateDeal={() => setIsNewDealModalOpen(true)}
        />
      )}
      {view === 'deals' && (
        <DealList 
          deals={deals} 
          tasks={tasks} 
          onOpenDeal={handleOpenDeal} 
          onNewDeal={() => setIsNewDealModalOpen(true)}
          onRefreshData={refreshData}
        />
      )}
      {view === 'offers' && (
        <OffersList
          offers={allOffers} deals={deals} currentUser={currentUser}
          onRefreshData={refreshData} onOpenDeal={handleOpenDeal}
        />
      )}
      {view === 'contacts' && <Contacts contacts={contacts} onRefresh={refreshData} />}
      {view === 'mytasks' && (
        <MyTasks 
          tasks={tasks} deals={deals} user={currentUser}
          teamMembers={teamMembers} onRefreshData={refreshData} onOpenDeal={handleOpenDeal}
        />
      )}
      {view === 'calendar' && (
        <CalendarView 
          tasks={tasks} deals={deals} teamMembers={teamMembers}
          onRefreshData={refreshData} onOpenDeal={handleOpenDeal}
        />
      )}
      {view === 'messages' && <Chat currentUser={currentUser} />}
      {view === 'team' && currentUser.role === 'admin' && (
        <TeamManagement
          currentUser={currentUser} teamMembers={teamMembers}
          onTeamUpdate={(updatedTeam) => {
            setTeamMembers(updatedTeam);
            const me = updatedTeam.find(u => u.id === currentUser.id);
            if (me) setCurrentUser(me);
          }}
        />
      )}
      {view === 'profile' && (
        <Profile 
          user={currentUser} 
          onUpdate={(updatedUser) => { setCurrentUser(updatedUser); refreshData(); }}
        />
      )}

      {selectedDeal && (
        <DealRoomModal
          isOpen={!!selectedDealId}
          onClose={handleCloseDealModal}
          deal={selectedDeal}
          user={currentUser}
          teamMembers={teamMembers}
          tasks={dealTasks}
          updates={activeUpdates}
          offers={activeOffers}
          onRefreshData={refreshData}
        />
      )}

      <Modal isOpen={isNewDealModalOpen} onClose={() => setIsNewDealModalOpen(false)} title="Create New Deal">
        <div className="space-y-4">
          <InputGroup label="Client Name">
            <input className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900" value={newDealClient} onChange={e => setNewDealClient(e.target.value)} />
          </InputGroup>
          <InputGroup label="Property Address">
            <input className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900" value={newDealAddress} onChange={e => setNewDealAddress(e.target.value)} />
          </InputGroup>
          <Button className="w-full" onClick={handleCreateDeal}>Create Deal Room</Button>
        </div>
      </Modal>
    </Layout>
  );
}
