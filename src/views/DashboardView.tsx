import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  AlertTriangle, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Boxes, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  ReceiptText, 
  BarChart3, 
  ClipboardCheck, 
  FileCheck,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    currentUser, 
    activeBranchId, 
    branches, 
    materials, 
    importSlips, 
    exportSlips, 
    approvals, 
    salesRecords,
    setCurrentNav, 
    setActiveTab, 
    setViewDetailsId 
  } = useApp();

  const isOwner = currentUser.role === 'chucuahang';
  const isManager = currentUser.role === 'quanly';
  const isAccountant = currentUser.role === 'ketoan';
  const isStaff = currentUser.role === 'nhanvien';

  // Compute key stock metrics based on activeBranchId (Số lượng, KHÔNG TÍNH TIỀN)
  const getBranchStock = (mat: typeof materials[0]) => {
    if (activeBranchId === 'all') {
      return Object.values(mat.stocks).reduce((sum, s) => sum + (s?.total || 0), 0);
    }
    return mat.stocks[activeBranchId]?.total || 0;
  };

  const getBranchMinStock = (mat: typeof materials[0]) => {
    if (activeBranchId === 'all') {
      return Object.values(mat.minStocks).reduce<number>((sum, s) => sum + (s !== null && s !== undefined ? s : 0), 0);
    }
    const val = mat.minStocks[activeBranchId];
    return val !== null && val !== undefined ? val : null;
  };

  // Low stock materials
  const lowStockMaterials = materials.filter(m => {
    if (m.status !== 'active') return false;
    const stock = getBranchStock(m);
    const min = getBranchMinStock(m);
    return min !== null && stock <= min;
  });

  // Pending actions
  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const awaitingInspectionImports = importSlips.filter(s => 
    s.status === 'approved' && (activeBranchId === 'all' || s.branchId === activeBranchId)
  );
  const awaitingExportConfirmations = exportSlips.filter(s => 
    s.status === 'pending' && (activeBranchId === 'all' || s.branchId === activeBranchId)
  );

  // Recent sales record (dành cho Kế toán & Chủ)
  const branchSalesRecords = salesRecords.filter(r => activeBranchId === 'all' || r.branchId === activeBranchId);
  const latestSalesRecord = branchSalesRecords[0] || null;

  // Active materials count
  const activeMaterialsCount = materials.filter(m => m.status === 'active').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* =========================================================================
          TRANG CHÍNH NHÂN VIÊN (MH02)
          Giao diện riêng với 3 lối tắt: Nhập kho, Xuất kho, Kiểm kê
         ========================================================================= */}
      {isStaff && (
        <div className="space-y-6">
          {/* Welcome banner for Staff */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 rounded-2xl p-6 text-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-semibold text-emerald-100 uppercase tracking-wider">
                  Trang làm việc Nhân viên kho & quầy
                </span>
                <h2 className="text-xl font-bold mt-2">Xin chào, {currentUser.name}!</h2>
                <p className="text-xs text-emerald-100/90 mt-1">
                  Khu vực thao tác nhận hàng, thực xuất và kiểm kê thực tế tại {branches.find(b => b.id === currentUser.branchId)?.name}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs bg-white/10 px-4 py-2.5 rounded-xl backdrop-blur-xs">
                <Building2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Chi nhánh cố định: <strong>{branches.find(b => b.id === currentUser.branchId)?.name?.split('—')[0]}</strong></span>
              </div>
            </div>
          </div>

          {/* 3 Prominent Shortcuts for Staff */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Lối tắt nghiệp vụ chính
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Shortcut 1: Nhập kho */}
              <button
                onClick={() => setCurrentNav('nhap-kho')}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-emerald-700 hover:shadow-md transition-all text-left group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                    <ArrowDownToLine className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-900">1. Nhập kho & Kiểm nhận</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Ghi nhận nhận hàng thực tế từ nhà cung cấp, kiểm tra chất lượng và số lượng đạt.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
                  <span>{awaitingInspectionImports.length} phiếu chờ kiểm nhận</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Shortcut 2: Xuất kho */}
              <button
                onClick={() => setCurrentNav('xuat-kho')}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-emerald-700 hover:shadow-md transition-all text-left group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-4 group-hover:bg-blue-800 group-hover:text-white transition-colors">
                    <ArrowUpFromLine className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-900">2. Xuất kho & Giao quầy</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Xác nhận thực xuất nguyên liệu cấp quầy pha chế hoặc ghi nhận xuất hủy hỏng.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-800">
                  <span>{awaitingExportConfirmations.length} phiếu chờ thực xuất</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Shortcut 3: Kiểm kê */}
              <button
                onClick={() => setCurrentNav('kiem-ke')}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-emerald-700 hover:shadow-md transition-all text-left group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center mb-4 group-hover:bg-purple-800 group-hover:text-white transition-colors">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-purple-900">3. Kiểm kê thực tế</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Đếm số lượng thực tế tại kho và quầy bar, lưu nháp hoặc xác nhận kết quả đếm.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-800">
                  <span>Mẫu kiểm đếm mù (không thấy lý thuyết)</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>

          {/* Pending tasks queue for Staff */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Đơn cần kiểm nhận & thực xuất</span>
              <span className="text-xs font-semibold text-slate-500">
                {awaitingInspectionImports.length + awaitingExportConfirmations.length} việc cần làm
              </span>
            </h3>

            <div className="divide-y divide-slate-100">
              {awaitingInspectionImports.map(slip => (
                <div key={slip.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 mr-2">
                      Nhập kho
                    </span>
                    <strong className="text-slate-900">{slip.code}</strong> — {slip.supplier}
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Dự kiến nhận: {slip.expectedDate} • {slip.items.length} mặt hàng
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentNav('nhap-kho');
                      setViewDetailsId(slip.id);
                    }}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shrink-0"
                  >
                    Kiểm nhận hàng
                  </button>
                </div>
              ))}

              {awaitingExportConfirmations.map(slip => (
                <div key={slip.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 mr-2">
                      Xuất kho
                    </span>
                    <strong className="text-slate-900">{slip.code}</strong> — {slip.reason}
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Ngày lập: {slip.requestDate} • {slip.items.length} mặt hàng
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentNav('xuat-kho');
                      setViewDetailsId(slip.id);
                    }}
                    className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shrink-0"
                  >
                    Xác nhận thực xuất
                  </button>
                </div>
              ))}

              {awaitingInspectionImports.length === 0 && awaitingExportConfirmations.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                  <span>Không có đơn hàng chờ kiểm nhận hoặc thực xuất tại chi nhánh của bạn.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TRANG CHÍNH KẾ TOÁN (MH04)
          Tập trung vào: Dữ liệu bán hàng, Kỳ gần nhất, Báo cáo tồn kho, Báo cáo hao hụt.
          KHÔNG CÓ "Kiểm nhận" hoặc "Xác nhận xuất"!
         ========================================================================= */}
      {isAccountant && (
        <div className="space-y-6">
          {/* Welcome banner for Accountant */}
          <div className="bg-gradient-to-r from-teal-900 via-emerald-800 to-slate-800 rounded-2xl p-6 text-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-semibold text-teal-100 uppercase tracking-wider">
                  Trang làm việc Kế toán kho & hao hụt
                </span>
                <h2 className="text-xl font-bold mt-2">Xin chào, {currentUser.name}!</h2>
                <p className="text-xs text-teal-100/90 mt-1">
                  Nhập dữ liệu bán hàng POS, tính tiêu hao lý thuyết và đối chiếu hao hụt thực tế tại {branches.find(b => b.id === currentUser.branchId)?.name}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs bg-white/10 px-4 py-2.5 rounded-xl backdrop-blur-xs">
                <Building2 className="w-4 h-4 text-teal-300 shrink-0" />
                <span>Chi nhánh phân công: <strong>{branches.find(b => b.id === currentUser.branchId)?.name?.split('—')[0]}</strong></span>
              </div>
            </div>
          </div>

          {/* 4 Dedicated Cards for Accountant */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Item 1: Nhập dữ liệu bán hàng */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                  <ReceiptText className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Nhập dữ liệu bán hàng</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Nhập file Excel từ KiotViet hoặc FAB PDA theo ca, ngày hoặc tháng.
                </p>
              </div>
              <button
                onClick={() => setCurrentNav('du-lieu-ban-hang')}
                className="mt-4 w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Nhập file Excel</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Item 2: Kỳ dữ liệu gần nhất */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Kỳ dữ liệu gần nhất</h4>
                {latestSalesRecord ? (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs font-bold text-emerald-900 truncate">{latestSalesRecord.period}</div>
                    <div className="text-[11px] text-slate-500">Nguồn: {latestSalesRecord.source}</div>
                    <div className="text-[11px] text-slate-500">Món bán: {latestSalesRecord.items.reduce((s, i) => s + i.quantity, 0)} ly/phần</div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 mt-1">Chưa có dữ liệu bán hàng được nạp.</p>
                )}
              </div>
              <button
                onClick={() => setCurrentNav('du-lieu-ban-hang')}
                className="mt-4 w-full py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Xem lịch sử kỳ bán
              </button>
            </div>

            {/* Item 3: Xem báo cáo tồn kho */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center mb-3">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Xem báo cáo tồn kho</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Báo cáo số lượng tồn theo nguyên vật liệu và đơn vị tính (kg, lon, hộp, cái).
                </p>
              </div>
              <button
                onClick={() => {
                  setCurrentNav('bao-cao');
                  setActiveTab('ton-kho');
                }}
                className="mt-4 w-full py-2 bg-purple-800 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Báo cáo tồn kho</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Item 4: Xem báo cáo hao hụt */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-800 flex items-center justify-center mb-3">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Xem báo cáo hao hụt</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Đối chiếu Tồn lý thuyết − Tồn thực tế theo công thức và ngưỡng hao hụt cho phép.
                </p>
              </div>
              <button
                onClick={() => {
                  setCurrentNav('bao-cao');
                  setActiveTab('hao-hut');
                }}
                className="mt-4 w-full py-2 bg-orange-800 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Báo cáo đối chiếu</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TRANG CHÍNH QUẢN LÝ (MH03) & CHỦ CỬA HÀNG (MH05)
          Theo dõi số lượng tồn kho, cảnh báo an toàn và việc cần xử lý (KHÔNG CÓ TIỀN)
         ========================================================================= */}
      {(isOwner || isManager) && (
        <div className="space-y-6">
          {/* Key Quantity & Operational Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Tổng nguyên vật liệu đang quản lý */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Nguyên vật liệu theo dõi</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900">
                {activeMaterialsCount} <span className="text-xs font-normal text-slate-500">mặt hàng</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {activeBranchId === 'all' ? 'Toàn chuỗi 3 chi nhánh' : branches.find(b => b.id === activeBranchId)?.name?.split('—')[0]}
              </div>
            </div>

            {/* Card 2: Cảnh báo tồn dưới mức an toàn */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Tồn dưới định mức an toàn</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  lowStockMaterials.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-400'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900 flex items-baseline gap-2">
                <span>{lowStockMaterials.length}</span>
                <span className="text-xs font-normal text-slate-500">nguyên liệu chạm ngưỡng</span>
              </div>
              <div className="mt-1 text-xs text-amber-700 font-medium">
                {lowStockMaterials.length > 0 ? 'Cần lập kế hoạch nhập bổ sung' : 'Tất cả đảm bảo định mức an toàn'}
              </div>
            </div>

            {/* Card 3: Phê duyệt (Chủ) hoặc Phiếu chờ kiểm hàng */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {isOwner ? 'Đề xuất chờ phê duyệt' : 'Phiếu nhập chờ kiểm hàng'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900">
                {isOwner ? pendingApprovals.length : awaitingInspectionImports.length}
              </div>
              <div className="mt-1 text-xs text-blue-700 font-medium">
                {isOwner ? 'Yêu cầu Chủ xem xét' : 'Sẵn sàng kiểm nhận hàng'}
              </div>
            </div>

            {/* Card 4: Phiếu xuất chờ thực xuất */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Phiếu xuất chờ thực xuất</span>
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
                  <ArrowUpFromLine className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900">
                {awaitingExportConfirmations.length}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Cấp quầy pha chế & xuất hủy
              </div>
            </div>
          </div>

          {/* Action queue & Quick shortcuts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Action Queue */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nhiệm vụ cần xử lý ngay</h3>
                  <p className="text-xs text-slate-500">Các hạng mục cần kiểm tra hoặc phê duyệt</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800">
                  {isOwner 
                    ? pendingApprovals.length + awaitingInspectionImports.length + awaitingExportConfirmations.length 
                    : awaitingInspectionImports.length + awaitingExportConfirmations.length} việc
                </span>
              </div>

              <div className="divide-y divide-slate-100 mt-2">
                {/* Approvals for Owner */}
                {isOwner && pendingApprovals.map(appr => (
                  <div key={appr.id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 rounded-lg px-2 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {appr.type === 'stock_adjustment' ? 'Điều chỉnh tồn' : appr.type === 'import_plan' ? 'Kế hoạch nhập' : 'Công thức/định mức'}
                        </span>
                        <span className="text-xs font-semibold text-slate-900">{appr.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {appr.branchName} • Đề xuất bởi {appr.requesterName} ({appr.requestedAt})
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentNav('phe-duyet');
                        setActiveTab(
                          appr.type === 'stock_adjustment' ? 'dieu-chinh-ton' :
                          appr.type === 'import_plan' ? 'ke-hoach-nhap' : 'cong-thuc'
                        );
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shrink-0"
                    >
                      <span>Xem xét duyệt</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Awaiting Delivery Imports */}
                {awaitingInspectionImports.map(slip => (
                  <div key={slip.id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 rounded-lg px-2 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          Chờ kiểm hàng
                        </span>
                        <span className="text-xs font-semibold text-slate-900">{slip.code} — {slip.supplier}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {slip.branchName} • Dự kiến nhận: {slip.expectedDate} • {slip.items.length} mặt hàng
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentNav('nhap-kho');
                        setViewDetailsId(slip.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold transition-colors shrink-0"
                    >
                      <span>Kiểm nhận</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Awaiting Export Confirmations */}
                {awaitingExportConfirmations.map(slip => (
                  <div key={slip.id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 rounded-lg px-2 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                          Chờ thực xuất
                        </span>
                        <span className="text-xs font-semibold text-slate-900">{slip.code} — {slip.reason}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {slip.branchName} • Người tạo: {slip.creatorName} ({slip.requestDate})
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentNav('xuat-kho');
                        setViewDetailsId(slip.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-orange-600 text-orange-800 hover:bg-orange-50 text-xs font-semibold transition-colors shrink-0"
                    >
                      <span>Xác nhận xuất</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {pendingApprovals.length === 0 && awaitingInspectionImports.length === 0 && awaitingExportConfirmations.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                    <span>Không có đầu việc tồn đọng. Các nghiệp vụ kho đang vận hành chuẩn hóa!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Quick Action Shortcuts */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Lối tắt thao tác</h3>
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => {
                      setCurrentNav('nhap-kho');
                      setViewDetailsId('new');
                    }}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ArrowDownToLine className="w-4 h-4 text-emerald-700" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-emerald-900">Lập kế hoạch nhập hàng</div>
                        <div className="text-[11px] text-slate-400">Tạo phiếu nhập chờ duyệt</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700" />
                  </button>

                  <button
                    onClick={() => {
                      setCurrentNav('xuat-kho');
                      setViewDetailsId('new');
                    }}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ArrowUpFromLine className="w-4 h-4 text-emerald-700" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-emerald-900">Tạo phiếu xuất cấp quầy</div>
                        <div className="text-[11px] text-slate-400">Luân chuyển kho sang quầy</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700" />
                  </button>

                  <button
                    onClick={() => {
                      setCurrentNav('kiem-ke');
                      setViewDetailsId('new');
                    }}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ClipboardCheck className="w-4 h-4 text-emerald-700" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-emerald-900">Kiểm kê thực tế</div>
                        <div className="text-[11px] text-slate-400">Ghi nhận số lượng đếm tại kho</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700" />
                  </button>

                  <button
                    onClick={() => setCurrentNav('dinh-muc')}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-emerald-700" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-emerald-900">Định mức tồn tối thiểu</div>
                        <div className="text-[11px] text-slate-400">Thiết lập ngưỡng an toàn</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700" />
                  </button>
                </div>
              </div>

              {/* Low stock preview */}
              {lowStockMaterials.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Cần nhập thêm:
                  </div>
                  <div className="space-y-1.5">
                    {lowStockMaterials.slice(0, 3).map(m => (
                      <div key={m.id} className="text-[11px] text-slate-700 flex justify-between bg-amber-50/70 p-2 rounded-lg">
                        <span className="truncate pr-1 font-medium">{m.name}</span>
                        <span className="font-bold text-amber-900 whitespace-nowrap">
                          {getBranchStock(m)} / tối thiểu {getBranchMinStock(m)} {m.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
