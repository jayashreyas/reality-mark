
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User, ChatChannel } from '../types';
import { Button, Modal, InputGroup } from '../components/Shared';
import { 
  Send, Search, MoreVertical, Phone, Video, 
  Smile, Paperclip, Mic, Check, CheckCheck, 
  Users, Hash, Coffee, Target, ArrowLeft, MessageSquarePlus, Trash2, X
} from 'lucide-react';
import { dataService } from '../services/dataService';

interface ChatProps {
  currentUser: User;
}

export const Chat: React.FC<ChatProps> = ({ currentUser }) => {
  const [activeChannel, setActiveChannel] = useState('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]); // To compute last messages
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Channel Creation State
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  
  // Chat Header Interactions
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching ---

  const fetchData = async () => {
    // Fetch channels
    const fetchedChannels = await dataService.getChannels();
    setChannels(fetchedChannels);

    // Fetch messages for active channel
    const currentChannelMsgs = await dataService.getMessages(activeChannel);
    
    // Fetch all messages for previews (Mock efficiency hack)
    const all: ChatMessage[] = [];
    for (const ch of fetchedChannels) {
      const msgs = await dataService.getMessages(ch.id);
      all.push(...msgs);
    }
    
    setMessages(currentChannelMsgs);
    setAllMessages(all);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000); // 1s polling for "reactive" feel
    return () => clearInterval(interval);
  }, [activeChannel]);

  useEffect(() => {
    // Only auto-scroll if not searching to prevent jumping around while looking for old messages
    if (!messageSearchTerm) {
      scrollToBottom();
    }
  }, [messages, messageSearchTerm]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    // Optimistic update
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      channelId: activeChannel,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userInitials: currentUser.initials,
      content: newMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');

    await dataService.sendMessage({
      channelId: activeChannel,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userInitials: currentUser.initials,
      content: tempMsg.content,
    });
    
    // Refetch to confirm
    fetchData();
    scrollToBottom();
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    const newChan = await dataService.createChannel(newChannelName);
    setChannels(prev => [...prev, newChan]);
    setActiveChannel(newChan.id);
    setNewChannelName('');
    setIsCreateChannelModalOpen(false);
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear all messages in this chat? This cannot be undone.')) {
      await dataService.clearMessages(activeChannel);
      setMessages([]);
      setIsMenuOpen(false);
    }
  };

  // --- Helpers ---

  const getLastMessage = (channelId: string) => {
    const channelMsgs = allMessages
      .filter(m => m.channelId === channelId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return channelMsgs[0];
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatListTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Helper to generate visual props for channels based on name/ID
  const getChannelVisuals = (channel: ChatChannel) => {
    const colors = [
      'bg-emerald-100 text-emerald-600',
      'bg-blue-100 text-blue-600',
      'bg-amber-100 text-amber-600',
      'bg-purple-100 text-purple-600',
      'bg-pink-100 text-pink-600'
    ];
    // Deterministic visual generation
    const colorIndex = (channel.name.length + channel.id.length) % colors.length;
    const color = colors[colorIndex];
    
    let icon = <Hash size={20} />;
    if (channel.name.toLowerCase().includes('lead')) icon = <Target size={20} />;
    else if (channel.name.toLowerCase().includes('random')) icon = <Coffee size={20} />;
    
    return { color, icon };
  };

  const activeChannelObj = channels.find(c => c.id === activeChannel);
  const activeChannelVisuals = activeChannelObj ? getChannelVisuals(activeChannelObj) : { color: 'bg-gray-200', icon: <Hash /> };
  
  // Filters
  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const displayedMessages = messages.filter(m => m.content.toLowerCase().includes(messageSearchTerm.toLowerCase()));

  return (
    <div className="flex h-full bg-gray-100 relative overflow-hidden" onClick={() => { if(isMenuOpen) setIsMenuOpen(false); }}>
      {/* Background Decor Layer (Top Green Strip) */}
      <div className="absolute top-0 left-0 w-full h-32 bg-[#00a884] z-0"></div>

      {/* Main App Window */}
      <div className="relative z-10 w-full h-full max-w-[1600px] mx-auto xl:my-4 xl:h-[calc(100%-2rem)] xl:rounded-xl xl:shadow-lg flex bg-white overflow-hidden">
        
        {/* Left Sidebar */}
        <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col border-r border-gray-200 bg-white">
          {/* Sidebar Header */}
          <div className="h-16 bg-[#f0f2f5] px-4 flex items-center justify-between flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-90 transition-opacity">
              {currentUser.initials}
            </div>
            <div className="flex gap-4 text-gray-500">
              <button className="hover:bg-gray-200 p-2 rounded-full transition-colors"><Users size={20} /></button>
              <button 
                className="hover:bg-gray-200 p-2 rounded-full transition-colors text-gray-600"
                onClick={() => setIsCreateChannelModalOpen(true)}
                title="New Channel"
              >
                <MessageSquarePlus size={20} />
              </button>
              <button className="hover:bg-gray-200 p-2 rounded-full transition-colors"><MoreVertical size={20} /></button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-3 py-2 bg-white border-b border-gray-100">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-3">
              <Search size={18} className="text-gray-400" />
              <input 
                className="bg-transparent w-full text-sm outline-none placeholder-gray-500 text-gray-900"
                placeholder="Search or start new chat"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChannels.map(channel => {
              const lastMsg = getLastMessage(channel.id);
              const visuals = getChannelVisuals(channel);
              return (
                <div 
                  key={channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 hover:bg-[#f5f6f6] ${activeChannel === channel.id ? 'bg-[#f0f2f5]' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${visuals.color}`}>
                    {visuals.icon}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-medium text-gray-900 truncate">#{channel.name}</span>
                      {lastMsg && (
                        <span className="text-xs text-gray-500 flex-shrink-0">{formatListTime(lastMsg.timestamp)}</span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 truncate">
                      {lastMsg ? (
                        <>
                          {lastMsg.userId === currentUser.id && <CheckCheck size={14} className="mr-1 text-gray-400" />}
                          <span className="truncate">
                            {lastMsg.userId === currentUser.id ? '' : <span className="font-semibold text-gray-600 mr-1">{lastMsg.userName}: </span>}
                            {lastMsg.content}
                          </span>
                        </>
                      ) : (
                        <span className="italic opacity-60">No messages yet</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="p-3 text-center text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
            End-to-end encrypted (Simulated)
          </div>
        </div>

        {/* Right Main Chat Area */}
        <div className="flex-1 flex flex-col bg-[#efeae2] relative">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none z-0" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239ca3af' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")` 
          }}></div>

          {/* Header */}
          <div className="h-16 bg-[#f0f2f5] border-b border-gray-200 px-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${activeChannelVisuals.color.split(' ')[0]}`}>
                {activeChannelVisuals.icon}
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="font-semibold text-gray-900 leading-tight">#{activeChannelObj?.name || 'Loading...'}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  click here for group info
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-gray-500 relative">
               {isSearchOpen ? (
                 <div className="flex items-center bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-200 animate-in fade-in slide-in-from-right-4">
                   <input 
                      className="text-sm outline-none w-40 text-gray-700 bg-white" 
                      placeholder="Search messages..."
                      value={messageSearchTerm}
                      onChange={(e) => setMessageSearchTerm(e.target.value)}
                      autoFocus
                   />
                   <button onClick={() => { setIsSearchOpen(false); setMessageSearchTerm(''); }} className="ml-1 text-gray-400 hover:text-gray-600">
                     <X size={16} />
                   </button>
                 </div>
               ) : (
                 <button className="hover:bg-gray-200 p-2 rounded-full transition-colors" onClick={() => setIsSearchOpen(true)}>
                   <Search size={20} />
                 </button>
               )}
               
               <div className="relative">
                 <button 
                    className="hover:bg-gray-200 p-2 rounded-full transition-colors"
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                 >
                   <MoreVertical size={20} />
                 </button>
                 
                 {isMenuOpen && (
                   <div className="absolute right-0 top-10 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 z-50 animate-in fade-in zoom-in-95">
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Group Info</button>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Select Messages</button>
                      <button 
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        onClick={(e) => { e.stopPropagation(); handleClearChat(); }}
                      >
                         <Trash2 size={14} /> Clear Chat
                      </button>
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 z-10" style={{ scrollBehavior: 'smooth' }}>
            {displayedMessages.length === 0 && (
              <div className="flex justify-center my-8">
                 <div className="bg-[#fff5c4] text-gray-800 text-xs px-3 py-1.5 rounded-lg shadow-sm">
                    {messageSearchTerm ? 'No messages found matching your search.' : 'Messages are end-to-end encrypted. No one outside of this chat, not even Reality Mark, can read or listen to them.'}
                 </div>
              </div>
            )}
            
            {displayedMessages.map((msg, index) => {
              const isMe = msg.userId === currentUser.id;
              // Check if previous message exists in displayed list to group correctly
              const prevMsg = index > 0 ? displayedMessages[index - 1] : null;
              const isSameUser = prevMsg && prevMsg.userId === msg.userId;
              
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`}>
                  <div 
                    className={`relative max-w-[85%] md:max-w-[65%] px-3 py-1.5 shadow-sm text-sm
                      ${isMe ? 'bg-[#d9fdd3] rounded-l-lg rounded-tr-none rounded-br-lg' : 'bg-white rounded-r-lg rounded-tl-none rounded-bl-lg'} 
                      ${isSameUser ? (isMe ? 'rounded-tr-lg' : 'rounded-tl-lg') : ''}
                      ${!isSameUser ? 'mt-1' : ''}
                    `}
                  >
                    {/* Tail SVG */}
                    {!isSameUser && (
                       <div className={`absolute top-0 ${isMe ? '-right-2' : '-left-2'} w-3 h-3 overflow-hidden`}>
                         <div className={`w-4 h-4 transform ${isMe ? 'rotate-45 bg-[#d9fdd3]' : '-rotate-45 bg-white'} absolute top-1 ${isMe ? '-left-2' : 'left-2'}`}></div>
                       </div>
                    )}
                    
                    {!isMe && !isSameUser && (
                       <p className={`text-xs font-bold mb-0.5 ${['text-orange-500', 'text-pink-500', 'text-purple-500', 'text-blue-500'][msg.userName.length % 4]}`}>
                         {msg.userName}
                       </p>
                    )}
                    
                    <div className="flex flex-wrap items-end gap-x-2 relative z-10">
                       <span className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                         {/* Simple highlighting if searching */}
                         {messageSearchTerm ? (
                           msg.content.split(new RegExp(`(${messageSearchTerm})`, 'gi')).map((part, i) => 
                             part.toLowerCase() === messageSearchTerm.toLowerCase() ? <span key={i} className="bg-yellow-200 text-black">{part}</span> : part
                           )
                         ) : msg.content}
                       </span>
                       <span className="text-[10px] text-gray-500 flex items-center gap-1 self-end ml-auto min-w-fit">
                         {formatTime(msg.timestamp)}
                         {isMe && <CheckCheck size={14} className="text-[#53bdeb]" />}
                       </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="bg-[#f0f2f5] px-4 py-2 flex items-center gap-2 z-10">
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Smile size={24} />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Paperclip size={24} />
            </button>
            <div className="flex-1 bg-white rounded-lg px-4 py-2 flex items-center">
              <input
                className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500"
                placeholder="Type a message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
            </div>
            {newMessage.trim() ? (
              <button 
                onClick={handleSend}
                className="p-2 text-[#00a884] hover:bg-gray-200 rounded-full transition-colors"
              >
                <Send size={24} />
              </button>
            ) : (
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <Mic size={24} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Create Channel Modal */}
      <Modal 
        isOpen={isCreateChannelModalOpen} 
        onClose={() => setIsCreateChannelModalOpen(false)} 
        title="Create New Channel"
      >
        <div className="space-y-4">
          <InputGroup label="Channel Name">
            <input 
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Project X"
              value={newChannelName}
              onChange={e => setNewChannelName(e.target.value)}
              autoFocus
            />
          </InputGroup>
          <div className="pt-2">
            <Button className="w-full" onClick={handleCreateChannel}>Create Channel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
