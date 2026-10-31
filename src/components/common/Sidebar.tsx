import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ClipboardCheck, 
  ChefHat, 
  ReceiptText, 
  BarChart3, 
  ShieldCheck, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  X
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { 
    currentUser, 
    currentNav, 
    setCurrentNav, 
    setActiveTab, 
    setViewDetailsId, 
    approvals,
    setIsGuideOpen,
    resetAllData
  } = useApp();

  const [isWarehouseExpanded, setIsWarehouseExpanded] = useState(true);
  const [isDemoSupportExpanded, setIsDemoSupportExpanded] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;

  const handleNavClick = (navId: string, defaultTab: string = '') => {
    setCurrentNav(navId);
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
    setViewDetailsId(null);
  };

  const isWarehouseActive = ['nguyen-vat-lieu', 'nhap-kho', 'xuat-kho', 'kiem-ke'].includes(currentNav);

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col shrink-0 h-screen sticky top-0 select-none z-10">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200/80 bg-white flex items-center justify-center p-0.5 shrink-0 shadow-xs">
          <img
            src="/assets/aistudio/Logo_Tr_nh_2025-01_33bdceba.jpg"
            alt="Trình Cà Phê"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-sm text-slate-900 tracking-tight">
            TRÌNH CÀ PHÊ
          </div>
          <p className="text-[11px] text-emerald-800 font-semibold truncate">Kho & Nguyên vật liệu</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {/* 1. Trang chính theo vai trò (MH02-MH05) */}
        <button
          onClick={() => handleNavClick('tong-quan')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            currentNav === 'tong-quan'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>
            {currentUser.role === 'nhanvien' ? 'Trang chính Nhân viên' : 
             currentUser.role === 'ketoan' ? 'Trang chính Kế toán' : 'Tổng quan hoạt động'}
          </span>
        </button>

        {/* 2. Kho hàng (Nhóm mẹ collapsible) */}
        {['chucuahang', 'quanly', 'nhanvien'].includes(currentUser.role) && (
          <div className="pt-1">
            <button
              onClick={() => setIsWarehouseExpanded(!isWarehouseExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isWarehouseActive
                  ? 'text-emerald-900 font-bold bg-emerald-50/60'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4 text-emerald-700" />
                <span>Kho hàng</span>
              </div>
              {isWarehouseExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {isWarehouseExpanded && (
              <div className="mt-1 ml-3 pl-3 border-l-2 border-slate-200/80 space-y-0.5">
                {/* Nguyên vật liệu (Chủ, Quản lý) */}
                {['chucuahang', 'quanly'].includes(currentUser.role) && (
                  <button
                    onClick={() => handleNavClick('nguyen-vat-lieu')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      currentNav === 'nguyen-vat-lieu'
                        ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 shrink-0" />
                    <span>Nguyên vật liệu</span>
                  </button>
                )}

                {/* Nhập kho (Chủ, Quản lý, Nhân viên) */}
                <button
                  onClick={() => handleNavClick('nhap-kho')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentNav === 'nhap-kho'
                      ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <ArrowDownToLine className="w-3.5 h-3.5 shrink-0" />
                  <span>Nhập kho</span>
                </button>

                {/* Xuất kho (Chủ, Quản lý, Nhân viên) */}
                <button
                  onClick={() => handleNavClick('xuat-kho')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentNav === 'xuat-kho'
                      ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5 shrink-0" />
                  <span>Xuất kho</span>
                </button>

                {/* Kiểm kê (Chủ, Quản lý, Nhân viên) */}
                <button
                  onClick={() => handleNavClick('kiem-ke')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentNav === 'kiem-ke'
                      ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Kiểm kê</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Định mức tồn tối thiểu (MH07) */}
        {['chucuahang', 'quanly'].includes(currentUser.role) && (
          <button
            onClick={() => handleNavClick('dinh-muc', 'dinh-muc')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentNav === 'dinh-muc'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Định mức tồn</span>
          </button>
        )}

        {/* 4. Công thức pha chế (MH08) */}
        {['chucuahang', 'quanly'].includes(currentUser.role) && (
          <button
            onClick={() => handleNavClick('cong-thuc', 'cong-thuc')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentNav === 'cong-thuc'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <ChefHat className="w-4 h-4 shrink-0" />
            <span>Công thức món</span>
          </button>
        )}

        {/* 5. Dữ liệu bán hàng (MH14 - Chủ, Kế toán) */}
        {['chucuahang', 'ketoan'].includes(currentUser.role) && (
          <button
            onClick={() => handleNavClick('du-lieu-ban-hang')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentNav === 'du-lieu-ban-hang'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <ReceiptText className="w-4 h-4 shrink-0" />
            <span>Dữ liệu bán hàng</span>
          </button>
        )}

        {/* 6. Báo cáo Tồn kho & Hao hụt (MH15-MH16 - Chủ, Kế toán) */}
        {['chucuahang', 'ketoan'].includes(currentUser.role) && (
          <button
            onClick={() => handleNavClick('bao-cao', 'ton-kho')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentNav === 'bao-cao'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Báo cáo kho & hao hụt</span>
          </button>
        )}

        {/* 7. Phê duyệt (MH17-MH18 - Duy nhất Chủ cửa hàng) */}
        {currentUser.role === 'chucuahang' && (
          <button
            onClick={() => handleNavClick('phe-duyet', 'dieu-chinh-ton')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentNav === 'phe-duyet'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Phê duyệt</span>
            </div>
            {pendingApprovalsCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentNav === 'phe-duyet' ? 'bg-white text-emerald-900' : 'bg-amber-500 text-white'
              }`}>
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        )}
      </nav>

      {/* Collapsible Demo Support Panel */}
      <div className="px-3 pb-2">
        <div className="border border-slate-200/90 rounded-xl bg-slate-50/80 p-2 text-xs">
          <button
            onClick={() => setIsDemoSupportExpanded(!isDemoSupportExpanded)}
            className="w-full flex items-center justify-between font-bold text-slate-700 hover:text-emerald-800 text-[11px]"
          >
            <span>Hỗ trợ bản demo</span>
            {isDemoSupportExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {isDemoSupportExpanded && (
            <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5 animate-in fade-in">
              <button
                onClick={() => setIsGuideOpen(true)}
                className="w-full text-left p-1.5 text-[11px] text-emerald-800 hover:bg-white rounded-lg flex items-center gap-1.5 font-medium transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tài liệu bàn giao & 18 MH</span>
              </button>
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="w-full text-left p-1.5 text-[11px] text-slate-600 hover:text-rose-700 hover:bg-white rounded-lg flex items-center gap-1.5 font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục dữ liệu mẫu</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Role and User Profile Footer */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</div>
            <div className="text-[11px] text-emerald-800 font-semibold truncate">{currentUser.roleLabel}</div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-3 text-xs animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-700 font-bold">
              <RotateCcw className="w-4 h-4" />
              <span>Xác nhận khôi phục dữ liệu mẫu</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Thao tác này sẽ đặt lại toàn bộ dữ liệu phiếu nhập, xuất, kiểm kê, công thức và phê duyệt về trạng thái demo ban đầu. Bạn có chắc chắn muốn thực hiện?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-semibold"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
