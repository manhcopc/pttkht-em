import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  Download, 
  ArrowRight, 
  ArrowLeft, 
  Database, 
  CheckCircle, 
  Building2, 
  Calendar, 
  Sparkles,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  Layers
} from 'lucide-react';

export const SalesDataView: React.FC = () => {
  const { 
    branches, 
    activeBranchId, 
    recipes, 
    materials, 
    salesRecords, 
    importSalesData, 
    currentUser,
    showToast 
  } = useApp();

  const isBranchLocked = currentUser.role !== 'chucuahang';

  // 3 Clear Steps: 1 -> 2 -> 3
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1 State
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    isBranchLocked ? (currentUser.branchId || 'cn-1') : (activeBranchId === 'all' ? 'cn-1' : activeBranchId)
  );
  const [periodType, setPeriodType] = useState<'ca' | 'ngay' | 'thang'>('ca');
  const [periodText, setPeriodText] = useState<string>('Ca sáng 31/10/2026');
  const [sourceSystem, setSourceSystem] = useState<'KiotViet' | 'FAB PDA'>('KiotViet');
  const [fileName, setFileName] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<{ recipeId: string; recipeName: string; quantity: number }[]>([]);

  // Validation Warnings
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [missingRecipeDrinks, setMissingRecipeDrinks] = useState<string[]>([]);

  // Overwrite Confirmation Modal
  const [isOverwriteModalOpen, setIsOverwriteModalOpen] = useState(false);

  // Sample data fillers
  const handleUseSampleData = (source: 'KiotViet' | 'FAB PDA') => {
    setSourceSystem(source);
    setFileName(`Xuat_Ban_Hang_${source}_${periodText.replace(/\s+/g, '_')}.xlsx`);
    
    // Sample items matching active recipes
    const sample = [
      { recipeId: recipes[0]?.id || 'rec-1', recipeName: recipes[0]?.name || 'Cà phê Sữa đá Trình', quantity: 180 },
      { recipeId: recipes[1]?.id || 'rec-2', recipeName: recipes[1]?.name || 'Bạc Xỉu Sữa Tươi 3 Tầng', quantity: 95 },
      { recipeId: recipes[2]?.id || 'rec-3', recipeName: recipes[2]?.name || 'Cà phê Đen Phin đá', quantity: 85 },
      { recipeId: recipes[3]?.id || 'rec-4', recipeName: recipes[3]?.name || 'Caffe Latte Arabica Đá', quantity: 45 },
      { recipeId: recipes[4]?.id || 'rec-5', recipeName: recipes[4]?.name || 'Trà Ô Long Kem Cheese', quantity: 30 },
    ];
    setParsedItems(sample);
    setValidationErrors([]);
    setMissingRecipeDrinks([]);
    showToast(`Đã nạp file dữ liệu mẫu từ ${source}!`, 'info');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    // Simulate real parsing from file
    const sample = recipes.slice(0, 5).map((r, idx) => ({
      recipeId: r.id,
      recipeName: r.name,
      quantity: 50 + idx * 25,
    }));
    setParsedItems(sample);
    setValidationErrors([]);
    setMissingRecipeDrinks([]);
    showToast(`Đã tải và kiểm tra cấu trúc file "${file.name}"!`);
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFFMa_Mon,Ten_Mon,So_Luong_Ban,Ghi_Chu\n' +
      recipes.map(r => `${r.code},"${r.name}",100,"Mẫu nhập Excel"`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mau_Nhap_Ban_Hang_${sourceSystem}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã tải xuống file mẫu Excel / CSV chuẩn.');
  };

  const handleProceedToPreview = () => {
    if (parsedItems.length === 0) {
      showToast('Vui lòng tải file Excel bán hàng hoặc bấm "Dùng dữ liệu mẫu"!', 'error');
      return;
    }
    // Validation
    const errors: string[] = [];
    const missing: string[] = [];

    parsedItems.forEach(item => {
      if (item.quantity <= 0) {
        errors.push(`Món "${item.recipeName}" có số lượng bán <= 0`);
      }
      const rec = recipes.find(r => r.id === item.recipeId);
      if (!rec) {
        missing.push(item.recipeName);
      }
    });

    setValidationErrors(errors);
    setMissingRecipeDrinks(missing);

    if (errors.length > 0) {
      showToast('Phát hiện dữ liệu không hợp lệ. Vui lòng kiểm tra lại!', 'error');
      return;
    }

    setCurrentStep(2);
  };

  const handleConfirmSave = (overwrite: boolean = false) => {
    const success = importSalesData(
      periodType,
      periodText,
      selectedBranchId,
      sourceSystem,
      parsedItems.map(i => ({ recipeId: i.recipeId, quantity: i.quantity })),
      overwrite
    );

    if (!success) {
      // Conflict exists, show overwrite confirmation modal
      setIsOverwriteModalOpen(true);
    } else {
      setIsOverwriteModalOpen(false);
      setCurrentStep(3);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setFileName('');
    setParsedItems([]);
    setValidationErrors([]);
    setMissingRecipeDrinks([]);
  };

  const totalCups = parsedItems.reduce((sum, i) => sum + i.quantity, 0);

  // Ingredient Deductions preview (Tính tiêu hao nguyên liệu lý thuyết theo công thức)
  const ingredientDeductions: Record<string, { name: string; unit: string; totalQty: number }> = {};
  parsedItems.forEach(item => {
    const rec = recipes.find(r => r.id === item.recipeId);
    if (rec) {
      rec.ingredients.forEach(ing => {
        if (!ingredientDeductions[ing.materialId]) {
          ingredientDeductions[ing.materialId] = {
            name: ing.materialName,
            unit: ing.unit,
            totalQty: 0,
          };
        }
        ingredientDeductions[ing.materialId].totalQty += ing.quantity * item.quantity;
      });
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 3-Step Indicator Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className={`p-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
            currentStep === 1 ? 'bg-emerald-800 text-white shadow-xs' : currentStep > 1 ? 'bg-emerald-50 text-emerald-800' : 'text-slate-400 bg-slate-50'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              currentStep === 1 ? 'bg-white text-emerald-900' : currentStep > 1 ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
            }`}>
              {currentStep > 1 ? <Check className="w-3 h-3" /> : '1'}
            </span>
            <span>Bước 1: Chọn kỳ & file Excel</span>
          </div>

          <div className={`p-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
            currentStep === 2 ? 'bg-emerald-800 text-white shadow-xs' : currentStep > 2 ? 'bg-emerald-50 text-emerald-800' : 'text-slate-400 bg-slate-50'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              currentStep === 2 ? 'bg-white text-emerald-900' : currentStep > 2 ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
            }`}>
              {currentStep > 2 ? <Check className="w-3 h-3" /> : '2'}
            </span>
            <span>Bước 2: Xem trước tiêu hao lý thuyết</span>
          </div>

          <div className={`p-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
            currentStep === 3 ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-400 bg-slate-50'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              currentStep === 3 ? 'bg-white text-emerald-900' : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </span>
            <span>Bước 3: Xác nhận lưu</span>
          </div>
        </div>
      </div>

      {/* STEP 1: CHỌN CHI NHÁNH, KỲ BÁN VÀ FILE EXCEL */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Nhập file Excel từ hệ thống bán hàng
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hỗ trợ tệp xuất báo cáo từ <strong>KiotViet</strong> hoặc <strong>FAB PDA</strong> để tính lượng tiêu hao nguyên liệu lý thuyết.
            </p>
          </div>

          {/* Form Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Chi nhánh áp dụng <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={isBranchLocked}
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 ${
                  isBranchLocked ? 'cursor-not-allowed opacity-80' : 'focus:border-emerald-700'
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
              <label className="block font-semibold text-slate-700 mb-1">Loại kỳ bán hàng</label>
              <select
                value={periodType}
                onChange={(e) => {
                  const t = e.target.value as 'ca' | 'ngay' | 'thang';
                  setPeriodType(t);
                  if (t === 'ca') setPeriodText('Ca sáng 31/10/2026');
                  if (t === 'ngay') setPeriodText('31/10/2026');
                  if (t === 'thang') setPeriodText('Tháng 10/2026');
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-700"
              >
                <option value="ca">Theo ca (Ca sáng / Ca tối)</option>
                <option value="ngay">Theo ngày (Hàng ngày)</option>
                <option value="thang">Theo tháng / Tuần</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kỳ dữ liệu cụ thể</label>
              <input
                type="text"
                value={periodText}
                onChange={(e) => setPeriodText(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-emerald-700"
              />
            </div>
          </div>

          {/* Source Selection & Template Download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">Hệ thống nguồn:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSourceSystem('KiotViet')}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                    sourceSystem === 'KiotViet'
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  KiotViet
                </button>
                <button
                  type="button"
                  onClick={() => setSourceSystem('FAB PDA')}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                    sourceSystem === 'FAB PDA'
                      ? 'bg-blue-800 text-white border-blue-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  FAB PDA
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-emerald-800 hover:underline flex items-center gap-1 font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file Excel mẫu ({sourceSystem})</span>
            </button>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-200 hover:border-emerald-700 rounded-2xl p-8 text-center transition-all bg-slate-50/50">
            <input
              type="file"
              id="pos-excel-upload"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="pos-excel-upload" className="cursor-pointer space-y-2 block">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-800">
                {fileName ? fileName : 'Bấm vào đây để chọn tệp Excel (.xlsx, .csv)'}
              </div>
              <p className="text-[11px] text-slate-400">
                Tự động kiểm tra cột bắt buộc: Mã món, Tên món, Số lượng bán
              </p>
            </label>

            {/* Quick Demo Sample Data Button */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[11px] text-slate-400">Hoặc trải nghiệm nhanh:</span>
              <button
                type="button"
                onClick={() => handleUseSampleData('KiotViet')}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Dùng dữ liệu mẫu KiotViet</span>
              </button>
              <button
                type="button"
                onClick={() => handleUseSampleData('FAB PDA')}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-600 hover:bg-blue-50 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                <span>Dùng dữ liệu mẫu FAB PDA</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleProceedToPreview}
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2"
            >
              <span>Tiếp tục: Xem trước tiêu hao</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: XEM TRƯỚC SỐ LƯỢNG MÓN BÁN & TIÊU HAO NGUYÊN LIỆU THEO CÔNG THỨC */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Xem trước dữ liệu tiêu hao lý thuyết</h2>
              <p className="text-xs text-slate-500">
                Chi nhánh: <strong>{branches.find(b => b.id === selectedBranchId)?.name?.split('—')[0]}</strong> • Kỳ: <strong>{periodText}</strong> • Nguồn: <strong>{sourceSystem}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Tổng lượng bán</span>
              <span className="text-lg font-extrabold text-emerald-800">{totalCups} ly/phần</span>
            </div>
          </div>

          {/* Missing Recipe Warning if Any */}
          {missingRecipeDrinks.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4" />
                Phát hiện {missingRecipeDrinks.length} món chưa có công thức pha chế:
              </div>
              <p className="text-[11px]">{missingRecipeDrinks.join(', ')} — các món này sẽ không được tính trừ tiêu hao lý thuyết.</p>
            </div>
          )}

          {/* Sold Cups Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Danh sách món đồ uống bán ra (Từ file Excel)
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-3">Tên món đồ uống</th>
                    <th className="py-2.5 px-3 text-right">Số lượng bán (ly)</th>
                    <th className="py-2.5 px-3">Tình trạng công thức</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedItems.map(item => {
                    const rec = recipes.find(r => r.id === item.recipeId);
                    return (
                      <tr key={item.recipeId} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{item.recipeName}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 font-mono">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3">
                          {rec ? (
                            <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5" /> Có công thức (v{rec.version})
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium text-[11px]">Chưa lập công thức</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Theoretical Material Consumption Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-700" />
              2. Tiêu hao nguyên vật liệu lý thuyết tương ứng
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-3">Nguyên vật liệu</th>
                    <th className="py-2.5 px-3 text-right">Tổng lượng tiêu hao tính toán</th>
                    <th className="py-2.5 px-3">Đơn vị tính</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(ingredientDeductions).map(([matId, deduction]) => (
                    <tr key={matId} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{deduction.name}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-900 font-mono">
                        {deduction.totalQty.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{deduction.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại bước 1</span>
            </button>

            <button
              type="button"
              onClick={() => handleConfirmSave(false)}
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Xác nhận lưu dữ liệu</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LƯU THÀNH CÔNG */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-4 shadow-xs animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Nhập dữ liệu bán hàng thành công!</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Dữ liệu bán hàng kỳ <strong>{periodText}</strong> tại <strong>{branches.find(b => b.id === selectedBranchId)?.name?.split('—')[0]}</strong> đã được ghi nhận. Các báo cáo hao hụt và đối chiếu đã tự động tính toán lại.
          </p>

          <div className="flex items-center justify-center gap-3 pt-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Nhập tiếp kỳ khác
            </button>
            <button
              onClick={() => window.location.hash = 'bao-cao'}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Xem báo cáo hao hụt
            </button>
          </div>
        </div>
      )}

      {/* Overwrite Confirmation Modal (KHI NHẬP TRÙNG KỲ/CHI NHÁNH) */}
      {isOverwriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Phát hiện trùng kỳ dữ liệu</h4>
                <p className="text-slate-500 text-[11px]">{periodText}</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Dữ liệu bán hàng của kỳ này tại chi nhánh đã chọn đã tồn tại trong hệ thống. Bạn muốn <strong>Ghi đè</strong> để thay thế toàn bộ dữ liệu kỳ (không cộng dồn) hay <strong>Hủy bỏ</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOverwriteModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleConfirmSave(true)}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
              >
                Ghi đè dữ liệu kỳ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
