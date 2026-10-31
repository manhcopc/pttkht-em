import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ApprovalRequest, ApprovalType } from '../types';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  ChevronRight, 
  X, 
  Building2, 
  User, 
  Calendar,
  AlertCircle,
  FileCheck,
  AlertTriangle,
  History,
  Check
} from 'lucide-react';

export const ApprovalsView: React.FC = () => {
  const { 
    approvals, 
    activeTab, 
    setActiveTab, 
    approveRequest, 
    rejectRequest, 
    materials,
    currentUser,
    showToast 
  } = useApp();

  const tab = activeTab || 'dieu-chinh-ton';

  // Selected approval for review
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);

  // Reject Modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Approve note state
  const [approveNote, setApproveNote] = useState('');

  // Map tabs
  const tabTypeMap: Record<string, ApprovalType> = {
    'dieu-chinh-ton': 'stock_adjustment',
    'ke-hoach-nhap': 'import_plan',
    'cong-thuc': 'recipe_or_threshold',
  };

  const currentTabType: ApprovalType = tabTypeMap[tab] || 'stock_adjustment';

  // Filter approvals for current tab
  const filteredApprovals = approvals.filter(a => a.type === currentTabType);
  const pendingApprovals = filteredApprovals.filter(a => a.status === 'pending');
  const pastApprovals = filteredApprovals.filter(a => a.status !== 'pending');

  // Check if balance drifted between proposal creation and review
  const checkBalanceDrift = (appr: ApprovalRequest) => {
    if (appr.type !== 'stock_adjustment') return false;
    if (!appr.details.balanceAtProposal) return false;

    for (const item of appr.details.balanceAtProposal) {
      const mat = materials.find(m => m.id === item.materialId);
      const currentNow = mat?.stocks[appr.branchId]?.total || 0;
      if (currentNow !== item.balance) {
        return true; // Drift detected!
      }
    }
    return false;
  };

  const handleApprove = () => {
    if (!selectedApproval) return;
    approveRequest(selectedApproval.id, approveNote || 'Đồng ý phê duyệt');
    setSelectedApproval(null);
    setApproveNote('');
  };

  const handleConfirmReject = () => {
    if (!selectedApproval) return;
    if (!rejectReason.trim()) {
      showToast('Bắt buộc phải nhập lý do từ chối!', 'error');
      return;
    }
    rejectRequest(selectedApproval.id, rejectReason);
    setIsRejectModalOpen(false);
    setSelectedApproval(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 3-Group Navigation Bar */}
      <div className="flex items-center gap-1.5 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <button
          onClick={() => {
            setActiveTab('dieu-chinh-ton');
            setSelectedApproval(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            tab === 'dieu-chinh-ton' || currentTabType === 'stock_adjustment'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>1. Điều chỉnh tồn kho</span>
          {approvals.filter(a => a.type === 'stock_adjustment' && a.status === 'pending').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('ke-hoach-nhap');
            setSelectedApproval(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            tab === 'ke-hoach-nhap' || currentTabType === 'import_plan'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>2. Kế hoạch nhập hàng</span>
          {approvals.filter(a => a.type === 'import_plan' && a.status === 'pending').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('cong-thuc');
            setSelectedApproval(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            tab === 'cong-thuc' || currentTabType === 'recipe_or_threshold'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>3. Công thức & Định mức</span>
          {approvals.filter(a => a.type === 'recipe_or_threshold' && a.status === 'pending').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          )}
        </button>
      </div>

      {/* Main Content: Pending List (Left) + Detail View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 cols): List of Requests */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col h-[680px]">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Danh sách đề xuất chờ duyệt ({pendingApprovals.length})
            </h3>
            <span className="text-[11px] text-slate-400">Đã xử lý: {pastApprovals.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
            {pendingApprovals.map(appr => {
              const isSelected = selectedApproval?.id === appr.id;
              const hasDrift = checkBalanceDrift(appr);

              return (
                <div
                  key={appr.id}
                  onClick={() => setSelectedApproval(appr)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Chờ phê duyệt
                    </span>
                    <span className="text-[11px] text-slate-400">{appr.requestedAt.split(' ')[0]}</span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mb-1 leading-snug">{appr.title}</h4>
                  <p className="text-slate-500 text-[11px] line-clamp-1">{appr.details.summaryText}</p>

                  {hasDrift && (
                    <div className="mt-1.5 text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Số dư kho đã thay đổi kể từ khi lập đề xuất
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{appr.branchName.split('—')[0]}</span>
                    <span>Đề xuất: <strong>{appr.requesterName}</strong></span>
                  </div>
                </div>
              );
            })}

            {pendingApprovals.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                <span>Không có đề xuất nào đang chờ duyệt trong nhóm này!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Detailed Review Screen */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs h-[680px] overflow-y-auto flex flex-col justify-between">
          {selectedApproval ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Đề xuất chờ Chủ cửa hàng xét duyệt
                  </span>
                  <span className="text-xs text-slate-400">{selectedApproval.requestedAt}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{selectedApproval.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chi nhánh: <strong>{selectedApproval.branchName}</strong> • Người yêu cầu: <strong>{selectedApproval.requesterName}</strong>
                </p>
              </div>

              {/* Warning if balance drifted between proposal time and review time */}
              {checkBalanceDrift(selectedApproval) && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Cảnh báo dữ liệu: Số dư sổ kho hiện tại đã thay đổi so với thời điểm lập đề xuất!
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Đã phát sinh các giao dịch nhập hoặc xuất sau thời điểm kiểm kê. Vui lòng đối chiếu kỹ <strong>Số dư lúc lập đề xuất</strong> và <strong>Số dư hiện tại</strong> trước khi phê duyệt.
                  </p>
                </div>
              )}

              {/* Reason */}
              <div className="text-xs p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 font-semibold block mb-1">Lý do & căn cứ đề xuất:</span>
                <p className="font-medium text-slate-800 leading-relaxed">{selectedApproval.reason}</p>
              </div>

              {/* Distinction Tables for Stock Adjustment */}
              {selectedApproval.type === 'stock_adjustment' && selectedApproval.details.balanceAtProposal && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-700" />
                    Bảng đối chiếu 3 trạng thái số dư
                  </h4>

                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                          <th className="py-2.5 px-3">Nguyên vật liệu</th>
                          <th className="py-2.5 px-3 text-right">Số dư lúc lập đề xuất</th>
                          <th className="py-2.5 px-3 text-right">Số dư hiện tại lúc xét duyệt</th>
                          <th className="py-2.5 px-3 text-right font-bold text-emerald-900">Số dư đề nghị áp dụng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedApproval.details.proposedChanges?.map(change => {
                          const proposalBal = selectedApproval.details.balanceAtProposal?.find(b => b.materialId === change.materialId)?.balance;
                          const currentMat = materials.find(m => m.id === change.materialId);
                          const currentNow = currentMat?.stocks[selectedApproval.branchId]?.total || 0;
                          const isDrifted = proposalBal !== currentNow;

                          return (
                            <tr key={change.materialId} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{change.materialName}</td>
                              <td className="py-2.5 px-3 text-right text-slate-600 font-medium">
                                {proposalBal} {change.unit}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-semibold ${isDrifted ? 'text-amber-800 bg-amber-50/50' : 'text-slate-800'}`}>
                                {currentNow} {change.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-900 bg-emerald-50/40">
                                {change.proposed} {change.unit}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Plan Details */}
              {selectedApproval.type === 'import_plan' && selectedApproval.details.proposedChanges && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Danh mục mặt hàng & số lượng trong kế hoạch nhập
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                          <th className="py-2.5 px-3">Tên nguyên vật liệu</th>
                          <th className="py-2.5 px-3 text-right">Số lượng đề xuất nhập</th>
                          <th className="py-2.5 px-3">Đơn vị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedApproval.details.proposedChanges.map(change => (
                          <tr key={change.materialId} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{change.materialName}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-900">{change.proposed}</td>
                            <td className="py-2.5 px-3 text-slate-600">{change.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    * Duyệt kế hoạch nhập chỉ cho phép tiếp tục nhận hàng (chuyển sang Chờ kiểm hàng); KHÔNG cộng tồn kho ngay.
                  </p>
                </div>
              )}

              {/* Recipe / Threshold Comparison */}
              {selectedApproval.type === 'recipe_or_threshold' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Nội dung thay đổi đề xuất
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block mb-1 font-semibold">Trạng thái trước thay đổi:</span>
                      <div className="text-slate-700 leading-relaxed font-medium">
                        {typeof selectedApproval.details.before === 'string' ? selectedApproval.details.before : JSON.stringify(selectedApproval.details.before)}
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                      <span className="text-emerald-800 block mb-1 font-semibold">Trạng thái đề xuất áp dụng:</span>
                      <div className="text-emerald-950 font-bold leading-relaxed">
                        {typeof selectedApproval.details.after === 'string' ? selectedApproval.details.after : JSON.stringify(selectedApproval.details.after)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Note Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ý kiến / Ghi chú phê duyệt của Chủ cửa hàng
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đã kiểm tra thực tế, đồng ý duyệt điều chỉnh..."
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-emerald-700"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsRejectModalOpen(true);
                    setRejectReason('');
                  }}
                  className="px-4 py-2.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                >
                  Từ chối đề xuất
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Đồng ý phê duyệt</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <ShieldCheck className="w-12 h-12 text-slate-300 mb-2" />
              <h4 className="font-bold text-slate-700 text-sm">Trung tâm Phê duyệt của Chủ cửa hàng</h4>
              <p className="text-slate-400 text-center max-w-xs mt-1">
                Chọn một đề xuất từ danh sách bên trái để kiểm tra chi tiết số liệu và đưa ra quyết định duyệt hoặc từ chối.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal with Mandatory Reason */}
      {isRejectModalOpen && selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Từ chối phê duyệt đề xuất</h4>
                <p className="text-slate-500 text-[11px]">{selectedApproval.title}</p>
              </div>
            </div>

            <p className="text-slate-600 text-[11px] leading-relaxed">
              Khi từ chối, các thay đổi sẽ không được áp dụng và lý do từ chối sẽ được lưu vết kiểm toán.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lý do từ chối <span className="text-rose-500">* (Bắt buộc)</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Nhập lý do chi tiết từ chối đề xuất..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-600 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-semibold shadow-xs"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
