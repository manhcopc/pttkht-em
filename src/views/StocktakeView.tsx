import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Stocktake, StocktakeItem, StocktakeStatus } from '../types';
import { 
  Plus, 
  Search, 
  ArrowLeft, 
  ClipboardCheck, 
  Printer, 
  Save, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Send,
  Building2,
  FileCheck,
  Check,
  EyeOff
} from 'lucide-react';

export const StocktakeView: React.FC = () => {
  const { 
    stocktakes, 
    materials, 
    branches, 
    activeBranchId, 
    currentUser, 
    saveStocktakeDraft,
    confirmStocktake, 
    proposeStockAdjustment,
    viewDetailsId,
    setViewDetailsId,
    showToast 
  } = useApp();

  const isOwner = currentUser.role === 'chucuahang';
  const isManager = currentUser.role === 'quanly';
  const isStaff = currentUser.role === 'nhanvien';
  const isBranchLocked = currentUser.role !== 'chucuahang';

  const [searchTerm, setSearchTerm] = useState('');

  // Form mode: 'new' or viewing/editing existing stocktake ID
  const isCreating = viewDetailsId === 'new';
  const selectedStocktake = isCreating ? null : stocktakes.find(s => s.id === viewDetailsId);

  // Form State for counting
  const [stocktakeBranchId, setStocktakeBranchId] = useState<string>(
    isBranchLocked ? (currentUser.branchId || 'cn-1') : (activeBranchId === 'all' ? 'cn-1' : activeBranchId)
  );
  const [stocktakeNote, setStocktakeNote] = useState('');
  // countInputs defaults to EMPTY STRING for each material, NEVER auto-filled from system stock!
  const [countInputs, setCountInputs] = useState<Record<string, string>>({});
  const [reasonInputs, setReasonInputs] = useState<Record<string, string>>({});

  // Initialize countInputs when creating new
  React.useEffect(() => {
    if (isCreating) {
      const initial: Record<string, string> = {};
      materials.filter(m => m.status === 'active').forEach(m => {
        initial[m.id] = ''; // Mặc định để trống hoàn toàn!
      });
      setCountInputs(initial);
      setReasonInputs({});
      setStocktakeNote('');
    }
  }, [isCreating, stocktakeBranchId, materials]);

  // Action: Lưu nháp (Bản nháp)
  const handleSaveDraft = () => {
    const activeMats = materials.filter(m => m.status === 'active');
    const items = activeMats.map(mat => {
      const rawVal = countInputs[mat.id];
      const hasValue = rawVal !== undefined && rawVal.trim() !== '';
      return {
        materialId: mat.id,
        actualStock: hasValue ? parseFloat(rawVal) : null,
        differenceReason: reasonInputs[mat.id] || '',
      };
    });

    saveStocktakeDraft(stocktakeBranchId, items, stocktakeNote || 'Bản nháp kiểm đếm kho');
    setViewDetailsId(null);
  };

  // Action: Xác nhận thành công (Đã xác nhận)
  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeMats = materials.filter(m => m.status === 'active');

    // Validation: Nhập đủ tất cả các dòng, không được để trống, không được âm
    for (const mat of activeMats) {
      const rawVal = countInputs[mat.id];
      if (rawVal === undefined || rawVal.trim() === '') {
        showToast(`Vui lòng nhập số lượng kiểm đếm cho "${mat.name}"! Nếu thực tế hết hàng, vui lòng nhập số 0.`, 'error');
        return;
      }
      const num = parseFloat(rawVal);
      if (isNaN(num) || num < 0) {
        showToast(`Số lượng kiểm đếm của "${mat.name}" không hợp lệ hoặc bị âm!`, 'error');
        return;
      }
    }

    const items = activeMats.map(mat => ({
      materialId: mat.id,
      actualStock: parseFloat(countInputs[mat.id]),
      differenceReason: reasonInputs[mat.id] || '',
    }));

    confirmStocktake(stocktakeBranchId, items, stocktakeNote || 'Kiểm kê thực tế định kỳ');
    setViewDetailsId(null);
  };

  const handlePrintSheet = () => {
    window.print();
  };

  const filteredStocktakes = stocktakes.filter(s => {
    const matchesBranch = activeBranchId === 'all' || s.branchId === activeBranchId;
    const matchesSearch = s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.creatorName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  // =========================================================================
  // VIEW BIỂU MẪU KIỂM KÊ (TẠO MỚI HOẶC XEM PHIẾU ĐÃ LƯU)
  // =========================================================================
  if (isCreating || selectedStocktake) {
    const isReadOnly = !!selectedStocktake;
    const targetBranchId = isCreating ? stocktakeBranchId : selectedStocktake!.branchId;
    const targetBranchName = branches.find(b => b.id === targetBranchId)?.name || targetBranchId;

    // Trạng thái phiếu kiểm kê (tách biệt với trạng thái điều chỉnh tồn)
    const slipStatusLabel = isCreating 
      ? 'Đang lập' 
      : selectedStocktake?.status === 'draft' 
        ? 'Bản nháp' 
        : 'Đã xác nhận';

    const slipStatusClass = isCreating
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : selectedStocktake?.status === 'draft'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-emerald-100 text-emerald-800 border-emerald-200';

    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6 max-w-5xl mx-auto animate-in fade-in">
        {/* Header with Title and 4 Actions: In mẫu, Lưu nháp, Xác nhận, Quay lại */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewDetailsId(null)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {isCreating ? 'Phiếu kiểm kê nguyên vật liệu thực tế' : `Phiếu kiểm kê ${selectedStocktake!.code}`}
                </h2>
                {/* Trạng thái phiếu kiểm kê */}
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${slipStatusClass}`}>
                  {slipStatusLabel}
                </span>

                {/* Trạng thái đề xuất điều chỉnh tồn (tách biệt) */}
                {selectedStocktake && selectedStocktake.status === 'confirmed' && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    selectedStocktake.adjustmentStatus === 'adjusted'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : selectedStocktake.adjustmentStatus === 'pending'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {selectedStocktake.adjustmentStatus === 'adjusted'
                      ? 'Đã điều chỉnh tồn'
                      : selectedStocktake.adjustmentStatus === 'pending'
                        ? 'Chờ duyệt điều chỉnh'
                        : 'Chưa điều chỉnh sổ kho'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {targetBranchName} • Ngày: {isCreating ? new Date().toLocaleDateString('vi-VN') : selectedStocktake!.stocktakeDate}
              </p>
            </div>
          </div>

          {/* Action Buttons Header */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintSheet}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In mẫu</span>
            </button>

            {isCreating && (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-emerald-600 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu nháp</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Xác nhận</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setViewDetailsId(null)}
              className="px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold"
            >
              Quay lại
            </button>
          </div>
        </div>

        {/* Branch Selection & Notice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chi nhánh kiểm kê</label>
            <select
              disabled={isReadOnly || isBranchLocked}
              value={targetBranchId}
              onChange={(e) => setStocktakeBranchId(e.target.value)}
              className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 ${
                isReadOnly || isBranchLocked ? 'cursor-not-allowed opacity-80' : 'focus:border-emerald-700'
              }`}
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {isBranchLocked && (
              <span className="text-[10px] text-amber-700 mt-0.5 block">
                * Khóa chi nhánh theo quyền của {currentUser.roleLabel}
              </span>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú đợt kiểm kê</label>
            <input
              type="text"
              disabled={isReadOnly}
              placeholder="Ví dụ: Kiểm kê định kỳ cuối tuần, bàn giao ca..."
              value={isCreating ? stocktakeNote : (selectedStocktake?.note || '')}
              onChange={(e) => setStocktakeNote(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 disabled:opacity-80"
            />
          </div>
        </div>

        {isStaff && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              <strong>Chế độ kiểm đếm mù:</strong> Tài khoản Nhân viên chỉ ghi nhận số lượng đếm thực tế; cột tồn sổ sách và chênh lệch được ẩn để đảm bảo tính khách quan.
            </span>
          </div>
        )}

        {/* Count Items Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-3 px-4">Mã NVL</th>
                <th className="py-3 px-4">Tên nguyên vật liệu</th>
                <th className="py-3 px-4">Đơn vị</th>
                {/* Chỉ Quản lý và Chủ thấy Tồn sổ sách */}
                {!isStaff && (
                  <th className="py-3 px-4 text-right">Tồn sổ sách</th>
                )}
                <th className="py-3 px-4 text-right w-44">Số lượng thực tế</th>
                {/* Chỉ Quản lý và Chủ thấy Chênh lệch */}
                {!isStaff && (
                  <th className="py-3 px-4 text-right">Hao hụt (Lý thuyết − Thực tế)</th>
                )}
                <th className="py-3 px-4">Lý do chênh lệch (nếu có)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isCreating ? (
                materials.filter(m => m.status === 'active').map(mat => {
                  const systemStock = mat.stocks[targetBranchId]?.total || 0;
                  const rawVal = countInputs[mat.id] ?? '';
                  const hasVal = rawVal.trim() !== '';
                  const numVal = hasVal ? parseFloat(rawVal) : null;
                  // Chênh lệch (Hao hụt) = Lý thuyết - Thực tế
                  const diff = numVal !== null ? (systemStock - numVal) : null;

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600">{mat.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{mat.name}</td>
                      <td className="py-3 px-4 text-slate-600">{mat.unit}</td>
                      {!isStaff && (
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {systemStock} {mat.unit}
                        </td>
                      )}
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="Để trống nếu chưa đếm"
                          value={rawVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCountInputs(prev => ({ ...prev, [mat.id]: val }));
                          }}
                          className={`w-36 p-1.5 text-right rounded-lg border text-xs font-bold focus:outline-hidden ${
                            hasVal ? 'bg-white border-emerald-500 text-slate-900' : 'bg-slate-50 border-slate-300 text-slate-400'
                          }`}
                        />
                      </td>
                      {!isStaff && (
                        <td className="py-3 px-4 text-right font-bold">
                          {diff !== null ? (
                            diff > 0 ? (
                              <span className="text-rose-700">+{diff} {mat.unit} (Hao hụt)</span>
                            ) : diff < 0 ? (
                              <span className="text-blue-700">{diff} {mat.unit} (Dư thừa)</span>
                            ) : (
                              <span className="text-emerald-700">0 (Khớp)</span>
                            )
                          ) : (
                            <span className="text-slate-400 font-normal italic">Chưa nhập</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Ghi chú nguyên nhân..."
                          value={reasonInputs[mat.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReasonInputs(prev => ({ ...prev, [mat.id]: val }));
                          }}
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                selectedStocktake!.items.map(item => {
                  const hasVal = item.actualStock !== null && item.actualStock !== undefined;
                  const diff = hasVal ? (item.systemStock - item.actualStock!) : null;

                  return (
                    <tr key={item.materialId} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600">{item.materialId}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.materialName}</td>
                      <td className="py-3 px-4 text-slate-600">{item.unit}</td>
                      {!isStaff && (
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {item.systemStock} {item.unit}
                        </td>
                      )}
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {hasVal ? `${item.actualStock} ${item.unit}` : <span className="text-slate-400 italic">Chưa đếm</span>}
                      </td>
                      {!isStaff && (
                        <td className="py-3 px-4 text-right font-bold">
                          {diff !== null ? (
                            diff > 0 ? (
                              <span className="text-rose-700">+{diff} {item.unit} (Hao hụt)</span>
                            ) : diff < 0 ? (
                              <span className="text-blue-700">{diff} {item.unit} (Dư thừa)</span>
                            ) : (
                              <span className="text-emerald-700">0 (Khớp)</span>
                            )
                          ) : (
                            <span className="text-slate-400 font-normal italic">-</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4 text-slate-600 text-[11px] italic">
                        {item.differenceReason || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & Propose Adjustment button (for Manager & Owner on confirmed slips) */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            * Xác nhận kiểm kê chỉ lưu lại kết quả kiểm đếm thực tế; không tự ý điều chỉnh sổ kho.
          </div>

          {!isCreating && selectedStocktake && selectedStocktake.status === 'confirmed' && (isOwner || isManager) && (
            <div>
              {selectedStocktake.adjustmentStatus === 'none' && (
                <button
                  type="button"
                  onClick={() => proposeStockAdjustment(selectedStocktake.id, 'Điều chỉnh theo kết quả kiểm kê')}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi đề xuất điều chỉnh tồn kho</span>
                </button>
              )}
              {selectedStocktake.adjustmentStatus === 'pending' && (
                <div className="p-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl font-semibold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Đã gửi đề xuất điều chỉnh — Đang chờ Chủ duyệt</span>
                </div>
              )}
              {selectedStocktake.adjustmentStatus === 'adjusted' && (
                <div className="p-2 bg-purple-50 text-purple-900 border border-purple-200 rounded-xl font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-purple-700" />
                  <span>Chủ cửa hàng đã duyệt điều chỉnh và cập nhật sổ kho</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW DANH SÁCH PHIẾU KIỂM KÊ (MH13)
  // =========================================================================
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Filter & One Primary Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã phiếu, người kiểm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-emerald-700"
          />
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setViewDetailsId('new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo phiếu kiểm kê</span>
        </button>
      </div>

      {/* Stocktakes Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Mã phiếu</th>
                <th className="py-3 px-4">Chi nhánh</th>
                <th className="py-3 px-4">Ngày kiểm kê</th>
                <th className="py-3 px-4">Người kiểm đếm</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-4 text-center">Trạng thái phiếu</th>
                <th className="py-3 px-4 text-center">Tình trạng điều chỉnh</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStocktakes.map(st => (
                <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    <button
                      onClick={() => setViewDetailsId(st.id)}
                      className="text-emerald-800 hover:underline cursor-pointer"
                    >
                      {st.code}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{st.branchName.split('—')[0]}</td>
                  <td className="py-3 px-4 text-slate-600">{st.stocktakeDate}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{st.creatorName}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{st.note || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      st.status === 'draft'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {st.status === 'draft' ? 'Bản nháp' : 'Đã xác nhận'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {st.adjustmentStatus === 'adjusted' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        Đã điều chỉnh tồn
                      </span>
                    ) : st.adjustmentStatus === 'pending' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Chờ duyệt điều chỉnh
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Chưa điều chỉnh</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setViewDetailsId(st.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-800 hover:text-white text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                    >
                      Xem phiếu
                    </button>
                  </td>
                </tr>
              ))}

              {filteredStocktakes.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>Không có đợt kiểm kê nào phù hợp với điều kiện tìm kiếm.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
