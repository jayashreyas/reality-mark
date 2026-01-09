
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { ListingPipeline } from './views/ListingPipeline';
import { OfferPipeline } from './views/OfferPipeline';
import { MyTasks } from './views/MyTasks';
import { CalendarView } from './views/CalendarView';
import { TeamManagement } from './views/TeamManagement';
import { Chat } from './views/Chat';
import { Contacts } from './views/Contacts';
import { Login } from './views/Login';
import { Profile } from './views/Profile';
import { AppState, Listing, Task, User, Offer, Contact, Deal } from './types';
import { dataService } from './services/dataService';
import { Modal, InputGroup, Button } from './components/Shared';
import { SmartImportModal } from './components/SmartImportModal';
import { ListingDetailsModal } from './components/ListingDetailsModal';
import { NewListingModal } from './components/NewListingModal';

export default function App() {
  const [view, setView] = useState<AppState['view']>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data State
  const [listings, setListings] = useState<Listing[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  
  // Modal & Selection State
  const [isNewListingModalOpen, setIsNewListingModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = dataService.getUser();
    setCurrentUser(user);
    if (user) refreshData();
    else setIsLoading(false);
  }, []);

  const refreshData = async () => {
    try {
      const data = await dataService.getCRMDataSnapshot();
      setListings(data.listings);
      setTasks(data.tasks);
      setOffers(data.offers);
      setContacts(data.contacts);
      setDeals(data.deals);
      setTeamMembers(dataService.getTeamMembers());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedListing = listings.find(l => l.id === selectedListingId);

  if (!currentUser) return <Login onLogin={(u) => { setCurrentUser(u); refreshData(); }} />;
  if (isLoading) return <div className="h-screen flex items-center justify-center font-black text-indigo-600 animate-pulse bg-slate-900">BOOTING REALITY MARK...</div>;

  return (
    <Layout 
      user={currentUser} 
      currentView={view} 
      onNavigate={setView} 
      onLogout={() => { setCurrentUser(null); dataService.logout(); }}
      onOpenImport={() => setIsImportModalOpen(true)}
    >
      {view === 'dashboard' && (
        <Dashboard 
          listings={listings} tasks={tasks} user={currentUser} 
          onNavigate={setView} onOpenListing={setSelectedListingId} 
          offers={offers} onCreateListing={() => setIsNewListingModalOpen(true)}
          onRefreshData={refreshData}
        />
      )}
      {view === 'listings' && (
        <ListingPipeline 
          listings={listings} onOpenListing={setSelectedListingId} 
          onNewListing={() => setIsNewListingModalOpen(true)}
          onRefresh={refreshData}
        />
      )}
      {view === 'offers' && (
        <OfferPipeline
          offers={offers} listings={listings} currentUser={currentUser}
          onRefreshData={refreshData} onOpenListing={setSelectedListingId}
        />
      )}
      {view === 'contacts' && <Contacts contacts={contacts} onRefresh={refreshData} />}
      {view === 'mytasks' && <MyTasks tasks={tasks} deals={deals} user={currentUser} teamMembers={teamMembers} onRefreshData={refreshData} onOpenDeal={() => {}} />}
      {view === 'calendar' && <CalendarView tasks={tasks} deals={deals} teamMembers={teamMembers} onRefreshData={refreshData} onOpenDeal={() => {}} />}
      {view === 'messages' && <Chat currentUser={currentUser} />}
      {view === 'team' && <TeamManagement currentUser={currentUser} teamMembers={teamMembers} onTeamUpdate={refreshData} />}
      {view === 'profile' && <Profile user={currentUser} onUpdate={refreshData} />}

      {isNewListingModalOpen && (
        <NewListingModal 
          isOpen={isNewListingModalOpen} 
          onClose={() => setIsNewListingModalOpen(false)} 
          currentUser={currentUser} 
          onSuccess={refreshData} 
        />
      )}

      <SmartImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={refreshData} 
      />

      {selectedListing && (
        <ListingDetailsModal 
          isOpen={!!selectedListing} 
          onClose={() => setSelectedListingId(null)} 
          listing={selectedListing} 
          currentUser={currentUser} 
          onRefresh={refreshData}
        />
      )}
    </Layout>
  );
}
