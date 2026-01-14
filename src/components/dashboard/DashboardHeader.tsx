'use client';

import Image from 'next/image';
import { LogOut, User } from 'lucide-react';
import { Church, ChurchLeader } from '@/lib/types';

interface DashboardHeaderProps {
  church: Church;
  leader: ChurchLeader;
  isAdmin: boolean;
  onLogout: () => void;
}

export default function DashboardHeader({ church, leader, isAdmin, onLogout }: DashboardHeaderProps) {
  return (
    <header className="bg-navy text-white py-4 px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {church.logo_url && (
            <Image
              src={church.logo_url}
              alt={church.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
          <div>
            <p className="text-gold font-medium text-sm tracking-wide">DNA ROADMAP</p>
            <p className="font-semibold">{church.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <User className="w-4 h-4" />
            <span>{leader.name}</span>
            {isAdmin && (
              <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-medium">
                Admin
              </span>
            )}
          </div>
          <button
            onClick={onLogout}
            className="text-gray-300 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
