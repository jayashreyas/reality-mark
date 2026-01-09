
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, User as UserIcon, Bot, Trash2 } from 'lucide-react';
import { Button } from './Shared';
import { dataService } from '../services/dataService';
import { queryCRM } from '../services/geminiService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm Nexus, your Reality Mark AI Assistant. Ask me anything about your deals, tasks, or which clients need a follow-up today." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const crmData = await dataService.getCRMDataSnapshot();
      const response = await queryCRM(userMsg, crmData);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an issue accessing your CRM data. Please ensure your API key is configured correctly." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white shadow-2xl z-[70] flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-indigo-600 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Nexus AI</h3>
            <p className="text-[10px] uppercase tracking-widest opacity-70">Real Estate Intelligence</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
              msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-indigo-600 border border-indigo-100'
            }`}>
              {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[85%] text-sm p-3 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none whitespace-pre-wrap leading-relaxed'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 animate-pulse">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <button 
            onClick={() => setMessages([{ role: 'assistant', content: "Conversation cleared. How can I help you now?" }])}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={20} />
          </button>
          <div className="flex-1 relative">
            <input 
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-900"
              placeholder="Ask about closing soon, stuck deals..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
          </div>
          <Button 
            className="rounded-xl px-4" 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            icon={<Send size={18} />}
          />
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-3">
          Powered by Gemini 3 Pro • Contextual CRM Analysis
        </p>
      </div>
    </div>
  );
};
