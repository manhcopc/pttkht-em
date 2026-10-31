import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Material, MaterialCategory } from '../types';
import { 
  Plus, 
  Search, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  PowerOff, 
  Check, 
  ChevronRight,
  Info,
  Package,
  Building2,
  AlertTriangle
} from 'lucide-react';

const CATEGORIES: MaterialCategory[] = [
  'Cà phê hạt & Bột',
  'Sữa & Chế phẩm sữa',
  'Trà & Thảo mộc',
  'Syrup & Mứt',
  'Đường & Phụ gia',
  'Bao bì & Ly tách',
];

export const MaterialsView: React.FC = () => {
  const { 
    materials, 
    activeBranchId, 
    branches, 
    addMaterial, 
    updateMaterial, 
    deactivateMaterial, 
    reactivateMaterial, 
    setCurrentNav,
    showToast
  } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Selected for slide-over panel
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deactivatingMaterial, setDeactivatingMaterial] = useState<Material | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('');

  // Form state for Add/Edit (Strictly non-financial, no direct minStocks editing)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cà phê hạt & Bột' as MaterialCategory,
    unit: 'kg',
    supplier: '',
    description: '',
  });

  const openAddModal = () => {
    setFormData({
      name: '',
      category: 'Cà phê hạt & Bột',
      unit: 'kg',
      supplier: '',
      description: '',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (mat: Material) => {
    setEditingMaterial(mat);
    setFormData({
      name: mat.name,
      category: mat.category,
      unit: mat.unit,
      supplier: mat.supplier || '',
      description: mat.description || '',
    });
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên nguyên vật liệu!', 'error');
      return;
    }

    if (editingMaterial) {
      updateMaterial(editingMaterial.id, {
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        supplier: formData.supplier,
        description: formData.description,
      });
      setEditingMaterial(null);
    } else {
      addMaterial({
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        status: 'active',
        supplier: formData.supplier,
        description: formData.description,
      });
      setIsAddModalOpen(false);
    }
  };

  const handleConfirmDeactivate = () => {
    if (!deactivatingMaterial) return;
    if (!deactivateReason.trim()) {
      showToast('Bắt buộc phải nhập lý do ngừng sử dụng để lưu vết kiểm toán!', 'error');
      return;
    }
    deactivateMaterial(deactivatingMaterial.id, deactivateReason);
    setDeactivatingMaterial(null);
    setDeactivateReason('');
    if (selectedMaterial?.id === deactivatingMaterial.id) {
      setSelectedMaterial(null);
    }
  };

  // Helper to compute stock
  const getDisplayStock = (mat: Material) => {
    if (activeBranchId === 'all') {
      let warehouse = 0;
      let bar = 0;
      let total = 0;
      Object.values(mat.stocks).forEach(s => {
        warehouse += s?.warehouse || 0;
        bar += s?.bar || 0;
        total += s?.total || 0;
      });
      return { warehouse, bar, total };
    }
    const s = mat.stocks[activeBranchId] || { warehouse: 0, bar: 0, total: 0 };
    return s;
  };

  const getDisplayMinStock = (mat: Material) => {
    if (activeBranchId === 'all') {
      return Object.values(mat.minStocks).reduce<number>((sum, s) => sum + (s !== null && s !== undefined ? s : 0), 0);
    }
    return mat.minStocks[activeBranchId];
  };

  // Filtered materials
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.supplier && m.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Action Bar: Search, Category Filter, Status Filter & One Primary Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search box directly on table */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã NVL, nhà cung cấp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-emerald-700 focus:bg-white"
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:border-emerald-700"
          >
            <option value="all">Tất cả phân loại</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:border-emerald-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang sử dụng</option>
            <option value="inactive">Ngừng sử dụng</option>
          </select>

          {(searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              Đặt lại
            </button>
          )}
        </div>

        {/* One Primary Standout Button */}
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm nguyên liệu</span>
        </button>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Mã NVL</th>
                <th className="py-3 px-4">Tên nguyên vật liệu</th>
                <th className="py-3 px-4">Phân loại</th>
                <th className="py-3 px-4">Đơn vị tính</th>
                <th className="py-3 px-4 text-right">Tồn kho chứa</th>
                <th className="py-3 px-4 text-right">Tồn quầy bar</th>
                <th className="py-3 px-4 text-right">Tổng tồn</th>
                <th className="py-3 px-4 text-right">Định mức an toàn</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map(mat => {
                const stock = getDisplayStock(mat);
                const minStock = getDisplayMinStock(mat);
                const isUnderMin = minStock !== null && minStock !== undefined && stock.total <= minStock && mat.status === 'active';

                return (
                  <tr 
                    key={mat.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      mat.status === 'inactive' ? 'opacity-60 bg-slate-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {mat.code}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedMaterial(mat)}
                        className="font-bold text-slate-900 hover:text-emerald-800 text-left cursor-pointer transition-colors"
                      >
                        {mat.name}
                      </button>
                      {mat.supplier && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{mat.supplier}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                        {mat.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {mat.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {stock.warehouse.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {stock.bar.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      <span className={isUnderMin ? 'text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded' : ''}>
                        {stock.total.toLocaleString('vi-VN')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {minStock !== null && minStock !== undefined ? (
                        <span className={`font-semibold ${isUnderMin ? 'text-amber-700' : 'text-slate-600'}`}>
                          {minStock.toLocaleString('vi-VN')} {mat.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chưa đặt</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {mat.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3" /> Đang dùng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Ngừng dùng
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(mat)}
                          className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {mat.status === 'active' ? (
                          <button
                            onClick={() => {
                              setDeactivatingMaterial(mat);
                              setDeactivateReason('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Ngừng sử dụng"
                          >
                            <PowerOff className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => reactivateMaterial(mat.id)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Kích hoạt lại"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>Không tìm thấy nguyên vật liệu phù hợp với bộ lọc.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Detail Panel */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-semibold text-emerald-800">{selectedMaterial.code}</span>
                  <h3 className="text-base font-bold text-slate-900">{selectedMaterial.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Phân loại & Đơn vị tính</label>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">{selectedMaterial.category}</span>
                    <span className="text-slate-500">• ĐVT: <strong>{selectedMaterial.unit}</strong></span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Nhà cung cấp</label>
                  <div className="text-slate-800 font-medium">{selectedMaterial.supplier || 'Chưa ghi nhận'}</div>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Mô tả / Quy cách đóng gói</label>
                  <div className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                    {selectedMaterial.description || 'Chưa có thông tin mô tả chi tiết.'}
                  </div>
                </div>

                {/* Stock Breakdown per Branch */}
                <div>
                  <label className="text-slate-400 font-semibold block mb-2">Chi tiết tồn kho các chi nhánh</label>
                  <div className="space-y-2">
                    {branches.map(branch => {
                      const st = selectedMaterial.stocks[branch.id] || { warehouse: 0, bar: 0, total: 0 };
                      const minSt = selectedMaterial.minStocks[branch.id];

                      return (
                        <div key={branch.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                          <div className="flex justify-between items-center font-bold text-slate-800">
                            <span>{branch.name.split('—')[0]}</span>
                            <span className="text-emerald-900 font-extrabold">{st.total} {selectedMaterial.unit}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                            <span>Kho chứa: {st.warehouse} {selectedMaterial.unit}</span>
                            <span>Quầy bar: {st.bar} {selectedMaterial.unit}</span>
                            <span>Định mức: {minSt !== null && minSt !== undefined ? `${minSt} ${selectedMaterial.unit}` : 'Chưa đặt'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedMaterial.status === 'inactive' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                    <div className="font-bold mb-1 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Lý do ngừng sử dụng:
                    </div>
                    <p className="text-[11px] leading-relaxed">{selectedMaterial.deactivationReason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedMaterial(null);
                  setCurrentNav('dinh-muc');
                }}
                className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Cấu hình định mức an toàn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Material Modal */}
      {(isAddModalOpen || editingMaterial) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingMaterial ? 'Chỉnh sửa thông tin nguyên vật liệu' : 'Thêm mới nguyên vật liệu'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMaterial(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên nguyên vật liệu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cà phê Robusta Đắk Lắk (Rang vừa)"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phân loại <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as MaterialCategory }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 font-medium"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Đơn vị tính <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="kg, lon (380g), hộp, cái..."
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nhà cung cấp
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: HTX Nông nghiệp Đắk Lắk, Vinamilk..."
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả / Tiêu chuẩn bảo quản
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú quy cách bảo quản, mùi vị chuẩn..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 font-medium"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-800 text-[11px] leading-relaxed">
                <strong>Quy định nghiệp vụ:</strong> Tồn kho ban đầu được ghi nhận qua phiếu nhập hàng hoặc kiểm kê đầu kỳ. Định mức tồn an toàn tối thiểu được thiết lập tại phân hệ <strong>Định mức</strong> qua phê duyệt của Chủ cửa hàng.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingMaterial(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {editingMaterial ? 'Lưu thay đổi' : 'Thêm nguyên liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivatingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Xác nhận ngừng sử dụng nguyên liệu</h4>
                <p className="text-slate-500 text-[11px]">{deactivatingMaterial.name} ({deactivatingMaterial.code})</p>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lý do ngừng sử dụng <span className="text-rose-500">* (Bắt buộc)</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Nhập lý do chi tiết (ví dụ: nhà cung cấp ngừng sản xuất, đổi bao bì...)"
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-600 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeactivatingMaterial(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-semibold shadow-xs"
              >
                Xác nhận ngừng dùng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
