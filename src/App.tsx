/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { ToastContainer } from './components/common/Toast';
import { HandoverGuideModal } from './components/common/HandoverGuideModal';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { MaterialsView } from './views/MaterialsView';
import { RecipesAndThresholdsView } from './views/RecipesAndThresholdsView';
import { ImportSlipsView } from './views/ImportSlipsView';
import { ExportSlipsView } from './views/ExportSlipsView';
import { StocktakeView } from './views/StocktakeView';
import { SalesDataView } from './views/SalesDataView';
import { ReportsView } from './views/ReportsView';
import { ApprovalsView } from './views/ApprovalsView';
import { ShieldAlert } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentNav, setCurrentNav, currentUser, isAuthenticated, setIsAuthenticated } = useApp();

  // Dynamic header titles according to role & active view
  const getHeaderMeta = () => {
    switch (currentNav) {
      case 'tong-quan':
        if (currentUser.role === 'nhanvien') {
          return {
            title: 'Trang chính Nhân viên',
            subtitle: 'Thực hiện kiểm nhận hàng, xác nhận thực xuất và kiểm kê thực tế tại chi nhánh',
          };
        }
        if (currentUser.role === 'ketoan') {
          return {
            title: 'Trang chính Kế toán',
            subtitle: 'Nhập dữ liệu bán hàng POS và theo dõi các báo cáo tồn kho, đối chiếu hao hụt',
          };
        }
        if (currentUser.role === 'quanly') {
          return {
            title: 'Tổng quan hoạt động cửa hàng',
            subtitle: 'Theo dõi chỉ số số lượng tồn kho, cảnh báo an toàn và danh sách việc cần xử lý',
          };
        }
        return {
          title: 'Tổng quan hoạt động chuỗi',
          subtitle: 'Theo dõi số lượng tồn kho toàn chuỗi, hàng đợi phê duyệt và các chi nhánh',
        };
      case 'nguyen-vat-lieu':
        return {
          title: 'Nguyên vật liệu',
          subtitle: 'Quản lý thông tin, phân loại, đơn vị tính và tình trạng sử dụng nguyên liệu',
        };
      case 'nhap-kho':
        return {
          title: 'Quản lý Nhập kho',
          subtitle: 'Lập kế hoạch mua hàng, kiểm tra chất lượng và nhận hàng vào kho theo lượng đạt',
        };
      case 'xuat-kho':
        return {
          title: 'Quản lý Xuất kho',
          subtitle: 'Xuất cấp quầy pha chế (luân chuyển nội bộ) và xuất hủy do hư hỏng, đổ vỡ',
        };
      case 'kiem-ke':
        return {
          title: 'Kiểm kê kho thực tế',
          subtitle: 'Kiểm đếm số lượng thực tế tại kho, lưu nháp hoặc xác nhận kết quả kiểm đếm',
        };
      case 'dinh-muc':
        return {
          title: 'Định mức tồn tối thiểu',
          subtitle: 'Thiết lập ngưỡng tồn an toàn theo từng chi nhánh (qua phê duyệt của Chủ cửa hàng)',
        };
      case 'cong-thuc':
        return {
          title: 'Công thức pha chế',
          subtitle: 'Quản lý định lượng nguyên liệu cho món đồ uống mẫu và lịch sử phiên bản đã duyệt',
        };
      case 'du-lieu-ban-hang':
        return {
          title: 'Dữ liệu bán hàng',
          subtitle: 'Nhập file Excel từ KiotViet / FAB PDA theo ca, ngày, tháng để tính tiêu hao lý thuyết',
        };
      case 'bao-cao':
        return {
          title: 'Báo cáo Kho & Hao hụt',
          subtitle: 'Báo cáo số lượng tồn kho và đối chiếu hao hụt thực tế vs công thức (.xlsx)',
        };
      case 'phe-duyet':
        return {
          title: 'Trung tâm Phê duyệt',
          subtitle: 'Dành riêng cho Chủ cửa hàng: phê duyệt điều chỉnh tồn, kế hoạch nhập và công thức/định mức',
        };
      default:
        return {
          title: 'Trình Cà Phê',
          subtitle: 'Hệ thống Quản lý Kho & Nguyên vật liệu',
        };
    }
  };

  // Role Access Enforcement
  const isNavAllowedForRole = () => {
    const role = currentUser.role;
    if (role === 'chucuahang') return true;

    if (role === 'nhanvien') {
      return ['tong-quan', 'nhap-kho', 'xuat-kho', 'kiem-ke'].includes(currentNav);
    }
    if (role === 'quanly') {
      return ['tong-quan', 'nguyen-vat-lieu', 'nhap-kho', 'xuat-kho', 'kiem-ke', 'dinh-muc', 'cong-thuc'].includes(currentNav);
    }
    if (role === 'ketoan') {
      return ['tong-quan', 'du-lieu-ban-hang', 'bao-cao'].includes(currentNav);
    }
    return false;
  };

  // Automatically switch away from unauthorized views when role switches
  useEffect(() => {
    if (!isNavAllowedForRole()) {
      setCurrentNav('tong-quan');
    }
  }, [currentUser.role, currentNav]);

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const headerMeta = getHeaderMeta();
  const hasAccess = isNavAllowedForRole();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans antialiased overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header title={headerMeta.title} subtitle={headerMeta.subtitle} />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6">
          {!hasAccess ? (
            <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center max-w-lg mx-auto mt-12 space-y-3 shadow-xs">
              <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm">Truy cập bị giới hạn</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tài khoản <strong>{currentUser.name}</strong> với vai trò <strong>{currentUser.roleLabel}</strong> không có quyền truy cập màn hình này.
              </p>
              <button
                onClick={() => setCurrentNav('tong-quan')}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                Về trang chính
              </button>
            </div>
          ) : (
            <>
              {currentNav === 'tong-quan' && <DashboardView />}
              {currentNav === 'nguyen-vat-lieu' && <MaterialsView />}
              {currentNav === 'nhap-kho' && <ImportSlipsView />}
              {currentNav === 'xuat-kho' && <ExportSlipsView />}
              {currentNav === 'kiem-ke' && <StocktakeView />}
              {(currentNav === 'dinh-muc' || currentNav === 'cong-thuc') && <RecipesAndThresholdsView />}
              {currentNav === 'du-lieu-ban-hang' && <SalesDataView />}
              {currentNav === 'bao-cao' && <ReportsView />}
              {currentNav === 'phe-duyet' && <ApprovalsView />}
            </>
          )}
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Handover Guide & 18 Screen Matrix Modal */}
      <HandoverGuideModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
