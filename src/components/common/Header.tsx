import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_USERS } from '../../data/mockData';
import { 
  Building2, 
  ChevronDown, 
  LogOut, 
  Check,
  Shield,
  BookOpen
} from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { 
    currentUser, 
    branches, 
    activeBranchId, 
    setActiveBranchId, 
    loginAs,
    logout,
    setIsGuideOpen,
    showToast
  } = useApp();

  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const isOwner = currentUser.role === 'chucuahang';

  const handleBranchSelect = (id: string) => {
    setActiveBranchId(id);
    setIsBranchDropdownOpen(false);
    const bName = id === 'all' ? 'Toàn chuỗi (Tất cả chi nhánh)' : branches.find(b => b.id === id)?.name;
    showToast(`Đã chuyển không gian làm việc sang: ${bName}`);
  };

  const handleRoleSwitch = (username: string) => {
    setIsUserDropdownOpen(false);
    loginAs(username);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Dynamic Header Title */}
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs text-slate-500 font-normal truncate max-w-xl">{subtitle}</p>
      </div>

      {/* Right Controls: Branch Selector, Role Switcher */}
      <div className="flex items-center gap-2.5">
        {/* Branch Selector */}
        <div className="relative">
          <button
            onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
            title="Chọn chi nhánh làm việc"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-800" />
            <span className="max-w-[190px] truncate">
              {activeBranchId === 'all' 
                ? 'Toàn chuỗi (Xem tổng hợp)' 
                : (branches.find(b => b.id === activeBranchId)?.name?.split('—')[0] || 'Chọn chi nhánh')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isBranchDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Chi nhánh làm việc
              </div>

              {isOwner ? (
                <>
                  <button
                    onClick={() => handleBranchSelect('all')}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                      activeBranchId === 'all' ? 'text-emerald-900 font-bold bg-emerald-50/70' : 'text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
                      Toàn chuỗi (Tổng hợp 3 chi nhánh)
                    </span>
                    {activeBranchId === 'all' && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </button>

                  {branches.map(branch => (
                    <button
                      key={branch.id}
                      onClick={() => handleBranchSelect(branch.id)}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                        activeBranchId === branch.id ? 'text-emerald-900 font-bold bg-emerald-50/70' : 'text-slate-700'
                      }`}
                    >
                      <span className="truncate pr-2">{branch.name}</span>
                      {activeBranchId === branch.id && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-3.5 py-2 space-y-2 text-xs">
                  <div className="font-bold text-slate-800">
                    {branches.find(b => b.id === currentUser.branchId)?.name}
                  </div>
                  <div className="p-2 bg-amber-50 text-amber-900 rounded-lg text-[11px] leading-relaxed">
                    Tài khoản <strong>{currentUser.roleLabel}</strong> được phân công cố định tại chi nhánh này theo phân quyền hệ thống.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Switcher / Logout */}
        <div className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-2 p-1.5 pl-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline max-w-[120px] truncate">
              {currentUser.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 text-xs">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <div className="font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-[11px] text-emerald-800 font-semibold">{currentUser.roleLabel}</div>
              </div>

              <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Chuyển vai trò trải nghiệm
              </div>

              {DEMO_USERS.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleRoleSwitch(u.username)}
                  className={`w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                    currentUser.username === u.username ? 'text-emerald-900 font-bold bg-emerald-50/70' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs">{u.name}</div>
                    <div className="text-[10px] text-slate-400">{u.roleLabel}</div>
                  </div>
                  {currentUser.username === u.username && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                </button>
              ))}

              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  onClick={logout}
                  className="w-full text-left px-3.5 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-semibold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
