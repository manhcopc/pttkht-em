import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, Branch, Material, Recipe, ImportSlip, ExportSlip, 
  Stocktake, SalesRecord, ApprovalRequest, Role, ImportSlipStatus, ExportSlipStatus,
  ImportSlipItem, ExportSlipItem, SalesRecordItem
} from '../types';
import { 
  DEMO_USERS, INITIAL_BRANCHES, INITIAL_MATERIALS, INITIAL_RECIPES, 
  INITIAL_IMPORT_SLIPS, INITIAL_EXPORT_SLIPS, INITIAL_STOCKTAKES, 
  INITIAL_SALES_RECORDS, INITIAL_APPROVALS 
} from '../data/mockData';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  activeBranchId: string; // 'all' or branchId
  setActiveBranchId: (id: string) => void;
  branches: Branch[];
  activeBranch: Branch | null;
  materials: Material[];
  recipes: Recipe[];
  importSlips: ImportSlip[];
  exportSlips: ExportSlip[];
  stocktakes: Stocktake[];
  salesRecords: SalesRecord[];
  approvals: ApprovalRequest[];
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;

  // Authentication State
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  loginAs: (username: string) => void;
  logout: () => void;

  // Active module navigation
  currentNav: string;
  setCurrentNav: (nav: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  viewDetailsId: string | null;
  setViewDetailsId: (id: string | null) => void;

  // Handover & Guide Modal
  isGuideOpen: boolean;
  setIsGuideOpen: (open: boolean) => void;

  // Material Actions
  addMaterial: (material: Omit<Material, 'id' | 'code' | 'stocks' | 'minStocks'>) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deactivateMaterial: (id: string, reason: string) => void;
  reactivateMaterial: (id: string) => void;

  // Recipe & Threshold Actions (Qua phê duyệt)
  requestAddRecipe: (data: { name: string; category: Recipe['category']; ingredients: Recipe['ingredients']; note?: string }) => void;
  requestUpdateRecipe: (recipeId: string, updates: { ingredients: Recipe['ingredients']; note?: string }) => void;
  requestDeleteRecipe: (recipeId: string, reason: string) => void;
  requestThresholdChange: (materialId: string, branchId: string, action: 'set' | 'delete', newThreshold: number, reason: string) => void;

  // Import Actions
  createImportSlip: (data: { branchId: string; supplier: string; expectedDate: string; items: { materialId: string; plannedQuantity: number }[]; note?: string }) => boolean;
  editImportSlip: (slipId: string, data: { supplier: string; expectedDate: string; items: { materialId: string; plannedQuantity: number }[]; note?: string }) => boolean;
  receiveImportGoods: (
    slipId: string, 
    receiptItems: { materialId: string; receivedQuantity: number; defectQuantity: number; defectReason?: string }[],
    resultingStatus: ImportSlipStatus,
    note: string
  ) => boolean;
  cancelImportSlip: (slipId: string, reason: string) => void;

  // Export Actions
  createExportSlip: (data: { branchId: string; type: 'cap_quay' | 'huy_hong'; items: { materialId: string; requestedQuantity: number }[]; reason: string }) => boolean;
  editExportSlip: (slipId: string, data: { items: { materialId: string; requestedQuantity: number }[]; reason: string }) => boolean;
  confirmActualExport: (
    slipId: string, 
    actualItems: { materialId: string; actualQuantity: number }[],
    isIssue: boolean,
    issueReason?: string
  ) => boolean;
  cancelExportSlip: (slipId: string, reason: string) => void;

  // Stocktake Actions
  saveStocktakeDraft: (branchId: string, items: { materialId: string; actualStock: number | null; differenceReason?: string }[], note?: string) => void;
  confirmStocktake: (branchId: string, items: { materialId: string; actualStock: number; differenceReason?: string }[], note?: string) => void;
  proposeStockAdjustment: (stocktakeId: string, reason: string) => void;

  // Sales Data Actions
  importSalesData: (
    periodType: 'ca' | 'ngay' | 'thang',
    period: string, 
    branchId: string, 
    source: 'KiotViet' | 'FAB PDA' | 'Khác',
    items: { recipeId: string; quantity: number }[],
    overwrite?: boolean
  ) => boolean;

  // Approval Actions
  approveRequest: (approvalId: string, note?: string) => void;
  rejectRequest: (approvalId: string, reason: string) => void;

  // Reset to default
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'TRINH_CAPHE_INVENTORY_SYSTEM_V2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved state or fallback
  const loadState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse localStorage data', e);
    }
    return null;
  };

  const initialSaved = loadState();

  const [currentUser, setCurrentUser] = useState<User>(() => initialSaved?.currentUser || DEMO_USERS[0]);
  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    if (initialSaved?.currentUser?.role !== 'chucuahang') {
      return initialSaved?.currentUser?.branchId || 'cn-1';
    }
    return initialSaved?.activeBranchId || 'all';
  });
  const [branches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [materials, setMaterials] = useState<Material[]>(() => initialSaved?.materials || INITIAL_MATERIALS);
  const [recipes, setRecipes] = useState<Recipe[]>(() => initialSaved?.recipes || INITIAL_RECIPES);
  const [importSlips, setImportSlips] = useState<ImportSlip[]>(() => initialSaved?.importSlips || INITIAL_IMPORT_SLIPS);
  const [exportSlips, setExportSlips] = useState<ExportSlip[]>(() => initialSaved?.exportSlips || INITIAL_EXPORT_SLIPS);
  const [stocktakes, setStocktakes] = useState<Stocktake[]>(() => initialSaved?.stocktakes || INITIAL_STOCKTAKES);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>(() => initialSaved?.salesRecords || INITIAL_SALES_RECORDS);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() => initialSaved?.approvals || INITIAL_APPROVALS);

  // Navigation state
  const [currentNav, setCurrentNav] = useState<string>('tong-quan');
  const [activeTab, setActiveTab] = useState<string>('');
  const [viewDetailsId, setViewDetailsId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Login handler that resets navigation and clears prior session states
  const loginAs = (username: string) => {
    const user = DEMO_USERS.find(u => u.username === username);
    if (!user) return;
    setCurrentUser(user);
    setIsAuthenticated(true);
    setViewDetailsId(null);
    setActiveTab('');

    if (user.role === 'nhanvien') {
      setActiveBranchId(user.branchId || 'cn-1');
      setCurrentNav('tong-quan');
    } else if (user.role === 'ketoan') {
      setActiveBranchId(user.branchId || 'cn-1');
      setCurrentNav('tong-quan');
    } else if (user.role === 'quanly') {
      setActiveBranchId(user.branchId || 'cn-1');
      setCurrentNav('tong-quan');
    } else {
      setActiveBranchId('all');
      setCurrentNav('tong-quan');
    }
    showToast(`Đăng nhập thành công với vai trò: ${user.name} (${user.roleLabel})`);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setViewDetailsId(null);
    setActiveTab('');
    showToast('Đã đăng xuất khỏi hệ thống.', 'info');
  };

  // Enforce branch scope on non-owner users
  useEffect(() => {
    if (currentUser.role !== 'chucuahang') {
      if (activeBranchId !== currentUser.branchId) {
        setActiveBranchId(currentUser.branchId || 'cn-1');
      }
    }
  }, [currentUser, activeBranchId]);

  // Sync to localStorage
  useEffect(() => {
    try {
      const dataToSave = {
        currentUser,
        activeBranchId,
        materials,
        recipes,
        importSlips,
        exportSlips,
        stocktakes,
        salesRecords,
        approvals,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [currentUser, activeBranchId, materials, recipes, importSlips, exportSlips, stocktakes, salesRecords, approvals]);

  const activeBranch = branches.find(b => b.id === activeBranchId) || null;

  // Reset function with confirm
  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(DEMO_USERS[0]);
    setActiveBranchId('all');
    setMaterials(INITIAL_MATERIALS);
    setRecipes(INITIAL_RECIPES);
    setImportSlips(INITIAL_IMPORT_SLIPS);
    setExportSlips(INITIAL_EXPORT_SLIPS);
    setStocktakes(INITIAL_STOCKTAKES);
    setSalesRecords(INITIAL_SALES_RECORDS);
    setApprovals(INITIAL_APPROVALS);
    setCurrentNav('tong-quan');
    setViewDetailsId(null);
    setActiveTab('');
    showToast('Đã khôi phục dữ liệu mẫu ban đầu!', 'info');
  };

  // Helper: Enforce Branch Write Permission
  const validateBranchWrite = (targetBranchId: string): boolean => {
    if (!targetBranchId || targetBranchId === 'all') {
      showToast('Thao tác ghi dữ liệu bắt buộc phải chọn một chi nhánh cụ thể!', 'error');
      return false;
    }
    if (currentUser.role !== 'chucuahang' && currentUser.branchId !== targetBranchId) {
      showToast(`Tài khoản ${currentUser.roleLabel} chỉ được phép thao tác tại chi nhánh được phân công!`, 'error');
      return false;
    }
    return true;
  };

  // --- MATERIAL ACTIONS ---
  const addMaterial = (data: Omit<Material, 'id' | 'code' | 'stocks' | 'minStocks'>) => {
    const nextCode = `NVL-${String(materials.length + 1).padStart(3, '0')}`;
    const newMaterial: Material = {
      ...data,
      id: `mat-${Date.now()}`,
      code: nextCode,
      stocks: {
        'cn-1': { warehouse: 0, bar: 0, total: 0 },
        'cn-2': { warehouse: 0, bar: 0, total: 0 },
        'cn-3': { warehouse: 0, bar: 0, total: 0 },
      },
      minStocks: {
        'cn-1': null,
        'cn-2': null,
        'cn-3': null,
      },
      status: 'active',
    };
    setMaterials(prev => [newMaterial, ...prev]);
    showToast(`Đã thêm nguyên vật liệu "${newMaterial.name}". Định mức tồn cần thiết lập tại phân hệ Định mức.`);
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    const safeUpdates = { ...updates };
    delete (safeUpdates as any).stocks;
    delete (safeUpdates as any).minStocks; // Định mức tồn không sửa trực tiếp ở đây!

    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...safeUpdates } : m));
    showToast('Đã cập nhật thông tin nguyên vật liệu thành công!');
  };

  const deactivateMaterial = (id: string, reason: string) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, status: 'inactive', deactivationReason: reason } : m));
    showToast('Đã ngừng sử dụng nguyên vật liệu.', 'warning');
  };

  const reactivateMaterial = (id: string) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, status: 'active', deactivationReason: undefined } : m));
    showToast('Đã kích hoạt lại nguyên vật liệu.');
  };

  // --- RECIPE & THRESHOLD ACTIONS (Tất cả đều phải qua phê duyệt) ---
  const requestAddRecipe = (data: { name: string; category: Recipe['category']; ingredients: Recipe['ingredients']; note?: string }) => {
    const nextCode = `DU-${String(recipes.length + 1).padStart(3, '0')}`;
    const tempId = `rec-${Date.now()}`;
    const approvalId = `appr-${Date.now()}`;

    const newRecipe: Recipe = {
      id: tempId,
      code: nextCode,
      name: data.name,
      category: data.category,
      ingredients: data.ingredients,
      status: 'pending_approval',
      version: 0,
      versionHistory: [],
      note: data.note,
      updatedAt: new Date().toISOString().split('T')[0],
      pendingChange: {
        action: 'add',
        ingredients: data.ingredients,
        note: data.note,
        requestedBy: currentUser.name,
        requestedAt: new Date().toLocaleString('vi-VN'),
        approvalId,
      },
    };

    setRecipes(prev => [newRecipe, ...prev]);

    const approval: ApprovalRequest = {
      id: approvalId,
      type: 'recipe_or_threshold',
      subType: 'recipe',
      title: `Đề xuất phê duyệt công thức mới: ${newRecipe.name} (${newRecipe.code})`,
      branchId: 'all',
      branchName: 'Toàn hệ thống (Áp dụng toàn chuỗi)',
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requestedAt: new Date().toLocaleString('vi-VN'),
      status: 'pending',
      referenceId: tempId,
      reason: data.note || 'Thiết lập công thức pha chế món mới.',
      details: {
        summaryText: `Công thức gồm ${data.ingredients.length} nguyên liệu.`,
        before: 'Chưa có công thức chính thức',
        after: data.ingredients.map(i => `${i.materialName}: ${i.quantity} ${i.unit}`).join(', '),
      },
    };

    setApprovals(prev => [approval, ...prev]);
    showToast('Đã gửi yêu cầu phê duyệt công thức món mới sang Trung tâm Phê duyệt!');
  };

  const requestUpdateRecipe = (recipeId: string, updates: { ingredients: Recipe['ingredients']; note?: string }) => {
    const existing = recipes.find(r => r.id === recipeId);
    if (!existing) return;

    const approvalId = `appr-${Date.now()}`;

    setRecipes(prev => prev.map(r => {
      if (r.id === recipeId) {
        return {
          ...r,
          pendingChange: {
            action: 'update',
            ingredients: updates.ingredients,
            note: updates.note,
            requestedBy: currentUser.name,
            requestedAt: new Date().toLocaleString('vi-VN'),
            approvalId,
          },
        };
      }
      return r;
    }));

    const approval: ApprovalRequest = {
      id: approvalId,
      type: 'recipe_or_threshold',
      subType: 'recipe',
      title: `Đề xuất điều chỉnh công thức: ${existing.name} (${existing.code})`,
      branchId: 'all',
      branchName: 'Toàn hệ thống',
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requestedAt: new Date().toLocaleString('vi-VN'),
      status: 'pending',
      referenceId: recipeId,
      reason: updates.note || 'Điều chỉnh định lượng nguyên liệu chuẩn.',
      details: {
        summaryText: `Cập nhật công thức cho ${existing.name} (Phiên bản hiện tại: v${existing.version})`,
        before: existing.ingredients.map(i => `${i.materialName}: ${i.quantity} ${i.unit}`).join(', '),
        after: updates.ingredients.map(i => `${i.materialName}: ${i.quantity} ${i.unit}`).join(', '),
      },
    };

    setApprovals(prev => [approval, ...prev]);
    showToast('Đã gửi yêu cầu phê duyệt chỉnh sửa công thức đến Chủ cửa hàng!');
  };

  const requestDeleteRecipe = (recipeId: string, reason: string) => {
    const existing = recipes.find(r => r.id === recipeId);
    if (!existing) return;

    const approvalId = `appr-${Date.now()}`;

    setRecipes(prev => prev.map(r => {
      if (r.id === recipeId) {
        return {
          ...r,
          pendingChange: {
            action: 'delete',
            note: reason,
            requestedBy: currentUser.name,
            requestedAt: new Date().toLocaleString('vi-VN'),
            approvalId,
          },
        };
      }
      return r;
    }));

    const approval: ApprovalRequest = {
      id: approvalId,
      type: 'recipe_or_threshold',
      subType: 'recipe',
      title: `Đề xuất xóa/ngừng công thức: ${existing.name} (${existing.code})`,
      branchId: 'all',
      branchName: 'Toàn hệ thống',
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requestedAt: new Date().toLocaleString('vi-VN'),
      status: 'pending',
      referenceId: recipeId,
      reason: reason || 'Món ngừng phục vụ.',
      details: {
        summaryText: `Yêu cầu xóa/ngừng áp dụng công thức ${existing.name}.`,
        before: existing.ingredients.map(i => `${i.materialName}: ${i.quantity} ${i.unit}`).join(', '),
        after: 'Xóa công thức khỏi hệ thống',
      },
    };

    setApprovals(prev => [approval, ...prev]);
    showToast('Đã gửi đề xuất xóa công thức đến Chủ cửa hàng!');
  };

  const requestThresholdChange = (
    materialId: string, 
    branchId: string, 
    action: 'set' | 'delete', 
    newThreshold: number, 
    reason: string
  ) => {
    const mat = materials.find(m => m.id === materialId);
    if (!mat) return;
    const bName = branches.find(b => b.id === branchId)?.name || branchId;
    const currentThreshold = mat.minStocks[branchId];
    const approvalId = `appr-${Date.now()}`;

    const approval: ApprovalRequest = {
      id: approvalId,
      type: 'recipe_or_threshold',
      subType: 'threshold',
      title: action === 'delete' 
        ? `Đề xuất hủy định mức tồn: ${mat.name} (${bName})`
        : `Đề xuất định mức tồn tối thiểu: ${mat.name} (${bName})`,
      branchId,
      branchName: bName,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requestedAt: new Date().toLocaleString('vi-VN'),
      status: 'pending',
      referenceId: materialId,
      reason: reason || 'Điều chỉnh định mức an toàn phù hợp lưu lượng khách.',
      details: {
        summaryText: action === 'delete'
          ? `Hủy định mức tồn (ngừng cảnh báo) cho ${mat.name}`
          : `Thiết lập định mức ${mat.name} thành ${newThreshold} ${mat.unit}`,
        before: currentThreshold !== null && currentThreshold !== undefined ? `${currentThreshold} ${mat.unit}` : 'Chưa thiết lập',
        after: action === 'delete' ? 'Không áp dụng định mức' : `${newThreshold} ${mat.unit}`,
      },
    };

    setApprovals(prev => [approval, ...prev]);
    showToast(`Đã gửi yêu cầu ${action === 'delete' ? 'hủy' : 'thiết lập'} định mức tồn đến Chủ cửa hàng.`);
  };

  // --- IMPORT SLIP ACTIONS ---
  const createImportSlip = (data: { branchId: string; supplier: string; expectedDate: string; items: { materialId: string; plannedQuantity: number }[]; note?: string }): boolean => {
    if (!validateBranchWrite(data.branchId)) return false;

    const branch = branches.find(b => b.id === data.branchId);
    const slipNumber = String(importSlips.length + 1).padStart(4, '0');
    const code = `PNK-2026-${slipNumber}`;

    const enrichedItems: ImportSlipItem[] = data.items.map(item => {
      const mat = materials.find(m => m.id === item.materialId);
      return {
        materialId: item.materialId,
        materialName: mat?.name || 'Nguyên vật liệu',
        unit: mat?.unit || 'đv',
        plannedQuantity: item.plannedQuantity,
        receivedQuantity: 0,
        defectQuantity: 0,
        acceptedQuantity: 0,
      };
    });

    const newSlip: ImportSlip = {
      id: `imp-${Date.now()}`,
      code,
      branchId: data.branchId,
      branchName: branch?.name || data.branchId,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      supplier: data.supplier,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: data.expectedDate,
      status: 'pending_approval', // Tạo phiếu luôn là Chờ phê duyệt, chưa cộng tồn
      items: enrichedItems,
      note: data.note,
      history: [
        {
          timestamp: new Date().toLocaleString('vi-VN'),
          action: 'Lập kế hoạch mua hàng (Chờ phê duyệt)',
          performer: `${currentUser.name} (${currentUser.roleLabel})`,
          note: data.note,
        },
      ],
    };

    setImportSlips(prev => [newSlip, ...prev]);

    // Tạo đề xuất duyệt kế hoạch nhập
    const approval: ApprovalRequest = {
      id: `appr-${Date.now()}`,
      type: 'import_plan',
      title: `Kế hoạch nhập hàng: ${newSlip.code} (${data.supplier})`,
      branchId: data.branchId,
      branchName: branch?.name || data.branchId,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requestedAt: new Date().toLocaleString('vi-VN'),
      status: 'pending',
      referenceId: newSlip.id,
      reason: data.note || 'Bổ sung nguyên vật liệu phục vụ kinh doanh.',
      details: {
        summaryText: `Kế hoạch nhập ${enrichedItems.length} mặt hàng từ ${data.supplier}.`,
        proposedChanges: enrichedItems.map(i => ({ materialId: i.materialId, materialName: i.materialName, proposed: i.plannedQuantity, unit: i.unit })),
      },
    };

    setApprovals(prev => [approval, ...prev]);
    showToast(`Đã tạo phiếu nhập ${code} ở trạng thái "Chờ phê duyệt"!`);
    return true;
  };

  const editImportSlip = (slipId: string, data: { supplier: string; expectedDate: string; items: { materialId: string; plannedQuantity: number }[]; note?: string }): boolean => {
    const slip = importSlips.find(s => s.id === slipId);
    if (!slip) return false;
    if (slip.status !== 'pending_approval') {
      showToast('Chỉ được chỉnh sửa khi phiếu ở trạng thái "Chờ phê duyệt"!', 'error');
      return false;
    }
    if (!validateBranchWrite(slip.branchId)) return false;

    const enrichedItems: ImportSlipItem[] = data.items.map(item => {
      const mat = materials.find(m => m.id === item.materialId);
      return {
        materialId: item.materialId,
        materialName: mat?.name || 'Nguyên vật liệu',
        unit: mat?.unit || 'đv',
        plannedQuantity: item.plannedQuantity,
        receivedQuantity: 0,
        defectQuantity: 0,
        acceptedQuantity: 0,
      };
    });

    setImportSlips(prev => prev.map(s => {
      if (s.id === slipId) {
        return {
          ...s,
          supplier: data.supplier,
          expectedDate: data.expectedDate,
          items: enrichedItems,
          note: data.note,
          history: [
            ...s.history,
            {
              timestamp: new Date().toLocaleString('vi-VN'),
              action: 'Chỉnh sửa kế hoạch nhập hàng',
              performer: `${currentUser.name} (${currentUser.roleLabel})`,
              note: data.note,
            },
          ],
        };
      }
      return s;
    }));

    showToast(`Đã cập nhật kế hoạch nhập ${slip.code}.`);
    return true;
  };

  const receiveImportGoods = (
    slipId: string, 
    receiptItems: { materialId: string; receivedQuantity: number; defectQuantity: number; defectReason?: string }[],
    resultingStatus: ImportSlipStatus,
    note: string
  ): boolean => {
    const slip = importSlips.find(s => s.id === slipId);
    if (!slip) return false;

    if (slip.status === 'received' || slip.status === 'rejected' || slip.status === 'cancelled') {
      showToast(`Phiếu ở trạng thái "${slip.status}" không được phép nhận hàng lại!`, 'error');
      return false;
    }

    if (!validateBranchWrite(slip.branchId)) return false;

    // Tính lượng tăng thêm (chỉ cộng lượng đạt chất lượng tăng thêm so với lần nhận trước)
    const stockIncrements: Record<string, number> = {};
    const oldHistoryItems: string[] = [];
    const newHistoryItems: string[] = [];

    const updatedItems: ImportSlipItem[] = slip.items.map(item => {
      const rec = receiptItems.find(r => r.materialId === item.materialId);
      if (rec) {
        const prevAccepted = item.acceptedQuantity || 0;
        const newReceived = rec.receivedQuantity;
        const newDefect = rec.defectQuantity;
        const newAccepted = Math.max(0, newReceived - newDefect);
        const deltaAccepted = Math.max(0, newAccepted - prevAccepted);

        stockIncrements[item.materialId] = deltaAccepted;

        oldHistoryItems.push(`${item.materialName}: Đã nhận ${item.receivedQuantity}, Đạt ${prevAccepted}`);
        newHistoryItems.push(`${item.materialName}: Thực nhận mới ${newReceived}, Lỗi ${newDefect}, Đạt mới ${newAccepted} (+${deltaAccepted} vào tồn)`);

        return {
          ...item,
          receivedQuantity: newReceived,
          defectQuantity: newDefect,
          acceptedQuantity: newAccepted,
          defectReason: rec.defectReason,
        };
      }
      return item;
    });

    // Cập nhật tồn kho (CHỈ CỘNG PHẦN ĐẠT CHẤT LƯỢNG TĂNG THÊM VÀO KHO CHỨA)
    setMaterials(prev => prev.map(m => {
      const inc = stockIncrements[m.id];
      if (inc && inc > 0) {
        const curStock = m.stocks[slip.branchId] || { warehouse: 0, bar: 0, total: 0 };
        const newWarehouse = curStock.warehouse + inc;
        const newTotal = curStock.bar + newWarehouse;
        return {
          ...m,
          stocks: {
            ...m.stocks,
            [slip.branchId]: {
              ...curStock,
              warehouse: newWarehouse,
              total: newTotal,
            },
          },
        };
      }
      return m;
    }));

    const statusLabels: Record<ImportSlipStatus, string> = {
      received: 'Đã tiếp nhận',
      shortage: 'Thiếu hàng',
      defect: 'Không đạt chất lượng',
      pending_approval: 'Chờ phê duyệt',
      approved: 'Chờ kiểm hàng',
      rejected: 'Đã từ chối',
      cancelled: 'Đã hủy',
    };

    const updatedSlip: ImportSlip = {
      ...slip,
      status: resultingStatus,
      items: updatedItems,
      history: [
        ...slip.history,
        {
          timestamp: new Date().toLocaleString('vi-VN'),
          action: `Ghi nhận nhận hàng — Chuyển trạng thái: ${statusLabels[resultingStatus]}`,
          performer: `${currentUser.name} (${currentUser.roleLabel})`,
          note: note || (resultingStatus === 'shortage' ? 'Ghi nhận nhận thiếu hàng.' : resultingStatus === 'defect' ? 'Có hàng lỗi không đạt tiêu chuẩn.' : 'Đã nhận đủ và đạt chất lượng.'),
          oldData: oldHistoryItems.join('; '),
          newData: newHistoryItems.join('; '),
        },
      ],
    };

    setImportSlips(prev => prev.map(s => s.id === slipId ? updatedSlip : s));
    showToast(`Đã ghi nhận nhận hàng cho phiếu ${slip.code}. Tồn kho đã được cộng theo lượng đạt chất lượng!`);
    return true;
  };

  const cancelImportSlip = (slipId: string, reason: string) => {
    const slip = importSlips.find(s => s.id === slipId);
    if (!slip) return;
    if (slip.status !== 'pending_approval') {
      showToast('Chỉ có thể hủy phiếu khi còn ở trạng thái "Chờ phê duyệt"!', 'error');
      return;
    }
    if (!validateBranchWrite(slip.branchId)) return;

    setImportSlips(prev => prev.map(s => {
      if (s.id === slipId) {
        return {
          ...s,
          status: 'cancelled',
          history: [
            ...s.history,
            {
              timestamp: new Date().toLocaleString('vi-VN'),
              action: 'Hủy phiếu nhập hàng',
              performer: `${currentUser.name} (${currentUser.roleLabel})`,
              note: reason,
            },
          ],
        };
      }
      return s;
    }));

    // Cũng hủy approval nếu có
    setApprovals(prev => prev.map(a => a.referenceId === slipId && a.status === 'pending' ? { ...a, status: 'rejected', reviewNote: 'Phiếu nhập đã bị hủy' } : a));

    showToast('Đã hủy phiếu nhập hàng.', 'info');
  };

  // --- EXPORT SLIP ACTIONS ---
  const createExportSlip = (data: { branchId: string; type: 'cap_quay' | 'huy_hong'; items: { materialId: string; requestedQuantity: number }[]; reason: string }): boolean => {
    if (!validateBranchWrite(data.branchId)) return false;

    // Kiểm tra không xuất vượt tồn khả dụng tại kho chứa
    for (const item of data.items) {
      const mat = materials.find(m => m.id === item.materialId);
      const availableStock = mat?.stocks[data.branchId]?.warehouse || 0;
      if (item.requestedQuantity > availableStock) {
        showToast(`Không thể tạo phiếu: Lượng yêu cầu ${item.requestedQuantity} ${mat?.unit} của "${mat?.name}" vượt quá tồn kho chứa khả dụng (${availableStock} ${mat?.unit})!`, 'error');
        return false;
      }
    }

    const branch = branches.find(b => b.id === data.branchId);
    const slipNumber = String(exportSlips.length + 1).padStart(4, '0');
    const code = `PXK-2026-${slipNumber}`;

    const enrichedItems: ExportSlipItem[] = data.items.map(item => {
      const mat = materials.find(m => m.id === item.materialId);
      return {
        materialId: item.materialId,
        materialName: mat?.name || 'Nguyên vật liệu',
        unit: mat?.unit || 'đv',
        requestedQuantity: item.requestedQuantity,
      };
    });

    const newSlip: ExportSlip = {
      id: `exp-${Date.now()}`,
      code,
      branchId: data.branchId,
      branchName: branch?.name || data.branchId,
      type: data.type,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'pending', // Chờ xuất kho; chưa trừ tồn
      items: enrichedItems,
      reason: data.reason,
      history: [
        {
          timestamp: new Date().toLocaleString('vi-VN'),
          action: 'Lập phiếu xuất kho (Chờ xuất)',
          performer: `${currentUser.name} (${currentUser.roleLabel})`,
          note: data.reason,
        },
      ],
    };

    setExportSlips(prev => [newSlip, ...prev]);
    showToast(`Đã tạo phiếu xuất kho ${code}. Vui lòng xác nhận thực xuất để cập nhật tồn kho.`);
    return true;
  };

  const editExportSlip = (slipId: string, data: { items: { materialId: string; requestedQuantity: number }[]; reason: string }): boolean => {
    const slip = exportSlips.find(s => s.id === slipId);
    if (!slip) return false;
    if (slip.status !== 'pending') {
      showToast('Chỉ có thể chỉnh sửa phiếu khi ở trạng thái "Chờ xuất kho"!', 'error');
      return false;
    }
    if (!validateBranchWrite(slip.branchId)) return false;

    // Check available warehouse stock
    for (const item of data.items) {
      const mat = materials.find(m => m.id === item.materialId);
      const availableStock = mat?.stocks[slip.branchId]?.warehouse || 0;
      if (item.requestedQuantity > availableStock) {
        showToast(`Lượng yêu cầu ${item.requestedQuantity} của "${mat?.name}" vượt quá tồn kho chứa (${availableStock})!`, 'error');
        return false;
      }
    }

    const enrichedItems: ExportSlipItem[] = data.items.map(item => {
      const mat = materials.find(m => m.id === item.materialId);
      return {
        materialId: item.materialId,
        materialName: mat?.name || 'Nguyên vật liệu',
        unit: mat?.unit || 'đv',
        requestedQuantity: item.requestedQuantity,
      };
    });

    setExportSlips(prev => prev.map(s => {
      if (s.id === slipId) {
        return {
          ...s,
          items: enrichedItems,
          reason: data.reason,
          history: [
            ...s.history,
            {
              timestamp: new Date().toLocaleString('vi-VN'),
              action: 'Chỉnh sửa phiếu xuất kho',
              performer: `${currentUser.name} (${currentUser.roleLabel})`,
              note: data.reason,
            },
          ],
        };
      }
      return s;
    }));

    showToast(`Đã chỉnh sửa phiếu xuất ${slip.code}.`);
    return true;
  };

  const confirmActualExport = (
    slipId: string, 
    actualItems: { materialId: string; actualQuantity: number }[],
    isIssue: boolean,
    issueReason?: string
  ): boolean => {
    const slip = exportSlips.find(s => s.id === slipId);
    if (!slip) return false;

    if (slip.status !== 'pending') {
      showToast('Phiếu xuất này không ở trạng thái chờ xuất kho, không thể xác nhận lại!', 'error');
      return false;
    }

    if (!validateBranchWrite(slip.branchId)) return false;

    // Kiểm tra không xuất vượt tồn khả dụng tại kho chứa
    for (const item of actualItems) {
      const mat = materials.find(m => m.id === item.materialId);
      const availableWarehouse = mat?.stocks[slip.branchId]?.warehouse || 0;
      if (item.actualQuantity > availableWarehouse) {
        showToast(`Không thể xuất: Lượng thực xuất ${item.actualQuantity} của "${mat?.name}" vượt quá tồn kho chứa (${availableWarehouse})!`, 'error');
        return false;
      }
    }

    // Cập nhật tồn kho theo mô hình:
    // Cấp quầy pha chế = luân chuyển nội bộ: giảm warehouse, tăng bar, tổng tồn chi nhánh không đổi!
    // Xuất hủy hỏng = giảm warehouse, giảm tổng tồn chi nhánh!
    const updatedSlipItems: ExportSlipItem[] = slip.items.map(item => {
      const match = actualItems.find(a => a.materialId === item.materialId);
      return {
        ...item,
        actualQuantity: match ? match.actualQuantity : item.requestedQuantity,
      };
    });

    setMaterials(prev => prev.map(m => {
      const match = actualItems.find(a => a.materialId === m.id);
      if (match && match.actualQuantity > 0) {
        const curStock = m.stocks[slip.branchId] || { warehouse: 0, bar: 0, total: 0 };
        const qty = match.actualQuantity;
        const newWarehouse = Math.max(0, curStock.warehouse - qty);

        if (slip.type === 'cap_quay') {
          // Luân chuyển nội bộ: kho -> quầy
          const newBar = curStock.bar + qty;
          return {
            ...m,
            stocks: {
              ...m.stocks,
              [slip.branchId]: {
                warehouse: newWarehouse,
                bar: newBar,
                total: curStock.total, // Tổng tồn không đổi!
              },
            },
          };
        } else {
          // Xuất hủy hư hỏng đổ vỡ: giảm kho và giảm tổng tồn
          const newTotal = Math.max(0, curStock.total - qty);
          return {
            ...m,
            stocks: {
              ...m.stocks,
              [slip.branchId]: {
                warehouse: newWarehouse,
                bar: curStock.bar,
                total: newTotal,
              },
            },
          };
        }
      }
      return m;
    }));

    const resultingStatus: ExportSlipStatus = isIssue ? 'has_issue' : 'completed';

    const updatedSlip: ExportSlip = {
      ...slip,
      status: resultingStatus,
      items: updatedSlipItems,
      issueReason: isIssue ? issueReason : undefined,
      history: [
        ...slip.history,
        {
          timestamp: new Date().toLocaleString('vi-VN'),
          action: isIssue ? 'Xác nhận thực xuất — Ghi nhận có sự cố' : 'Xác nhận thực xuất thành công',
          performer: `${currentUser.name} (${currentUser.roleLabel})`,
          note: isIssue ? `Sự cố: ${issueReason}` : (slip.type === 'cap_quay' ? 'Đã luân chuyển kho -> quầy.' : 'Đã xuất hủy giảm tồn.'),
        },
      ],
    };

    setExportSlips(prev => prev.map(s => s.id === slipId ? updatedSlip : s));
    showToast(`Đã xác nhận thực xuất phiếu ${slip.code}. Tồn kho đã được cập nhật chính xác.`);
    return true;
  };

  const cancelExportSlip = (slipId: string, reason: string) => {
    const slip = exportSlips.find(s => s.id === slipId);
    if (!slip) return;
    if (slip.status !== 'pending') {
      showToast('Chỉ có thể hủy phiếu khi còn ở trạng thái "Chờ xuất kho"!', 'error');
      return;
    }
    if (!validateBranchWrite(slip.branchId)) return;

    setExportSlips(prev => prev.map(s => {
      if (s.id === slipId) {
        return {
          ...s,
          status: 'cancelled',
          history: [
            ...s.history,
            {
              timestamp: new Date().toLocaleString('vi-VN'),
              action: 'Hủy phiếu xuất kho',
              performer: `${currentUser.name} (${currentUser.roleLabel})`,
              note: reason,
            },
          ],
        };
      }
      return s;
    }));

    showToast('Đã hủy phiếu xuất kho.', 'info');
  };

  // --- STOCKTAKE ACTIONS ---
  const saveStocktakeDraft = (branchId: string, items: { materialId: string; actualStock: number | null; differenceReason?: string }[], note?: string) => {
    if (!validateBranchWrite(branchId)) return;
    const branch = branches.find(b => b.id === branchId);
    const slipNumber = String(stocktakes.length + 1).padStart(4, '0');
    const code = `PKK-2026-${slipNumber}`;

    const enrichedItems = items.map(item => {
      const mat = materials.find(m => m.id === item.materialId);
      const systemStock = mat ? (mat.stocks[branchId]?.total || 0) : 0;
      const actual = item.actualStock;
      const diff = actual !== null ? (systemStock - actual) : undefined; // Chênh lệch = Lý thuyết - Thực tế

      return {
        materialId: item.materialId,
        materialName: mat?.name || 'Nguyên vật liệu',
        unit: mat?.unit || 'đv',
        systemStock,
        actualStock: actual,
        difference: diff,
        differenceReason: item.differenceReason,
      };
    });

    const newStocktake: Stocktake = {
      id: `st-${Date.now()}`,
      code,
      branchId,
      branchName: branch?.name || branchId,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      stocktakeDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      adjustmentStatus: 'none',
      items: enrichedItems,
      note: note || 'Bản nháp kiểm đếm kho',
    };

    setStocktakes(prev => [newStocktake, ...prev]);
    showToast(`Đã lưu bản nháp kiểm kê ${code}!`);
  };

  const confirmStocktake = (branchId: string, items: { materialId: string; actualStock: number; differenceReason?: string }[], note?: string) => {
    if (!validateBranchWrite(branchId)) return;
    const branch = branches.find(b => b.id === branchId);
    const slipNumber = String(stocktakes.length + 1).padStart(4, '0');
    const code = `PKK-2026-${slipNumber}`;

    // Công thức chuẩn xác: Chênh lệch (Hao hụt) = Tồn lý thuyết − Tồn thực tế
    // Dương: Thiếu so với lý thuyết (hao hụt)
    // Âm: Thừa so với lý thuyết
    const enrichedItems = items.map(item => {
      const mat = materials.find(m => m.id === item.materialId);
      const systemStock = mat ? (mat.stocks[branchId]?.total || 0) : 0;
      const actual = item.actualStock;
      const difference = systemStock - actual; // 87 lý thuyết - 85 thực tế = 2 hao hụt!

      return {
        materialId: item.materialId,
        materialName: mat?.name || 'Nguyên vật liệu',
        unit: mat?.unit || 'đv',
        systemStock,
        actualStock: actual,
        difference,
        differenceReason: item.differenceReason,
      };
    });

    const newStocktake: Stocktake = {
      id: `st-${Date.now()}`,
      code,
      branchId,
      branchName: branch?.name || branchId,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      stocktakeDate: new Date().toISOString().split('T')[0],
      status: 'confirmed', // Đã xác nhận kết quả kiểm đếm
      adjustmentStatus: 'none',
      items: enrichedItems,
      note: note || 'Kiểm kê định kỳ',
    };

    // QUY TẮC: Xác nhận kiểm kê chỉ lưu kết quả đếm, TUYỆT ĐỐI không ghi đè số dư sổ kho
    setStocktakes(prev => [newStocktake, ...prev]);
    showToast(`Đã xác nhận kết quả đếm phiếu ${code}! Số dư sổ kho giữ nguyên cho đến khi duyệt điều chỉnh.`);
  };

  const proposeStockAdjustment = (stocktakeId: string, reason: string) => {
    const st = stocktakes.find(s => s.id === stocktakeId);
    if (!st) return;

    if (!validateBranchWrite(st.branchId)) return;

    // Tìm các mặt hàng có chênh lệch giữa thực tế và lý thuyết
    const discrepancies = st.items.filter(i => i.actualStock !== null && i.systemStock !== i.actualStock);
    if (discrepancies.length === 0) {
      showToast('Đợt kiểm kê này khớp 100%, không phát sinh chênh lệch cần điều chỉnh!', 'info');
      return;
    }

    // Ghi nhận số dư tại thời điểm lập đề xuất và số dư hiện tại
    const balanceAtProposal = discrepancies.map(i => {
      const mat = materials.find(m => m.id === i.materialId);
      const currentNow = mat?.stocks[st.branchId]?.total || 0;
      return {
        materialId: i.materialId,
        materialName: i.materialName,
        balance: i.systemStock, // Số dư sổ sách lúc kiểm kê
        unit: i.unit,
      };
    });

    const currentBalanceAtReview = discrepancies.map(i => {
      const mat = materials.find(m => m.id === i.materialId);
      const currentNow = mat?.stocks[st.branchId]?.total || 0;
      return {
        materialId: i.materialId,
        materialName: i.materialName,
        balance: currentNow,
        unit: i.unit,
      };
    });

    const proposedChanges = discrepancies.map(i => {
      const actual = i.actualStock || 0;
      // Mức điều chỉnh tồn = Thực tế - Sổ sách = 85 - 87 = -2
      const deltaAdjustment = actual - i.systemStock;
      return {
        materialId: i.materialId,
        materialName: i.materialName,
        proposed: actual,
        unit: i.unit,
        diff: deltaAdjustment,
      };
    });

    const approval: ApprovalRequest = {
      id: `appr-${Date.now()}`,
      type: 'stock_adjustment',
      title: `Điều chỉnh chênh lệch tồn sau kiểm kê: ${st.code} (${st.branchName})`,
      branchId: st.branchId,
      branchName: st.branchName,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requestedAt: new Date().toLocaleString('vi-VN'),
      status: 'pending',
      referenceId: st.id,
      reason: reason || 'Điều chỉnh số dư sổ kho theo số lượng đếm thực tế.',
      details: {
        summaryText: `Đề xuất điều chỉnh cho ${discrepancies.length} mặt hàng có chênh lệch.`,
        balanceAtProposal,
        currentBalanceAtReview,
        proposedChanges,
      },
    };

    setApprovals(prev => [approval, ...prev]);
    setStocktakes(prev => prev.map(s => s.id === stocktakeId ? { ...s, adjustmentStatus: 'pending' } : s));
    showToast('Đã gửi đề xuất điều chỉnh tồn kho sang Trung tâm Phê duyệt của Chủ cửa hàng!');
  };

  // --- SALES DATA ACTIONS ---
  const importSalesData = (
    periodType: 'ca' | 'ngay' | 'thang',
    period: string, 
    branchId: string, 
    source: 'KiotViet' | 'FAB PDA' | 'Khác',
    items: { recipeId: string; quantity: number }[],
    overwrite: boolean = false
  ): boolean => {
    if (!validateBranchWrite(branchId)) return false;

    const existingIndex = salesRecords.findIndex(r => r.period === period && r.branchId === branchId);
    if (existingIndex >= 0 && !overwrite) {
      return false; // Prompt user to choose overwrite or cancel
    }

    const branch = branches.find(b => b.id === branchId);
    const enrichedItems: SalesRecordItem[] = items.map(item => {
      const rec = recipes.find(r => r.id === item.recipeId);
      return {
        recipeId: item.recipeId,
        recipeCode: rec?.code || 'DU',
        recipeName: rec?.name || 'Món bán',
        quantity: item.quantity,
      };
    });

    const newRecord: SalesRecord = {
      id: `sale-${Date.now()}`,
      periodType,
      period,
      branchId,
      branchName: branch?.name || branchId,
      source,
      importedAt: new Date().toLocaleString('vi-VN'),
      importedBy: `${currentUser.name} (${currentUser.roleLabel})`,
      items: enrichedItems,
    };

    if (existingIndex >= 0 && overwrite) {
      setSalesRecords(prev => {
        const next = [...prev];
        next[existingIndex] = newRecord;
        return next;
      });
      showToast(`Đã ghi đè dữ liệu bán hàng kỳ "${period}" của ${newRecord.branchName}. Báo cáo hao hụt đã được tính toán lại!`);
    } else {
      setSalesRecords(prev => [newRecord, ...prev]);
      showToast(`Đã lưu dữ liệu bán hàng kỳ "${period}" của ${newRecord.branchName}.`);
    }

    return true;
  };

  // --- APPROVAL ACTIONS ---
  const approveRequest = (approvalId: string, note?: string) => {
    const appr = approvals.find(a => a.id === approvalId);
    if (!appr || appr.status !== 'pending') {
      showToast('Đề xuất này đã được xử lý trước đó!', 'error');
      return;
    }

    if (appr.type === 'stock_adjustment') {
      // 1. Điều chỉnh tồn kho: Cập nhật số dư sổ kho
      const st = stocktakes.find(s => s.id === appr.referenceId);
      if (st) {
        setMaterials(prev => prev.map(m => {
          const matchItem = st.items.find(i => i.materialId === m.id);
          if (matchItem && matchItem.actualStock !== null) {
            const curStock = m.stocks[st.branchId] || { warehouse: 0, bar: 0, total: 0 };
            const newTotal = matchItem.actualStock;
            // Phân bổ: giữ nguyên tỷ lệ hoặc ưu tiên quầy bar không âm
            const newBar = Math.min(curStock.bar, newTotal);
            const newWarehouse = Math.max(0, newTotal - newBar);

            return {
              ...m,
              stocks: {
                ...m.stocks,
                [st.branchId]: {
                  warehouse: newWarehouse,
                  bar: newBar,
                  total: newTotal,
                },
              },
            };
          }
          return m;
        }));

        setStocktakes(prev => prev.map(s => s.id === st.id ? { ...s, adjustmentStatus: 'adjusted' } : s));
      }
    } else if (appr.type === 'import_plan') {
      // 2. Kế hoạch nhập: Chuyển sang approved (Chờ kiểm hàng) - CHƯA cộng tồn kho
      setImportSlips(prev => prev.map(s => {
        if (s.id === appr.referenceId) {
          return {
            ...s,
            status: 'approved',
            history: [
              ...s.history,
              {
                timestamp: new Date().toLocaleString('vi-VN'),
                action: 'Chủ cửa hàng duyệt kế hoạch nhập (Chuyển sang Chờ kiểm hàng)',
                performer: `${currentUser.name} (Chủ cửa hàng)`,
                note: note || 'Đồng ý kế hoạch nhập. Cho phép tiến hành nhận hàng.',
              },
            ],
          };
        }
        return s;
      }));
    } else if (appr.type === 'recipe_or_threshold') {
      // 3. Công thức hoặc định mức
      if (appr.subType === 'recipe') {
        const rec = recipes.find(r => r.id === appr.referenceId);
        if (rec) {
          if (rec.pendingChange?.action === 'delete') {
            setRecipes(prev => prev.filter(r => r.id !== rec.id));
          } else {
            const nextVersion = rec.version + 1;
            const newIngredients = rec.pendingChange?.ingredients || rec.ingredients;
            const newVersionEntry = {
              version: nextVersion,
              approvedAt: new Date().toLocaleString('vi-VN'),
              approvedBy: `${currentUser.name} (Chủ cửa hàng)`,
              ingredients: newIngredients,
              note: note || rec.pendingChange?.note || 'Phiên bản phê duyệt mới',
            };

            setRecipes(prev => prev.map(r => {
              if (r.id === rec.id) {
                return {
                  ...r,
                  status: 'active',
                  version: nextVersion,
                  versionHistory: [newVersionEntry, ...r.versionHistory],
                  ingredients: newIngredients,
                  updatedAt: new Date().toISOString().split('T')[0],
                  pendingChange: undefined,
                };
              }
              return r;
            }));
          }
        }
      } else if (appr.subType === 'threshold') {
        // Cập nhật định mức tồn cho material
        const mat = materials.find(m => m.id === appr.referenceId);
        if (mat) {
          const isDelete = appr.details.after === 'Không áp dụng định mức';
          const newVal = isDelete ? null : parseFloat(appr.details.after);

            setMaterials(prev => prev.map(m => {
            if (m.id === mat.id) {
              return {
                ...m,
                minStocks: {
                  ...m.minStocks,
                  [appr.branchId]: isDelete || newVal === null || isNaN(newVal) ? null : newVal,
                },
              };
            }
            return m;
          }));
        }
      }
    }

    setApprovals(prev => prev.map(a => {
      if (a.id === approvalId) {
        return {
          ...a,
          status: 'approved',
          reviewNote: note,
          reviewedAt: new Date().toLocaleString('vi-VN'),
          reviewedBy: `${currentUser.name} (Chủ cửa hàng)`,
        };
      }
      return a;
    }));

    showToast(`Đã phê duyệt thành công đề xuất: ${appr.title}`);
  };

  const rejectRequest = (approvalId: string, reason: string) => {
    const appr = approvals.find(a => a.id === approvalId);
    if (!appr || appr.status !== 'pending') {
      showToast('Đề xuất này đã được xử lý trước đó!', 'error');
      return;
    }

    if (appr.type === 'import_plan') {
      setImportSlips(prev => prev.map(s => {
        if (s.id === appr.referenceId) {
          return {
            ...s,
            status: 'rejected',
            rejectionReason: reason,
            history: [
              ...s.history,
              {
                timestamp: new Date().toLocaleString('vi-VN'),
                action: 'Chủ cửa hàng từ chối kế hoạch nhập',
                performer: `${currentUser.name} (Chủ cửa hàng)`,
                note: reason,
              },
            ],
          };
        }
        return s;
      }));
    } else if (appr.type === 'stock_adjustment') {
      setStocktakes(prev => prev.map(s => s.id === appr.referenceId ? { ...s, adjustmentStatus: 'rejected' } : s));
    } else if (appr.type === 'recipe_or_threshold' && appr.subType === 'recipe') {
      const rec = recipes.find(r => r.id === appr.referenceId);
      if (rec && rec.status === 'pending_approval' && rec.version === 0) {
        // Recipe mới bị từ chối -> xóa khỏi danh sách
        setRecipes(prev => prev.filter(r => r.id !== rec.id));
      } else if (rec) {
        setRecipes(prev => prev.map(r => r.id === rec.id ? { ...r, pendingChange: undefined } : r));
      }
    }

    setApprovals(prev => prev.map(a => {
      if (a.id === approvalId) {
        return {
          ...a,
          status: 'rejected',
          reviewNote: reason,
          reviewedAt: new Date().toLocaleString('vi-VN'),
          reviewedBy: `${currentUser.name} (Chủ cửa hàng)`,
        };
      }
      return a;
    }));

    showToast(`Đã từ chối đề xuất: ${appr.title}`, 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeBranchId,
        setActiveBranchId,
        branches,
        activeBranch,
        materials,
        recipes,
        importSlips,
        exportSlips,
        stocktakes,
        salesRecords,
        approvals,
        toasts,
        showToast,
        removeToast,
        isAuthenticated,
        setIsAuthenticated,
        loginAs,
        logout,
        currentNav,
        setCurrentNav,
        activeTab,
        setActiveTab,
        viewDetailsId,
        setViewDetailsId,
        isGuideOpen,
        setIsGuideOpen,
        addMaterial,
        updateMaterial,
        deactivateMaterial,
        reactivateMaterial,
        requestAddRecipe,
        requestUpdateRecipe,
        requestDeleteRecipe,
        requestThresholdChange,
        createImportSlip,
        editImportSlip,
        receiveImportGoods,
        cancelImportSlip,
        createExportSlip,
        editExportSlip,
        confirmActualExport,
        cancelExportSlip,
        saveStocktakeDraft,
        confirmStocktake,
        proposeStockAdjustment,
        importSalesData,
        approveRequest,
        rejectRequest,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
