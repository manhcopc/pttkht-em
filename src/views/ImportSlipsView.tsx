import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ImportSlip, ImportSlipItem, ImportSlipStatus } from '../types';
import { 
  Plus, 
  Search, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  History, 
  Building2, 
  Truck, 
  Calendar, 
  User, 
  AlertTriangle,
  Package,
  Check,
  X,
  Edit3
} from 'lucide-react';

const STATUS_CONFIG: Record<ImportSlipStatus, { label: string; badgeClass: string; icon: any }> = {
  pending_approval: { label: 'Chờ phê duyệt', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  approved: { label: 'Chờ kiểm hàng', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  received: { label: 'Đã tiếp nhận', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
  shortage: { label: 'Thiếu hàng', badgeClass: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
  defect: { label: 'Không đạt chất lượng', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircle },
  rejected: { label: 'Đã từ chối', badgeClass: 'bg-slate-200 text-slate-700 border-slate-300', icon: XCircle },
  cancelled: { label: 'Đã hủy', badgeClass: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle },
};

export const ImportSlipsView: React.FC = () => {
  const { 
    importSlips, 
    materials, 
    branches, 
    activeBranchId, 
    currentUser, 
    createImportSlip, 
    editImportSlip,
    receiveImportGoods, 
    cancelImportSlip,
    viewDetailsId,
    setViewDetailsId,
    showToast
  } = useApp();

  const isOwner = currentUser.role === 'chucuahang';
  const isBranchLocked = currentUser.role !== 'chucuahang';

  // Filters for list
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Detailed view / Create mode
  const isCreating = viewDetailsId === 'new';
  const selectedSlip = isCreating ? null : importSlips.find(s => s.id === viewDetailsId);

  // Form for New Import Slip
  const [createBranchId, setCreateBranchId] = useState<string>(
    isBranchLocked ? (currentUser.branchId || 'cn-1') : (activeBranchId === 'all' ? 'cn-1' : activeBranchId)
  );
  const [supplier, setSupplier] = useState('');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  );
  const [note, setNote] = useState('');
  const [items, setItems] = useState<{
    materialId: string;
    plannedQuantity: number;
  }[]>([
    { materialId: materials[0]?.id || '', plannedQuantity: 50 },
  ]);

  // Edit Slip State (when in 'pending_approval')
  const [isEditMode, setIsEditMode] = useState(false);

  // Receiving Goods State (Khi kiểm nhận hàng)
  const [receivingInputs, setReceivingInputs] = useState<Record<string, {
    receivedQuantity: number;
    defectQuantity: number;
    defectReason: string;
  }>>({});
  const [selectedReceivingStatus, setSelectedReceivingStatus] = useState<ImportSlipStatus>('received');
  const [receivingNote, setReceivingNote] = useState('');

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // History expansion
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // Initialize receiving inputs when opening a slip that can receive goods
  React.useEffect(() => {
    if (selectedSlip && (selectedSlip.status === 'approved' || selectedSlip.status === 'shortage' || selectedSlip.status === 'defect')) {
      const initial: Record<string, { receivedQuantity: number; defectQuantity: number; defectReason: string }> = {};
      selectedSlip.items.forEach(item => {
        initial[item.materialId] = {
          receivedQuantity: item.receivedQuantity > 0 ? item.receivedQuantity : item.plannedQuantity,
          defectQuantity: item.defectQuantity || 0,
          defectReason: item.defectReason || '',
        };
      });
      setReceivingInputs(initial);

      // Default status
      setSelectedReceivingStatus(selectedSlip.status === 'approved' ? 'received' : selectedSlip.status);
      setReceivingNote('');
    }
  }, [selectedSlip]);

  const handleAddItemRow = () => {
    const firstMat = materials[0];
    if (!firstMat) return;
    setItems(prev => [
      ...prev,
      { materialId: firstMat.id, plannedQuantity: 10 },
    ]);
  };

  const handleItemChange = (index: number, matId: string, qty: number) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { materialId: matId, plannedQuantity: Math.max(1, qty) };
      return next;
    });
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier.trim()) {
      showToast('Vui lòng nhập tên nhà cung cấp!', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Phiếu nhập phải có ít nhất 1 nguyên vật liệu!', 'error');
      return;
    }

    const success = createImportSlip({
      branchId: createBranchId,
      supplier,
      expectedDate,
      items,
      note,
    });

    if (success) {
      setViewDetailsId(null);
    }
  };

  const handleSaveEditSlip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlip) return;
    const success = editImportSlip(selectedSlip.id, {
      supplier: selectedSlip.supplier,
      expectedDate: selectedSlip.expectedDate,
      items: selectedSlip.items.map(i => ({ materialId: i.materialId, plannedQuantity: i.plannedQuantity })),
      note: selectedSlip.note,
    });
    if (success) {
      setIsEditMode(false);
    }
  };

  const handleConfirmCancelSlip = () => {
    if (!selectedSlip) return;
    if (!cancelReason.trim()) {
      showToast('Bắt buộc phải nhập lý do hủy phiếu!', 'error');
      return;
    }
    cancelImportSlip(selectedSlip.id, cancelReason);
    setIsCancelModalOpen(false);
    setCancelReason('');
  };

  // Submit Receiving Goods
  const handleSubmitReceiving = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlip) return;

    const receiptPayload = selectedSlip.items.map(item => {
      const input = receivingInputs[item.materialId] || { receivedQuantity: item.plannedQuantity, defectQuantity: 0, defectReason: '' };
      return {
        materialId: item.materialId,
        receivedQuantity: Number(input.receivedQuantity),
        defectQuantity: Number(input.defectQuantity),
        defectReason: input.defectReason,
      };
    });

    // Auto-detect status recommendations based on numbers
    let autoStatus: ImportSlipStatus = selectedReceivingStatus;
    let hasDefect = false;
    let hasShortage = false;

    receiptPayload.forEach((p, idx) => {
      const planned = selectedSlip.items[idx].plannedQuantity;
      if (p.defectQuantity > 0) hasDefect = true;
      if (p.receivedQuantity < planned) hasShortage = true;
    });

    // Q tắc: nếu có hàng lỗi -> Không đạt chất lượng; nếu thiếu hàng -> Thiếu hàng; nếu đủ và không lỗi -> Đã tiếp nhận
    if (hasDefect) {
      autoStatus = 'defect';
    } else if (hasShortage) {
      autoStatus = 'shortage';
    } else {
      autoStatus = 'received';
    }

    const success = receiveImportGoods(
      selectedSlip.id,
      receiptPayload,
      autoStatus,
      receivingNote
    );

    if (success) {
      // Re-trigger viewing updated slip
    }
  };

  // Filter list
  const filteredSlips = importSlips.filter(s => {
    const matchesBranch = activeBranchId === 'all' || s.branchId === activeBranchId;
    const matchesSearch = s.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.creatorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesBranch && matchesSearch && matchesStatus;
  });

  // =========================================================================
  // VIEW CHI TIẾT PHIẾU NHẬP (MH11) HOẶC TẠO MỚI (MH10)
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
              <h2 className="text-base font-bold text-slate-900">Lập kế hoạch nhập hàng mới</h2>
              <p className="text-xs text-slate-500">Tạo phiếu nhập ở trạng thái Chờ phê duyệt (chưa cộng tồn kho)</p>
            </div>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chi nhánh nhận hàng <span className="text-rose-500">*</span>
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
                  Nhà cung cấp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: HTX Nông nghiệp Đắk Lắk, Vinamilk..."
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ngày dự kiến nhận hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 font-medium"
                />
              </div>
            </div>

            {/* Items table */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">
                  Danh sách mặt hàng & số lượng dự kiến <span className="text-rose-500">*</span>
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
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <select
                        value={row.materialId}
                        onChange={(e) => handleItemChange(idx, e.target.value, row.plannedQuantity)}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                      >
                        {materials.filter(m => m.status === 'active').map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                        ))}
                      </select>

                      <div className="w-32">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Số lượng"
                          value={row.plannedQuantity}
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ghi chú kế hoạch nhập</label>
              <textarea
                rows={2}
                placeholder="Ghi chú mục đích nhập hàng, yêu cầu đóng gói..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 font-medium"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
              <strong>Quy trình nhập kho:</strong> Phiếu sau khi tạo sẽ ở trạng thái <strong>Chờ phê duyệt</strong> và gửi sang phân hệ Phê duyệt của Chủ cửa hàng. Tồn kho chỉ được ghi nhận tăng sau khi Chủ duyệt và Nhân viên hoàn thành bước Kiểm nhận hàng đạt chất lượng.
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
                Gửi kế hoạch nhập hàng
              </button>
            </div>
          </form>
        </div>
      );
    }

    // DETAIL VIEW FOR EXISTING SLIP
    const statusCfg = STATUS_CONFIG[selectedSlip!.status];
    const canReceive = selectedSlip!.status === 'approved' || selectedSlip!.status === 'shortage' || selectedSlip!.status === 'defect';
    const canEditOrCancel = selectedSlip!.status === 'pending_approval' && (isOwner || currentUser.role === 'quanly');

    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6 max-w-4xl mx-auto animate-in fade-in">
        {/* Header with Code, Status and Back */}
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
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">Nhà cung cấp: {selectedSlip!.supplier}</h2>
              <p className="text-xs text-slate-500">
                {selectedSlip!.branchName} • Ngày lập: {selectedSlip!.orderDate} • Dự kiến nhận: {selectedSlip!.expectedDate}
              </p>
            </div>
          </div>

          {/* Quick Actions (Hủy phiếu nếu đang Chờ phê duyệt) */}
          {canEditOrCancel && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsCancelModalOpen(true);
                  setCancelReason('');
                }}
                className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Hủy phiếu nhập
              </button>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">Người lập phiếu:</span>
            <span className="font-bold text-slate-800">{selectedSlip!.creatorName}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">Chi nhánh nhận hàng:</span>
            <span className="font-bold text-slate-800">{selectedSlip!.branchName.split('—')[0]}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">Ghi chú phiếu:</span>
            <span className="font-medium text-slate-700">{selectedSlip!.note || 'Không có ghi chú'}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-700" />
            Chi tiết mặt hàng & tình trạng giao nhận (Số lượng)
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Tên nguyên vật liệu</th>
                  <th className="py-2.5 px-3">Đơn vị</th>
                  <th className="py-2.5 px-3 text-right">Kế hoạch</th>
                  <th className="py-2.5 px-3 text-right">Lũy kế thực nhận</th>
                  <th className="py-2.5 px-3 text-right">Hàng lỗi</th>
                  <th className="py-2.5 px-3 text-right">Lượng đạt (Đã cộng tồn)</th>
                  <th className="py-2.5 px-3">Lý do lỗi (nếu có)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedSlip!.items.map(item => (
                  <tr key={item.materialId} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.materialName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{item.unit}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">{item.plannedQuantity}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{item.receivedQuantity}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                      {item.defectQuantity > 0 ? item.defectQuantity : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-800 bg-emerald-50/40">
                      {item.acceptedQuantity}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] italic">
                      {item.defectReason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECEIVING GOODS FORM (KHI Ở TRẠNG THÁI CHỜ KIỂM HÀNG HOẶC GIAO BÙ THIẾU/LỖI) */}
        {canReceive && (
          <div className="bg-emerald-50/50 border border-emerald-200/90 rounded-2xl p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                Kiểm hàng & ghi nhận nhận hàng (Hỗ trợ giao bù / đổi trả)
              </h4>
              <span className="text-[11px] text-emerald-700 font-medium">
                * Chỉ cộng tồn kho theo lượng đạt chất lượng tăng thêm
              </span>
            </div>

            <form onSubmit={handleSubmitReceiving} className="space-y-4 text-xs">
              <div className="space-y-3">
                {selectedSlip!.items.map(item => {
                  const input = receivingInputs[item.materialId] || { receivedQuantity: item.plannedQuantity, defectQuantity: 0, defectReason: '' };
                  const validQty = Math.max(0, input.receivedQuantity - input.defectQuantity);

                  return (
                    <div key={item.materialId} className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{item.materialName} ({item.unit})</span>
                        <span className="text-[11px] text-slate-500">Kế hoạch đặt: <strong>{item.plannedQuantity} {item.unit}</strong></span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Lũy kế thực nhận ({item.unit})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            value={input.receivedQuantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setReceivingInputs(prev => ({
                                ...prev,
                                [item.materialId]: {
                                  ...prev[item.materialId],
                                  receivedQuantity: val,
                                },
                              }));
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-rose-700 mb-1">
                            Số lượng không đạt/lỗi ({item.unit})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={input.defectQuantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setReceivingInputs(prev => ({
                                ...prev,
                                [item.materialId]: {
                                  ...prev[item.materialId],
                                  defectQuantity: val,
                                },
                              }));
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-rose-700"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                            Lượng đạt chất lượng (Cộng tồn)
                          </label>
                          <div className="p-2 bg-emerald-50 rounded-lg font-extrabold text-emerald-900 text-xs">
                            {validQty} {item.unit}
                          </div>
                        </div>
                      </div>

                      {input.defectQuantity > 0 && (
                        <div>
                          <input
                            type="text"
                            placeholder="Nhập lý do hàng không đạt chất lượng (ví dụ: móp méo, rách bao bì, ẩm ướt...)"
                            value={input.defectReason}
                            onChange={(e) => {
                              const val = e.target.value;
                              setReceivingInputs(prev => ({
                                ...prev,
                                [item.materialId]: {
                                  ...prev[item.materialId],
                                  defectReason: val,
                                },
                              }));
                            }}
                            className="w-full p-2 bg-rose-50/50 border border-rose-200 rounded-lg text-xs text-rose-900 placeholder:text-rose-400"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú kiểm hàng & biên bản bàn giao</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú tình trạng lô hàng, tài xế giao, số hóa đơn đỏ..."
                  value={receivingNote}
                  onChange={(e) => setReceivingNote(e.target.value)}
                  className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl focus:outline-hidden focus:border-emerald-700 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs text-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác nhận nhận hàng & Cập nhật tồn kho</span>
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
                {h.newData && (
                  <div className="text-[10px] text-emerald-800 bg-emerald-50/60 p-1.5 rounded mt-1 font-mono">
                    {h.newData}
                  </div>
                )}
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
                  <h4 className="font-bold text-sm text-slate-900">Xác nhận hủy phiếu nhập hàng</h4>
                  <p className="text-slate-500 text-[11px]">{selectedSlip!.code} — {selectedSlip!.supplier}</p>
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
                  onClick={handleConfirmCancelSlip}
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
  // VIEW DANH SÁCH PHIẾU NHẬP KHO (MH09)
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
              placeholder="Tìm theo mã phiếu, nhà cung cấp, người lập..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-emerald-700"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:border-emerald-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending_approval">Chờ phê duyệt</option>
            <option value="approved">Chờ kiểm hàng</option>
            <option value="received">Đã tiếp nhận</option>
            <option value="shortage">Thiếu hàng</option>
            <option value="defect">Không đạt chất lượng</option>
            <option value="rejected">Đã từ chối</option>
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
            <span>Lập kế hoạch nhập hàng</span>
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
                <th className="py-3 px-4">Nhà cung cấp</th>
                <th className="py-3 px-4">Số mặt hàng</th>
                <th className="py-3 px-4">Ngày đặt</th>
                <th className="py-3 px-4">Ngày dự kiến nhận</th>
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
                    <td className="py-3 px-4 font-bold text-slate-900">{slip.supplier}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{slip.items.length} mặt hàng</td>
                    <td className="py-3 px-4 text-slate-500">{slip.orderDate}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{slip.expectedDate}</td>
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
                        {slip.status === 'approved' ? 'Kiểm nhận' : 'Xem phiếu'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredSlips.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>Không có phiếu nhập kho phù hợp với điều kiện tìm kiếm.</span>
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
