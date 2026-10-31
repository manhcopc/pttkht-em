export type Role = 'chucuahang' | 'quanly' | 'ketoan' | 'nhanvien';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  roleLabel: string;
  avatar?: string;
  branchId?: string; // 'cn-1', 'cn-2', 'cn-3' or 'all' for owner
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  isMain?: boolean;
}

export type MaterialCategory = 
  | 'Cà phê hạt & Bột' 
  | 'Sữa & Chế phẩm sữa' 
  | 'Trà & Thảo mộc' 
  | 'Syrup & Mứt' 
  | 'Đường & Phụ gia' 
  | 'Bao bì & Ly tách';

export interface StockDetail {
  warehouse: number; // Tồn tại kho chứa
  bar: number;       // Tồn tại quầy pha chế
  total: number;     // Tổng tồn chi nhánh (warehouse + bar)
}

export interface Material {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  stocks: Record<string, StockDetail>; // branchId -> { warehouse, bar, total }
  minStocks: Record<string, number | null>; // branchId -> định mức tồn an toàn tối thiểu (null = không áp dụng)
  lossThresholds?: Record<string, number>; // branchId -> ngưỡng hao hụt cho phép (ví dụ 1.5% hoặc 0.5kg)
  status: 'active' | 'inactive';
  description?: string;
  supplier?: string;
  deactivationReason?: string;
}

export interface RecipeIngredient {
  materialId: string;
  materialName: string;
  quantity: number; // Định lượng > 0
  unit: string;
}

export interface RecipeVersion {
  version: number;
  approvedAt: string;
  approvedBy: string;
  ingredients: RecipeIngredient[];
  note?: string;
}

export interface Recipe {
  id: string;
  code: string;
  name: string; // Chọn từ danh sách mẫu có sẵn
  category: 'Cà phê truyền thống' | 'Cà phê pha máy' | 'Trà & Macchiato' | 'Đá xay & Sinh tố';
  ingredients: RecipeIngredient[];
  status: 'active' | 'pending_approval' | 'inactive';
  note?: string;
  version: number;
  versionHistory: RecipeVersion[];
  updatedAt: string;
  pendingChange?: {
    action: 'add' | 'update' | 'delete';
    ingredients?: RecipeIngredient[];
    note?: string;
    requestedBy: string;
    requestedAt: string;
    approvalId: string;
  };
}

export type ImportSlipStatus = 
  | 'pending_approval'   // Chờ phê duyệt (kế hoạch nhập hàng)
  | 'approved'           // Chờ kiểm hàng
  | 'received'           // Đã tiếp nhận (đủ & đạt)
  | 'shortage'           // Thiếu hàng
  | 'defect'             // Không đạt chất lượng
  | 'rejected'           // Đã từ chối
  | 'cancelled';         // Đã hủy

export interface ImportSlipItem {
  materialId: string;
  materialName: string;
  unit: string;
  plannedQuantity: number;
  receivedQuantity: number; // Lũy kế số lượng thực nhận
  defectQuantity: number;   // Số lượng lỗi/hỏng
  acceptedQuantity: number; // Lượng đạt chất lượng = receivedQuantity - defectQuantity (chỉ cộng tồn theo lượng này)
  defectReason?: string;
}

export interface ImportSlip {
  id: string;
  code: string;
  branchId: string;
  branchName: string;
  creatorId: string;
  creatorName: string;
  supplier: string;
  orderDate: string;
  expectedDate: string;
  status: ImportSlipStatus;
  items: ImportSlipItem[];
  note?: string;
  rejectionReason?: string;
  history: {
    timestamp: string;
    action: string;
    performer: string;
    note?: string;
    oldData?: string;
    newData?: string;
  }[];
}

export type ExportSlipType = 
  | 'cap_quay'          // Cấp quầy pha chế (Luân chuyển nội bộ kho -> quầy)
  | 'huy_hong';         // Xuất hủy do hư hỏng, đổ vỡ

export type ExportSlipStatus = 
  | 'pending'            // Chờ xuất kho
  | 'completed'          // Hoàn thành
  | 'has_issue'          // Có sự cố
  | 'cancelled';         // Đã hủy

export interface ExportSlipItem {
  materialId: string;
  materialName: string;
  unit: string;
  requestedQuantity: number;
  actualQuantity?: number;
}

export interface ExportSlip {
  id: string;
  code: string;
  branchId: string;
  branchName: string;
  type: ExportSlipType;
  creatorId: string;
  creatorName: string;
  requestDate: string;
  status: ExportSlipStatus;
  items: ExportSlipItem[];
  reason: string;
  issueReason?: string;
  history: {
    timestamp: string;
    action: string;
    performer: string;
    note?: string;
  }[];
}

export type StocktakeStatus = 
  | 'in_progress'        // Đang lập
  | 'draft'              // Bản nháp
  | 'confirmed';         // Đã xác nhận

export interface StocktakeItem {
  materialId: string;
  materialName: string;
  unit: string;
  systemStock: number;          // Tồn sổ sách tại thời điểm kiểm (Nhân viên không thấy)
  actualStock: number | null;   // Số lượng thực tế kiểm đếm (mặc định để trống, phân biệt null vs 0)
  difference?: number;          // Tồn lý thuyết - Tồn thực tế (hoặc actual - system)
  differenceReason?: string;
}

export interface Stocktake {
  id: string;
  code: string;
  branchId: string;
  branchName: string;
  creatorId: string;
  creatorName: string;
  stocktakeDate: string;
  status: StocktakeStatus;
  adjustmentStatus: 'none' | 'pending' | 'adjusted' | 'rejected';
  items: StocktakeItem[];
  note?: string;
}

export interface SalesRecordItem {
  recipeId: string;
  recipeCode: string;
  recipeName: string;
  quantity: number;
}

export interface SalesRecord {
  id: string;
  periodType: 'ca' | 'ngay' | 'thang';
  period: string; // e.g. "Ca sáng 26/10/2026", "26/10/2026", "Tháng 10/2026"
  branchId: string;
  branchName: string;
  source: 'KiotViet' | 'FAB PDA' | 'Khác';
  importedAt: string;
  importedBy: string;
  items: SalesRecordItem[];
}

export type ApprovalType = 
  | 'stock_adjustment'     // Điều chỉnh tồn kho (từ kiểm kê)
  | 'import_plan'          // Kế hoạch nhập hàng
  | 'recipe_or_threshold'; // Công thức hoặc định mức tồn

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  subType?: 'recipe' | 'threshold';
  title: string;
  branchId: string;
  branchName: string;
  requesterId: string;
  requesterName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  referenceId: string;
  reason: string;
  details: {
    summaryText: string;
    balanceAtProposal?: { materialId: string; materialName: string; balance: number; unit: string }[];
    currentBalanceAtReview?: { materialId: string; materialName: string; balance: number; unit: string }[];
    proposedChanges?: { materialId: string; materialName: string; proposed: number; unit: string; diff?: number }[];
    before?: any;
    after?: any;
    warningIfChanged?: string;
  };
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
