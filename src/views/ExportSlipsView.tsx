import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExportSlip, ExportSlipType, ExportSlipStatus, ExportSlipItem } from '../types';
import { 
  Plus, 
  Search, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  XCircle, 
  History, 
  Building2, 
  ArrowUpFromLine, 
  Coffee, 
  Flame, 
  Check,
  X,
  AlertTriangle,
  Edit3
} from 'lucide-react';

const STATUS_CONFIG: Record<ExportSlipStatus, { label: string; badgeClass: string; icon: any }> = {
  pending: { label: 'Chờ xuất kho', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  completed: { label: 'Hoàn thành', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
  has_issue: { label: 'Có sự cố', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200', icon: AlertTriangle },
  cancelled: { label: 'Đã hủy', badgeClass: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle },
};

export const ExportSlipsView: React.FC = () => {
  const { 
    exportSlips, 
    materials, 
    branches, 
    activeBranchId, 
    currentUser, 
    createExportSlip, 
    editExportSlip,
    confirmActualExport, 
    cancelExportSlip,
    viewDetailsId,
    setViewDetailsId,
    showToast
  } = useApp();

  const isOwner = currentUser.role === 'chucuahang';
  const isBranchLocked = currentUser.role !== 'chucuahang';

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isCreating = viewDetailsId === 'new';
  const selectedSlip = isCreating ? null : exportSlips.find(s => s.id === viewDetailsId);

  // Form State for New Export Slip
  const [createBranchId, setCreateBranchId] = useState<string>(
    isBranchLocked ? (currentUser.branchId || 'cn-1') : (activeBranchId === 'all' ? 'cn-1' : activeBranchId)
  );
  const [exportType, setExportType] = useState<ExportSlipType>('cap_quay');
  const [reason, setReason] = useState('Cấp quầy pha chế ca sáng (Luân chuyển nội bộ kho -> quầy bar)');
  const [items, setItems] = useState<{
    materialId: string;
    requestedQuantity: number;
  }[]>([
    { materialId: materials[0]?.id || '', requestedQuantity: 5 },
  ]);

  // Actual export values for confirmation
  const [actualExportInputs, setActualExportInputs] = useState<Record<string, number>>({});
  const [isIssueConfirmed, setIsIssueConfirmed] = useState(false);
  const [issueReason, setIssueReason] = useState('');

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Edit Mode State (when slip is 'pending')
  const [isEditMode, setIsEditMode] = useState(false);
  const [editReason, setEditReason] = useState('');

  // History expansion
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  React.useEffect(() => {
    if (selectedSlip && selectedSlip.status === 'pending') {
      const initial: Record<string, number> = {};
      selectedSlip.items.forEach(item => {
        initial[item.materialId] = item.requestedQuantity;
      });
      setActualExportInputs(initial);
      setIsIssueConfirmed(false);
      setIssueReason('');
      setEditReason(selectedSlip.reason);
    }
  }, [selectedSlip]);

  const handleAddItemRow = () => {
    const firstMat = materials[0];
    if (!firstMat) return;
    setItems(prev => [
      ...prev,
      { materialId: firstMat.id, requestedQuantity: 1 },
    ]);
  };

  const handleItemChange = (index: number, matId: string, qty: number) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { materialId: matId, requestedQuantity: Math.max(1, qty) };
      return next;
    });
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Vui lòng nhập lý do xuất kho!', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Phiếu xuất phải có ít nhất 1 nguyên vật liệu!', 'error');
      return;
    }

    const success = createExportSlip({
      branchId: createBranchId,
      type: exportType,
      items,
      reason,
    });

    if (success) {
      setViewDetailsId(null);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlip) return;
    if (!editReason.trim()) {
      showToast('Bắt buộc phải nhập lý do khi chỉnh sửa phiếu xuất!', 'error');
      return;
    }

    const success = editExportSlip(selectedSlip.id, {
      items: selectedSlip.items.map(i => ({ materialId: i.materialId, requestedQuantity: i.requestedQuantity })),
      reason: editReason,
    });

    if (success) {
      setIsEditMode(false);
    }
  };

  const handleConfirmActualExportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlip) return;

    if (isIssueConfirmed && !issueReason.trim()) {
      showToast('Vui lòng nhập lý do sự cố khi xuất kho!', 'error');
      return;
    }

    const actualPayload = selectedSlip.items.map(item => ({
      materialId: item.materialId,
      actualQuantity: Number(actualExportInputs[item.materialId] || item.requestedQuantity),
    }));

    const success = confirmActualExport(
      selectedSlip.id,
      actualPayload,
      isIssueConfirmed,
      issueReason
    );

    if (success) {
      // Refresh details
    }
  };

  const handleConfirmCancel = () => {
    if (!selectedSlip) return;
    if (!cancelReason.trim()) {
      showToast('Bắt buộc phải nhập lý do hủy phiếu xuất kho!', 'error');
      return;
    }
    cancelExportSlip(selectedSlip.id, cancelReason);
    setIsCancelModalOpen(false);
    setCancelReason('');
  };

  const filteredSlips = exportSlips.filter(s => {
    const matchesBranch = activeBranchId === 'all' || s.branchId === activeBranchId;
    const matchesSearch = s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.creatorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || s.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesBranch && matchesSearch && matchesType && matchesStatus;
  });

  // =========================================================================
  // VIEW CHI TIẾT PHIẾU XUẤT (MH12) HOẶC TẠO MỚI (MH11)
  // =========================================================================
  if (isCreating || selectedSlip) {
    if (isCreating) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6 max-w-4xl mx-auto animate-in fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <button
              onClick={() => setViewDetailsId(null)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900">Lập phiếu xuất kho mới</h2>
              <p className="text-xs text-slate-500">
                Phiếu sau khi tạo ở trạng thái Chờ xuất kho; tồn kho chỉ được trừ khi bấm Xác nhận thực xuất.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chi nhánh xuất <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={isBranchLocked}
                  value={createBranchId}
                  onChange={(e) => setCreateBranchId(e.target.value)}
                  className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium ${
                    isBranchLocked ? 'cursor-not-allowed opacity-80' : 'focus:border-emerald-700'
                  }`}
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {isBranchLocked && (
                  <div className="text-[10px] text-amber-700 mt-0.5">* Cố định theo chi nhánh của {currentUser.roleLabel}</div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Loại xuất kho <span className="text-rose-500">*</span>
                </label>
                <select
                  value={exportType}
                  onChange={(e) => {
                    const t = e.target.value as ExportSlipType;
                    setExportType(t);
                    setReason(t === 'cap_quay' 
                      ? 'Cấp quầy pha chế ca sáng (Luân chuyển nội bộ kho -> quầy bar)' 
                      : 'Xuất hủy do hư hỏng, đổ vỡ nguyên liệu trong ca');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-emerald-700"
                >
                  <option value="cap_quay">1. Cấp quầy pha chế (Luân chuyển nội bộ kho -&gt; quầy bar)</option>
                  <option value="huy_hong">2. Xuất hủy do hư hỏng, đổ vỡ</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lý do xuất kho <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 font-medium"
              />
            </div>

            {/* Items row builder */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">
                  Danh sách nguyên vật liệu xuất kho <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="text-xs text-emerald-800 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm nguyên liệu
                </button>
              </div>

              <div className="space-y-2">
                {items.map((row, idx) => {
                  const mat = materials.find(m => m.id === row.materialId);
                  const availableWarehouseStock = mat?.stocks[createBranchId]?.warehouse || 0;

                  return (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <select
                        value={row.materialId}
                        onChange={(e) => handleItemChange(idx, e.target.value, row.requestedQuantity)}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                      >
                        {materials.filter(m => m.status === 'active').map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} (Tồn kho chứa: {m.stocks[createBranchId]?.warehouse || 0} {m.unit})
                          </option>
                        ))}
                      </select>

                      <div className="w-32">
                        <input
                          type="number"
                          min="1"
                          max={availableWarehouseStock}
                          required
                          placeholder="Số lượng"
                          value={row.requestedQuantity}
                          onChange={(e) => handleItemChange(idx, row.materialId, parseFloat(e.target.value) || 0)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-right font-bold focus:outline-hidden"
                        />
                      </div>

                      <span className="w-16 text-slate-500 font-medium text-xs truncate">{mat?.unit}</span>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1.5"
                          title="Xóa dòng"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
              <strong>Mô hình kho Trình Cà Phê:</strong> "Cấp quầy pha chế" là luân chuyển nội bộ giúp giảm tồn kho chứa và tăng tồn quầy bar; tổng tồn chi nhánh không giảm. "Xuất hủy do hư hỏng, đổ vỡ" sẽ giảm trực tiếp tồn kho.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewDetailsId(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs text-xs"
              >
                Tạo phiếu xuất kho
              </button>
            </div>
          </form>
        </div>
      );
    }

    // DETAIL VIEW FOR EXISTING SLIP
    const statusCfg = STATUS_CONFIG[selectedSlip!.status];
    const canConfirm = selectedSlip!.status === 'pending';
    const canEditOrCancel = selectedSlip!.status === 'pending' && (isOwner || currentUser.role === 'quanly');

    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6 max-w-4xl mx-auto animate-in fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewDetailsId(null)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-emerald-800">{selectedSlip!.code}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusCfg.badgeClass}`}>
                  {statusCfg.label}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {selectedSlip!.type === 'cap_quay' ? 'Cấp quầy pha chế' : 'Xuất hủy do hư hỏng, đổ vỡ'}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedSlip!.reason}</h2>
              <p className="text-xs text-slate-500">
                {selectedSlip!.branchName} • Ngày lập: {selectedSlip!.requestDate} • Tạo bởi: {selectedSlip!.creatorName}
              </p>
            </div>
          </div>

          {canEditOrCancel && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsCancelModalOpen(true);
                  setCancelReason('');
                }}
                className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Hủy phiếu xuất
              </button>
            </div>
          )}
        </div>

        {/* Issue Warning if any */}
        {selectedSlip!.status === 'has_issue' && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            <strong className="flex items-center gap-1.5 mb-0.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Sự cố ghi nhận khi xuất kho:
            </strong>
            <p className="text-[11px]">{selectedSlip!.issueReason}</p>
          </div>
        )}

        {/* Items Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ArrowUpFromLine className="w-4 h-4 text-emerald-700" />
            Danh sách mặt hàng & số lượng xuất
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Tên nguyên vật liệu</th>
                  <th className="py-2.5 px-3">Đơn vị</th>
                  <th className="py-2.5 px-3 text-right">Số lượng yêu cầu</th>
                  <th className="py-2.5 px-3 text-right">Số lượng thực xuất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedSlip!.items.map(item => (
                  <tr key={item.materialId} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.materialName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{item.unit}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">{item.requestedQuantity}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {item.actualQuantity !== undefined ? item.actualQuantity : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CONFIRM ACTUAL EXPORT FORM (Chỉ khi status === 'pending') */}
        {canConfirm && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-in fade-in">
            <div className="pb-2 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700" />
                Xác nhận thực xuất nguyên liệu
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                * Nhập số lượng thực xuất thực tế và kiểm tra không xuất vượt tồn khả dụng
              </span>
            </div>

            <form onSubmit={handleConfirmActualExportSubmit} className="space-y-4 text-xs">
              <div className="space-y-3">
                {selectedSlip!.items.map(item => {
                  const mat = materials.find(m => m.id === item.materialId);
                  const availableWarehouseStock = mat?.stocks[selectedSlip!.branchId]?.warehouse || 0;
                  const currentVal = actualExportInputs[item.materialId] !== undefined 
                    ? actualExportInputs[item.materialId] 
                    : item.requestedQuantity;

                  return (
                    <div key={item.materialId} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{item.materialName}</span>
                        <span className="text-[11px] text-slate-500">
                          Tồn kho chứa khả dụng: <strong>{availableWarehouseStock} {item.unit}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Số lượng yêu cầu ban đầu ({item.unit})
                          </label>
                          <input
                            type="text"
                            disabled
                            value={`${item.requestedQuantity} ${item.unit}`}
                            className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                            Số lượng thực xuất thực tế ({item.unit}) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={availableWarehouseStock}
                            step="any"
                            required
                            value={currentVal}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setActualExportInputs(prev => ({
                                ...prev,
                                [item.materialId]: val,
                              }));
                            }}
                            className="w-full p-2 bg-emerald-50/50 border border-emerald-300 rounded-lg text-xs font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Has issue toggle */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isIssueConfirmed}
                    onChange={(e) => setIsIssueConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800"
                  />
                  <span>Đánh dấu phiếu "Có sự cố" (Ví dụ: vỡ, đổ, giao quầy thiếu so với yêu cầu)</span>
                </label>

                {isIssueConfirmed && (
                  <div>
                    <label className="block text-[11px] font-semibold text-rose-700 mb-1">
                      Lý do sự cố <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Mô tả sự cố thực tế..."
                      value={issueReason}
                      onChange={(e) => setIssueReason(e.target.value)}
                      className="w-full p-2.5 bg-rose-50/40 border border-rose-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-rose-600"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs text-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác nhận thực xuất & cập nhật kho</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Processing History */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-700" />
              Lịch sử xử lý phiếu ({selectedSlip!.history.length} sự kiện)
            </h3>
            <button
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="text-xs text-emerald-800 font-semibold hover:underline"
            >
              {isHistoryExpanded ? 'Thu gọn' : 'Xem toàn bộ'}
            </button>
          </div>

          <div className="space-y-2">
            {(isHistoryExpanded ? selectedSlip!.history : selectedSlip!.history.slice(-3)).map((h, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>{h.action}</span>
                  <span className="text-[11px] text-slate-400 font-normal">{h.timestamp}</span>
                </div>
                <div className="text-[11px] text-slate-500">Bởi: {h.performer}</div>
                {h.note && <div className="text-[11px] text-slate-700 italic">"{h.note}"</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 space-y-4 text-xs">
              <div className="flex items-center gap-3 text-rose-700">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Xác nhận hủy phiếu xuất kho</h4>
                  <p className="text-slate-500 text-[11px]">{selectedSlip!.code}</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do hủy phiếu <span className="text-rose-500">* (Bắt buộc)</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Nhập lý do chi tiết..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-600 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-semibold shadow-xs"
                >
                  Xác nhận hủy phiếu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW DANH SÁCH PHIẾU XUẤT KHO (MH11)
  // =========================================================================
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Filter & One Primary Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã phiếu, lý do, người lập..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-emerald-700"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:border-emerald-700"
          >
            <option value="all">Tất cả loại xuất</option>
            <option value="cap_quay">Cấp quầy pha chế</option>
            <option value="huy_hong">Xuất hủy do hư hỏng, đổ vỡ</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:border-emerald-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xuất kho</option>
            <option value="completed">Hoàn thành</option>
            <option value="has_issue">Có sự cố</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        {/* Primary Action Button (Only for Manager & Owner) */}
        {(isOwner || currentUser.role === 'quanly') && (
          <button
            onClick={() => setViewDetailsId('new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo phiếu xuất kho</span>
          </button>
        )}
      </div>

      {/* Slips Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Mã phiếu</th>
                <th className="py-3 px-4">Chi nhánh</th>
                <th className="py-3 px-4">Loại xuất</th>
                <th className="py-3 px-4">Lý do xuất</th>
                <th className="py-3 px-4">Số mặt hàng</th>
                <th className="py-3 px-4">Ngày yêu cầu</th>
                <th className="py-3 px-4">Người lập</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSlips.map(slip => {
                const cfg = STATUS_CONFIG[slip.status];
                return (
                  <tr key={slip.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      <button
                        onClick={() => setViewDetailsId(slip.id)}
                        className="text-emerald-800 hover:underline cursor-pointer"
                      >
                        {slip.code}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{slip.branchName.split('—')[0]}</td>
                    <td className="py-3 px-4">
                      {slip.type === 'cap_quay' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                          <Coffee className="w-3.5 h-3.5 text-emerald-700" /> Cấp quầy
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                          <Flame className="w-3.5 h-3.5 text-rose-600" /> Xuất hủy
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">{slip.reason}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{slip.items.length} mặt hàng</td>
                    <td className="py-3 px-4 text-slate-500">{slip.requestDate}</td>
                    <td className="py-3 px-4 text-slate-600">{slip.creatorName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.badgeClass}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setViewDetailsId(slip.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-800 hover:text-white text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                      >
                        {slip.status === 'pending' ? 'Xác nhận xuất' : 'Xem phiếu'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredSlips.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    <ArrowUpFromLine className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>Không có phiếu xuất kho phù hợp với điều kiện tìm kiếm.</span>
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
