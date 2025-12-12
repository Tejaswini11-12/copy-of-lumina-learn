import React from 'react';
import { Search, Bell } from 'lucide-react';
import { View } from '../types';

interface TopBarProps {
  onProfileClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onProfileClick }) => {
  return (
    <div className="h-20 w-full flex justify-between items-center px-8 mb-4">
       <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mint-100 shadow-sm"
          />
       </div>

       <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
             <Bell size={20} />
             <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-400 rounded-full border border-white"></span>
          </button>

          <button 
            onClick={onProfileClick}
            className="w-10 h-10 rounded-full bg-yellow-100 border-2 border-white shadow-sm overflow-hidden hover:scale-105 transition-transform"
          >
            <img src="https://picsum.photos/100/100" alt="User" className="w-full h-full object-cover" />
          </button>
       </div>
    </div>
  );
};

export default TopBar;