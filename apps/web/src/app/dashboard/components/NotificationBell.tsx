'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAccount } from '@/context/AccountContext';

export default function NotificationBell() {
  const { mode } = useAccount();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // For now, we will simulate notifications based on your recent closed trades
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchNotifications = () => {
      apiFetch(`/api/trading/history?mode=${mode}`)
        .then((data) => {
          // Create fake notifications out of the last 5 closed trades
          const recent = data.history.slice(0, 5).map((trade: any) => ({
            id: trade.id,
            title: trade.status === 'WON' ? '🎉 Trade Won!' : trade.status === 'LOST' ? '❌ Trade Lost' : '🔒 Trade Closed',
            message: `${trade.side} ${trade.symbol} closed at ${trade.status}.`,
            time: new Date(trade.created_at).toLocaleTimeString(),
            isNew: false,
          }));
          setNotifications(recent);
        })
        .catch(console.error);
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [mode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative text-gray-400 hover:text-white transition"
      >
        <Bell size={18} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#131722] border border-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-800 bg-[#0b0e14]">
            <h3 className="text-xs font-bold text-gray-300">Notifications</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-3 border-b border-gray-800/50 hover:bg-[#1e222d] transition">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-white">{n.title}</span>
                    <span className="text-[9px] text-gray-500">{n.time}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}