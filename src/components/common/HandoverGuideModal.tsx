import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, BookOpen, Check, ShieldCheck, Building2, Users, Layers, Info } from 'lucide-react';

export const HandoverGuideModal: React.FC = () => {
  const { isGuideOpen, setIsGuideOpen } = useApp();

  if (!isGuideOpen) return null;

  const screenMatrix = [
    {
      code: 'MH01',
      name: 'Đăng nhập',
      roles: 'Tất cả vai trò (Nhân viên, Quản lý, Kế toán, Chủ)',
      description: 'Đăng nhập an toàn, xóa trạng thái điều hướng/biểu mẫu cũ và chuyển hướng về đúng trang chính của vai trò.',
    },
    {
      code: 'MH02',
      name: 'Trang chính Nhân viên',
      roles: 'Nhân viên kho & quầy',
      description: 'Giao diện riêng gồm 3 lối tắt: Nhập kho (kiểm nhận), Xuất kho (giao quầy), Kiểm kê (đếm thực tế) và danh sách việc cần làm.',
    },
    {
      code: 'MH03',
      name: 'Trang chính Quản lý',
      roles: 'Quản lý cửa hàng',
      description: 'Theo dõi số lượng tồn, cảnh báo chạm định mức an toàn, danh sách đơn hàng chờ kiểm nhận/thực xuất và lối tắt lập phiếu.',
    },
    {
      code: 'MH04',
      name: 'Trang chính Kế toán',
      roles: 'Kế toán',
      description: 'Tập trung vào: Nhập dữ liệu bán hàng, thông tin kỳ bán gần nhất, xem báo cáo tồn kho, xem báo cáo hao hụt. Không có nút kiểm nhận hay xác nhận xuất.',
    },
    {
      code: 'MH05',
      name: 'Trang chính Chủ cửa hàng',
      roles: 'Chủ cửa hàng',
      description: 'Tổng quan toàn chuỗi hoặc từng chi nhánh, hàng đợi phê duyệt, cảnh báo tồn an toàn và toàn quyền truy cập trực tiếp mọi phân hệ.',
    },
    {
      code: 'MH06',
      name: 'Nguyên vật liệu',
      roles: 'Chủ cửa hàng, Quản lý',
      description: 'Danh mục nguyên liệu, phân loại, đơn vị tính, số lượng tồn kho chứa, quầy bar, tổng tồn. Không có đơn giá, không sửa trực tiếp định mức ở đây.',
    },
    {
      code: 'MH07',
      name: 'Định mức',
      roles: 'Chủ cửa hàng, Quản lý (qua phê duyệt)',
      description: 'Quản lý định mức tồn an toàn tối thiểu theo từng chi nhánh. Thao tác thêm, sửa, hủy định mức đều gửi yêu cầu Chờ phê duyệt sang Chủ.',
    },
    {
      code: 'MH08',
      name: 'Công thức',
      roles: 'Chủ cửa hàng, Quản lý (qua phê duyệt)',
      description: 'Chọn món từ danh sách mẫu có sẵn, định lượng nguyên liệu (> 0), lịch sử phiên bản đã duyệt. Thêm, sửa, xóa đều gửi yêu cầu Chờ phê duyệt.',
    },
    {
      code: 'MH09',
      name: 'Danh sách phiếu nhập',
      roles: 'Chủ cửa hàng, Quản lý, Nhân viên',
      description: 'Danh sách phiếu nhập theo 7 trạng thái chuẩn: Chờ phê duyệt, Chờ kiểm hàng, Đã tiếp nhận, Thiếu hàng, Không đạt chất lượng, Đã từ chối, Đã hủy.',
    },
    {
      code: 'MH10',
      name: 'Chi tiết & Lập phiếu nhập',
      roles: 'Quản lý, Chủ (lập); Nhân viên, Quản lý, Chủ (nhận)',
      description: 'Tạo kế hoạch nhập hàng chờ duyệt; ghi nhận thực nhận và hàng lỗi, chỉ cộng tồn theo lượng đạt chất lượng. Hỗ trợ giao bù lũy kế.',
    },
    {
      code: 'MH11',
      name: 'Danh sách phiếu xuất',
      roles: 'Chủ cửa hàng, Quản lý, Nhân viên',
      description: 'Danh mục phiếu xuất với 2 loại: Cấp quầy pha chế và Xuất hủy do hư hỏng, đổ vỡ. Trạng thái: Chờ xuất kho, Hoàn thành, Có sự cố, Đã hủy.',
    },
    {
      code: 'MH12',
      name: 'Chi tiết & Xác nhận thực xuất',
      roles: 'Quản lý, Chủ (lập/sửa/hủy); Nhân viên, Quản lý, Chủ (xác nhận)',
      description: 'Chặn xuất vượt tồn kho chứa khả dụng; xác nhận thực xuất một lần; mô hình luân chuyển nội bộ: kho -> quầy bar (tổng tồn chi nhánh không đổi).',
    },
    {
      code: 'MH13',
      name: 'Kiểm kê',
      roles: 'Chủ cửa hàng, Quản lý, Nhân viên',
      description: 'Phiếu mới hiển thị Đang lập; Lưu nháp -> Bản nháp; Xác nhận -> Đã xác nhận. Nhân viên không thấy sổ sách. Không tự ý ghi đè sổ kho.',
    },
    {
      code: 'MH14',
      name: 'Dữ liệu bán hàng',
      roles: 'Chủ cửa hàng, Kế toán',
      description: 'Nhập file Excel từ KiotViet hoặc FAB PDA theo ca/ngày/tháng. Kiểm tra cột và công thức món. Trùng kỳ: chọn Ghi đè hoặc Hủy.',
    },
    {
      code: 'MH15',
      name: 'Báo cáo tồn kho',
      roles: 'Chủ cửa hàng, Kế toán',
      description: 'Lọc chi nhánh, thời điểm, nhóm nguyên liệu. Biểu đồ số lượng theo nguyên liệu tương đồng. Xuất file Microsoft Excel (.xlsx) chuẩn.',
    },
    {
      code: 'MH16',
      name: 'Báo cáo hao hụt',
      roles: 'Chủ cửa hàng, Kế toán',
      description: 'Công thức chuẩn: Chênh lệch = Tồn lý thuyết − Tồn thực tế (Dương = Hao hụt). Độc lập với định mức an toàn. Xuất file .xlsx chuẩn.',
    },
    {
      code: 'MH17',
      name: 'Danh sách phê duyệt',
      roles: 'Chủ cửa hàng (duy nhất)',
      description: '3 nhóm duyệt: Điều chỉnh tồn kho, Kế hoạch nhập hàng, Công thức & định mức. Thao tác trực tiếp không cần chuyển vai trò.',
    },
    {
      code: 'MH18',
      name: 'Chi tiết phê duyệt',
      roles: 'Chủ cửa hàng (duy nhất)',
      description: 'So sánh 3 trạng thái số dư (Lúc đề xuất, Hiện tại, Đề nghị); cảnh báo nếu số dư đã biến động; từ chối bắt buộc nhập lý do.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <BookOpen className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Tài liệu bàn giao & Bảng đối chiếu 18 Màn hình</h2>
              <p className="text-xs text-emerald-200/90">
                Hệ thống Quản lý Kho & Nguyên vật liệu — Chuỗi Trình Cà Phê
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsGuideOpen(false)}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* Section: Mô hình xuất cấp quầy & luân chuyển nội bộ */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-2 text-emerald-950">
            <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-700" />
              Mô hình quản lý xuất cấp quầy & tiêu hao nội bộ Trình Cà Phê
            </h3>
            <div className="space-y-1 text-xs">
              <p>• <strong>Cấp quầy pha chế:</strong> Là luân chuyển nội bộ trong chi nhánh (giảm tồn tại kho chứa, tăng tồn tại quầy bar). Tổng tồn chi nhánh không giảm khi cấp quầy.</p>
              <p>• <strong>Xuất hủy do hư hỏng, đổ vỡ:</strong> Làm giảm trực tiếp tồn kho tại vị trí xuất và giảm tổng tồn chi nhánh.</p>
              <p>• <strong>Tiêu hao bán hàng:</strong> Được tính tự động dựa trên số ly bán ra nhân với định lượng công thức, trừ trực tiếp lượng tồn tại quầy bar (hoặc tổng tồn), tuyệt đối không tính trùng với lượng nguyên liệu đã cấp quầy trước đó.</p>
            </div>
          </div>

          {/* Section: Bảng đối chiếu chuẩn 18 màn hình */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-800" />
              Bảng đối chiếu 18 Màn hình nghiệp vụ (MH01 — MH18)
            </h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2.5 px-3 w-16">Mã MH</th>
                    <th className="py-2.5 px-3 w-48">Tên màn hình</th>
                    <th className="py-2.5 px-3 w-56">Phân quyền vai trò</th>
                    <th className="py-2.5 px-3">Mô tả nghiệp vụ & quy tắc vận hành</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {screenMatrix.map(item => (
                    <tr key={item.code} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-900">{item.code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{item.name}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{item.roles}</td>
                      <td className="py-2.5 px-3 text-slate-600 leading-relaxed">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setIsGuideOpen(false)}
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Đã hiểu & đóng
          </button>
        </div>
      </div>
    </div>
  );
};
