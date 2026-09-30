import React from 'react';
import { LogOut, User as UserIcon, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
      {/* Left: Tenant Branding Indicator */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-800 text-sm">
            {user?.school ? user.school.name : 'System Platform Console'}
          </span>
          {user?.school && (
            <Badge variant="info" size="sm">
              Tenant: {user.school.code}
            </Badge>
          )}
          {user?.school?.board && (
            <Badge variant="neutral" size="sm">
              {user.school.board}
            </Badge>
          )}
        </div>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs border border-indigo-200">
            {user?.firstName ? user.firstName[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">
              {user?.firstName} {user?.lastName}
            </p>
            <div className="flex items-center space-x-1 mt-0.5">
              <Shield className="w-3 h-3 text-indigo-600" />
              <span className="text-[11px] text-slate-500 font-medium">{user?.role?.name}</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
