import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Recipe, RecipeIngredient, Material } from '../types';
import { PRESET_DRINKS } from '../data/mockData';
import { 
  Plus, 
  Search, 
  ChefHat, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  X, 
  Building2,
  Check,
  History,
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';

export const RecipesAndThresholdsView: React.FC = () => {
  const { 
    recipes, 
    materials, 
    activeBranchId, 
    branches, 
    currentNav,
    activeTab, 
    setActiveTab, 
    requestAddRecipe,
    requestUpdateRecipe,
    requestDeleteRecipe,
    requestThresholdChange, 
    approvals,
    currentUser,
    showToast 
  } = useApp();

  const isOwner = currentUser.role === 'chucuahang';
  
  // Decide active view: if currentNav is 'dinh-muc', view is 'dinh-muc'. If 'cong-thuc', view is 'cong-thuc'.
  // Otherwise use activeTab ('cong-thuc' | 'dinh-muc').
  const initialTab: 'cong-thuc' | 'dinh-muc' = currentNav === 'dinh-muc' ? 'dinh-muc' : (activeTab === 'dinh-muc' ? 'dinh-muc' : 'cong-thuc');
  const [currentTab, setCurrentTab] = useState<'cong-thuc' | 'dinh-muc'>(initialTab);

  // Sync if nav changes
  React.useEffect(() => {
    if (currentNav === 'dinh-muc') {
      setCurrentTab('dinh-muc');
    } else if (currentNav === 'cong-thuc') {
      setCurrentTab('cong-thuc');
    }
  }, [currentNav]);

  // =========================================================================
  // --- PHÂN HỆ CÔNG THỨC PHA CHẾ (MH08) ---
  // =========================================================================
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(recipes[0] || null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null);
  const [deleteRecipeReason, setDeleteRecipeReason] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');

  // Recipe Form State (Strictly non-financial: no prices, no costs, no food cost!)
  const [recipeForm, setRecipeForm] = useState<{
    selectedDrinkName: string;
    category: Recipe['category'];
    note: string;
    ingredients: RecipeIngredient[];
  }>({
    selectedDrinkName: PRESET_DRINKS[0].name,
    category: PRESET_DRINKS[0].category,
    note: '',
    ingredients: [],
  });

  const openAddRecipeModal = () => {
    setEditingRecipe(null);
    const firstMat = materials[0];
    setRecipeForm({
      selectedDrinkName: PRESET_DRINKS[0].name,
      category: PRESET_DRINKS[0].category,
      note: '',
      ingredients: [
        { materialId: firstMat?.id || '', materialName: firstMat?.name || '', quantity: 0.02, unit: firstMat?.unit || 'kg' },
      ],
    });
    setIsRecipeModalOpen(true);
  };

  const openEditRecipeModal = (rec: Recipe) => {
    setEditingRecipe(rec);
    setRecipeForm({
      selectedDrinkName: rec.name,
      category: rec.category,
      note: rec.note || '',
      ingredients: rec.ingredients.map(i => ({ ...i })),
    });
    setIsRecipeModalOpen(true);
  };

  const handleAddIngredientRow = () => {
    const firstMat = materials[0];
    if (!firstMat) return;
    setRecipeForm(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          materialId: firstMat.id,
          materialName: firstMat.name,
          quantity: 1,
          unit: firstMat.unit,
        },
      ],
    }));
  };

  const handleIngredientChange = (index: number, matId: string, qty: number) => {
    const mat = materials.find(m => m.id === matId);
    if (!mat) return;
    setRecipeForm(prev => {
      const next = [...prev.ingredients];
      next[index] = {
        materialId: mat.id,
        materialName: mat.name,
        quantity: Math.max(0, qty),
        unit: mat.unit,
      };
      return { ...prev, ingredients: next };
    });
  };

  const handleRemoveIngredientRow = (index: number) => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleSaveRecipeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (recipeForm.ingredients.length === 0) {
      showToast('Công thức phải có ít nhất 1 nguyên vật liệu!', 'error');
      return;
    }

    // Check all quantities > 0
    for (const item of recipeForm.ingredients) {
      if (item.quantity <= 0) {
        showToast(`Định lượng của "${item.materialName}" phải lớn hơn 0!`, 'error');
        return;
      }
    }

    if (editingRecipe) {
      requestUpdateRecipe(editingRecipe.id, {
        ingredients: recipeForm.ingredients,
        note: recipeForm.note,
      });
    } else {
      requestAddRecipe({
        name: recipeForm.selectedDrinkName,
        category: recipeForm.category,
        ingredients: recipeForm.ingredients,
        note: recipeForm.note,
      });
    }

    setIsRecipeModalOpen(false);
  };

  const handleConfirmDeleteRecipe = () => {
    if (!deletingRecipe) return;
    if (!deleteRecipeReason.trim()) {
      showToast('Bắt buộc phải nhập lý do đề xuất xóa công thức!', 'error');
      return;
    }
    requestDeleteRecipe(deletingRecipe.id, deleteRecipeReason);
    setDeletingRecipe(null);
    setDeleteRecipeReason('');
  };

  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(recipeSearch.toLowerCase()) ||
    r.code.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  // =========================================================================
  // --- PHÂN HỆ ĐỊNH MỨC TỒN TỐI THIỂU (MH07) ---
  // =========================================================================
  const [thresholdBranchId, setThresholdBranchId] = useState<string>(
    activeBranchId === 'all' ? 'cn-1' : activeBranchId
  );
  const [thresholdSearch, setThresholdSearch] = useState('');
  const [editingThresholdMaterial, setEditingThresholdMaterial] = useState<Material | null>(null);
  const [newThresholdValue, setNewThresholdValue] = useState<number>(10);
  const [thresholdReason, setThresholdReason] = useState<string>('');
  const [deletingThresholdMaterial, setDeletingThresholdMaterial] = useState<Material | null>(null);
  const [deleteThresholdReason, setDeleteThresholdReason] = useState<string>('');

  // Lock threshold branch selection for non-owners
  const isBranchLocked = currentUser.role !== 'chucuahang';
  const effectiveThresholdBranchId = isBranchLocked ? (currentUser.branchId || 'cn-1') : thresholdBranchId;

  const openSetThresholdModal = (mat: Material) => {
    setEditingThresholdMaterial(mat);
    const curVal = mat.minStocks[effectiveThresholdBranchId];
    setNewThresholdValue(curVal !== null && curVal !== undefined ? curVal : 10);
    setThresholdReason('');
  };

  const handleSaveThresholdRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThresholdMaterial) return;
    if (newThresholdValue < 0) {
      showToast('Định mức tồn tối thiểu không được âm!', 'error');
      return;
    }

    requestThresholdChange(
      editingThresholdMaterial.id,
      effectiveThresholdBranchId,
      'set',
      Number(newThresholdValue),
      thresholdReason || 'Điều chỉnh định mức an toàn phù hợp lưu lượng bán'
    );
    setEditingThresholdMaterial(null);
  };

  const handleConfirmDeleteThreshold = () => {
    if (!deletingThresholdMaterial) return;
    if (!deleteThresholdReason.trim()) {
      showToast('Bắt buộc phải nhập lý do hủy định mức tồn!', 'error');
      return;
    }

    requestThresholdChange(
      deletingThresholdMaterial.id,
      effectiveThresholdBranchId,
      'delete',
      0,
      deleteThresholdReason
    );
    setDeletingThresholdMaterial(null);
    setDeleteThresholdReason('');
  };

  const filteredThresholdMaterials = materials.filter(m => 
    m.status === 'active' &&
    (m.name.toLowerCase().includes(thresholdSearch.toLowerCase()) || m.code.toLowerCase().includes(thresholdSearch.toLowerCase()))
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 2-Tab Navigation Bar */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setCurrentTab('cong-thuc');
              setActiveTab('cong-thuc');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'cong-thuc'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Công thức pha chế</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('dinh-muc');
              setActiveTab('dinh-muc');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'dinh-muc'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Định mức tồn tối thiểu</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block pr-2">
          * Mọi thay đổi công thức & định mức đều phải qua phê duyệt của Chủ cửa hàng
        </div>
      </div>

      {/* =====================================================================
          TAB 1: CÔNG THỨC PHA CHẾ (MH08)
         ===================================================================== */}
      {currentTab === 'cong-thuc' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm món đồ uống theo tên, mã..."
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-emerald-700"
              />
            </div>

            <button
              onClick={openAddRecipeModal}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thiết lập công thức mới</span>
            </button>
          </div>

          {/* Master-Detail Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 5 Cols: List of Recipes */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2 h-[680px] flex flex-col">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Danh sách công thức ({filteredRecipes.length})
                </span>
                <span className="text-[11px] text-slate-400">Chọn món để xem định lượng</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredRecipes.map(rec => {
                  const isSelected = selectedRecipe?.id === rec.id;
                  const hasPendingChange = !!rec.pendingChange || rec.status === 'pending_approval';

                  return (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedRecipe(rec)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-50/70 shadow-xs'
                          : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[11px] font-semibold text-slate-500">{rec.code}</span>
                        <div className="flex items-center gap-1.5">
                          {hasPendingChange && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Chờ duyệt
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                            v{rec.version}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm mb-1">{rec.name}</h4>
                      <p className="text-[11px] text-slate-500">{rec.category} • {rec.ingredients.length} nguyên liệu</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 7 Cols: Detailed Ingredients & Version History */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs h-[680px] overflow-y-auto space-y-6">
              {selectedRecipe ? (
                <>
                  {/* Recipe Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-emerald-800">{selectedRecipe.code}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Phiên bản v{selectedRecipe.version}
                        </span>
                        {selectedRecipe.pendingChange && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Có đề xuất chờ duyệt
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedRecipe.name}</h3>
                      <p className="text-xs text-slate-500">{selectedRecipe.category}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditRecipeModal(selectedRecipe)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa công thức</span>
                      </button>
                      <button
                        onClick={() => {
                          setDeletingRecipe(selectedRecipe);
                          setDeleteRecipeReason('');
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Đề xuất xóa công thức"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pending Request Alert if Any */}
                  {selectedRecipe.pendingChange && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5 animate-in fade-in">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800">
                        <Clock className="w-4 h-4" />
                        Đang có yêu cầu "{selectedRecipe.pendingChange.action === 'delete' ? 'Xóa công thức' : 'Cập nhật định lượng'}" chờ Chủ duyệt
                      </div>
                      <p className="text-[11px] text-amber-800/90">
                        Người gửi: <strong>{selectedRecipe.pendingChange.requestedBy}</strong> ({selectedRecipe.pendingChange.requestedAt})
                      </p>
                      <p className="text-[11px] italic">
                        * Phiên bản hiện hành bên dưới vẫn đang có hiệu lực cho đến khi đề xuất được phê duyệt chính thức.
                      </p>
                    </div>
                  )}

                  {/* Current Active Ingredients Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-700" />
                      Định lượng nguyên liệu chuẩn (áp dụng tính tiêu hao)
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                            <th className="py-2.5 px-3">STT</th>
                            <th className="py-2.5 px-3">Nguyên vật liệu</th>
                            <th className="py-2.5 px-3 text-right">Định lượng / 1 món</th>
                            <th className="py-2.5 px-3">Đơn vị tính</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedRecipe.ingredients.map((ing, idx) => (
                            <tr key={ing.materialId} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{ing.materialName}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-800 font-mono">
                                {ing.quantity}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 font-medium">{ing.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Note */}
                  {selectedRecipe.note && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <strong>Ghi chú pha chế:</strong> {selectedRecipe.note}
                    </div>
                  )}

                  {/* Version History Table */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-700" />
                      Lịch sử phiên bản đã phê duyệt
                    </h4>
                    <div className="space-y-2">
                      {selectedRecipe.versionHistory && selectedRecipe.versionHistory.length > 0 ? (
                        selectedRecipe.versionHistory.map(vh => (
                          <div key={vh.version} className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span className="flex items-center gap-1.5 text-emerald-900">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                Phiên bản v{vh.version}
                              </span>
                              <span className="text-[11px] text-slate-400 font-normal">{vh.approvedAt}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">Phê duyệt bởi: {vh.approvedBy}</div>
                            {vh.note && <div className="text-[11px] text-slate-600 italic">"{vh.note}"</div>}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 italic">Chưa có lịch sử lưu trữ cho phiên bản trước.</div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <ChefHat className="w-10 h-10 text-slate-300 mb-2" />
                  <span>Chọn một công thức từ danh sách bên trái để xem chi tiết</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: ĐỊNH MỨC TỒN TỐI THIỂU (MH07)
         ===================================================================== */}
      {currentTab === 'dinh-muc' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Branch Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700">Chi nhánh:</span>
                <select
                  disabled={isBranchLocked}
                  value={effectiveThresholdBranchId}
                  onChange={(e) => setThresholdBranchId(e.target.value)}
                  className={`p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden ${
                    isBranchLocked ? 'cursor-not-allowed opacity-80' : 'focus:border-emerald-700'
                  }`}
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {isBranchLocked && (
                  <span className="text-[11px] text-amber-700 italic">
                    (Khóa theo chi nhánh phân công của {currentUser.roleLabel})
                  </span>
                )}
              </div>

              {/* Search box */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm nguyên liệu..."
                  value={thresholdSearch}
                  onChange={(e) => setThresholdSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-emerald-700"
                />
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Chi nhánh: <strong>{branches.find(b => b.id === effectiveThresholdBranchId)?.name?.split('—')[0]}</strong>
            </div>
          </div>

          {/* Thresholds Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Mã NVL</th>
                    <th className="py-3 px-4">Tên nguyên vật liệu</th>
                    <th className="py-3 px-4">Đơn vị tính</th>
                    <th className="py-3 px-4 text-right">Tồn hiện tại</th>
                    <th className="py-3 px-4 text-right">Định mức an toàn hiện hành</th>
                    <th className="py-3 px-4 text-center">Tình trạng cảnh báo</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredThresholdMaterials.map(mat => {
                    const currentThreshold = mat.minStocks[effectiveThresholdBranchId];
                    const currentStock = mat.stocks[effectiveThresholdBranchId]?.total || 0;
                    const hasThreshold = currentThreshold !== null && currentThreshold !== undefined;
                    const isBelowThreshold = hasThreshold && currentStock <= currentThreshold;

                    // Check if there is pending approval for this material threshold
                    const pendingAppr = approvals.find(a => 
                      a.status === 'pending' && 
                      a.subType === 'threshold' && 
                      a.referenceId === mat.id && 
                      a.branchId === effectiveThresholdBranchId
                    );

                    return (
                      <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">{mat.code}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{mat.name}</td>
                        <td className="py-3 px-4 text-slate-600">{mat.unit}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          {currentStock.toLocaleString('vi-VN')} {mat.unit}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {hasThreshold ? (
                            <span className="font-extrabold text-slate-900">
                              {currentThreshold.toLocaleString('vi-VN')} {mat.unit}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa thiết lập</span>
                          )}
                          {pendingAppr && (
                            <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                              (Đang chờ duyệt: {pendingAppr.details.after})
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {!hasThreshold ? (
                            <span className="text-slate-400 text-[11px]">Không cảnh báo</span>
                          ) : isBelowThreshold ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3" /> Cần nhập thêm
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                              <Check className="w-3 h-3" /> Đạt an toàn
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openSetThresholdModal(mat)}
                              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors"
                            >
                              {hasThreshold ? 'Sửa định mức' : 'Thiết lập'}
                            </button>
                            {hasThreshold && (
                              <button
                                onClick={() => {
                                  setDeletingThresholdMaterial(mat);
                                  setDeleteThresholdReason('');
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Đề xuất hủy định mức (ngừng cảnh báo)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 1: THIẾT LẬP / SỬA CÔNG THỨC PHA CHẾ
         ===================================================================== */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 animate-in zoom-in-95 max-h-[90vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingRecipe ? `Đề xuất sửa công thức: ${editingRecipe.name}` : 'Đề xuất công thức pha chế món mới'}
                </h3>
                <button
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form id="recipe-form" onSubmit={handleSaveRecipeRequest} className="mt-4 space-y-4 text-xs overflow-y-auto max-h-[58vh] pr-1">
                {/* Select Drink from Preset List */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chọn món đồ uống từ danh sách mẫu có sẵn <span className="text-rose-500">*</span>
                  </label>
                  {editingRecipe ? (
                    <input
                      type="text"
                      disabled
                      value={editingRecipe.name}
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-800 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={recipeForm.selectedDrinkName}
                      onChange={(e) => {
                        const match = PRESET_DRINKS.find(d => d.name === e.target.value);
                        setRecipeForm(prev => ({
                          ...prev,
                          selectedDrinkName: e.target.value,
                          category: match ? match.category : prev.category,
                        }));
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 font-bold text-slate-800"
                    >
                      {PRESET_DRINKS.map(d => (
                        <option key={d.code} value={d.name}>{d.name} ({d.category})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phân loại món</label>
                  <input
                    type="text"
                    disabled
                    value={recipeForm.category}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-600"
                  />
                </div>

                {/* Ingredients table builder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700">
                      Thành phần & định lượng nguyên liệu <span className="text-rose-500">* (Định lượng &gt; 0)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddIngredientRow}
                      className="text-xs text-emerald-800 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm nguyên liệu
                    </button>
                  </div>

                  <div className="space-y-2">
                    {recipeForm.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <select
                          value={ing.materialId}
                          onChange={(e) => handleIngredientChange(idx, e.target.value, ing.quantity)}
                          className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                        >
                          {materials.filter(m => m.status === 'active').map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                          ))}
                        </select>

                        <div className="w-28 flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            min="0.0001"
                            required
                            placeholder="Số lượng"
                            value={ing.quantity}
                            onChange={(e) => handleIngredientChange(idx, ing.materialId, parseFloat(e.target.value) || 0)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-right font-bold focus:outline-hidden"
                          />
                        </div>

                        <span className="w-16 text-slate-500 font-medium text-xs truncate">{ing.unit}</span>

                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1.5"
                          title="Xóa dòng"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ghi chú / Lý do điều chỉnh</label>
                  <textarea
                    rows={2}
                    placeholder="Ghi chú kỹ thuật pha chế hoặc lý do thay đổi..."
                    value={recipeForm.note}
                    onChange={(e) => setRecipeForm(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 font-medium"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                  <strong>Quy tắc hệ thống:</strong> Bấm nút gửi sẽ tạo đề xuất <strong>Chờ phê duyệt</strong>. Công thức hiện hành chưa bị thay đổi cho đến khi Chủ cửa hàng duyệt tại phân hệ Phê duyệt.
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setIsRecipeModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="recipe-form"
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs text-xs flex items-center gap-1.5"
              >
                <span>Gửi yêu cầu phê duyệt</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: XÁC NHẬN YÊU CẦU XÓA CÔNG THỨC
         ===================================================================== */}
      {deletingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Gửi đề xuất xóa/ngừng công thức</h4>
                <p className="text-slate-500 text-[11px]">{deletingRecipe.name} ({deletingRecipe.code})</p>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lý do đề xuất xóa <span className="text-rose-500">* (Bắt buộc)</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Nhập lý do chi tiết..."
                value={deleteRecipeReason}
                onChange={(e) => setDeleteRecipeReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-600 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingRecipe(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRecipe}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-semibold shadow-xs"
              >
                Gửi yêu cầu phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: THIẾT LẬP / SỬA ĐỊNH MỨC TỒN TỐI THIỂU
         ===================================================================== */}
      {editingThresholdMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900">
                Đề xuất định mức tồn tối thiểu
              </h4>
              <button onClick={() => setEditingThresholdMaterial(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">{editingThresholdMaterial.name}</div>
              <div className="text-[11px] text-slate-500">
                Chi nhánh: <strong>{branches.find(b => b.id === effectiveThresholdBranchId)?.name?.split('—')[0]}</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                Mức hiện hành: <strong>{editingThresholdMaterial.minStocks[effectiveThresholdBranchId] !== null && editingThresholdMaterial.minStocks[effectiveThresholdBranchId] !== undefined ? `${editingThresholdMaterial.minStocks[effectiveThresholdBranchId]} ${editingThresholdMaterial.unit}` : 'Chưa đặt'}</strong>
              </div>
            </div>

            <form onSubmit={handleSaveThresholdRequest} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Định mức an toàn đề xuất ({editingThresholdMaterial.unit}) <span className="text-rose-500">* (&gt;= 0)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={newThresholdValue}
                  onChange={(e) => setNewThresholdValue(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do điều chỉnh</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú nhu cầu sử dụng thực tế..."
                  value={thresholdReason}
                  onChange={(e) => setThresholdReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-700 font-medium"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                * Yêu cầu sẽ được chuyển đến Chủ cửa hàng trong phân hệ Phê duyệt.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingThresholdMaterial(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Gửi yêu cầu phê duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: XÁC NHẬN HỦY ĐỊNH MỨC TỒN TỐI THIỂU
         ===================================================================== */}
      {deletingThresholdMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Đề xuất hủy định mức an toàn</h4>
                <p className="text-slate-500 text-[11px]">{deletingThresholdMaterial.name}</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Khi được Chủ cửa hàng duyệt, hệ thống sẽ ngừng cảnh báo tồn thiếu theo định mức an toàn cho nguyên liệu này tại chi nhánh đã chọn.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lý do đề xuất hủy định mức <span className="text-rose-500">* (Bắt buộc)</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Nhập lý do chi tiết..."
                value={deleteThresholdReason}
                onChange={(e) => setDeleteThresholdReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-600 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingThresholdMaterial(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteThreshold}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-semibold shadow-xs"
              >
                Gửi yêu cầu phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
