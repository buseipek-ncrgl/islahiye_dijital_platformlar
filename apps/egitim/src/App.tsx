import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DemoRoleProvider } from './components/layout/DemoRoleContext';
import { PublicEducationLayout } from './components/public/PublicEducationLayout';
import { EducationLayout } from './components/layout/EducationLayout';

// Public Visitor Pages
import { PublicHomePage } from './pages/PublicHomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProgramDetailPage } from './pages/ProgramDetailPage';
import { LoginPage } from './pages/LoginPage';
import { ApplicationGuidePage } from './pages/ApplicationGuidePage';
import { CalendarPage } from './pages/CalendarPage';
import { CertificateVerifyPage } from './pages/CertificateVerifyPage';

// Authenticated Role Dashboards
import { TraineeDashboardPage } from './pages/TraineeDashboardPage';
import { InstructorDashboardPage } from './pages/InstructorDashboardPage';
import { AdminOverviewPage } from './pages/AdminOverviewPage';
import { ApplicationDecisionPage } from './pages/ApplicationDecisionPage';

// Candidate Portal & Application Flow (Sprint E02-A)
import { CandidateDashboardPage } from './pages/CandidateDashboardPage';
import { CandidateApplicationFormPage } from './pages/CandidateApplicationFormPage';

// Criteria & Scoring Desk (Sprint E02-B)
import { CriteriaManagementPage } from './pages/CriteriaManagementPage';

// Enrollment & Group Management (Sprint E02-C)
import { EnrollmentManagementPage } from './pages/EnrollmentManagementPage';
import { GroupManagementPage } from './pages/GroupManagementPage';

// Session Planning & Attendance Audit (Sprint E03-A)
import { SessionManagementPage } from './pages/SessionManagementPage';
import { AttendanceAuditPage } from './pages/AttendanceAuditPage';

// Assignment Management & Evaluation Audit (Sprint E03-B)
import { AssignmentAuditPage } from './pages/AssignmentAuditPage';

// Final Success Decision & Term Registry (Sprint E03-C)
import { SuccessDecisionPage } from './pages/SuccessDecisionPage';

// Certificate Management & PDF/QR Desk (Sprint E03-D)
import { CertificateManagementPage } from './pages/CertificateManagementPage';

// Direct Messaging & Group Channels (Sprint E04-A)
import { TraineeMessagesPage } from './pages/TraineeMessagesPage';
import { InstructorMessagesPage } from './pages/InstructorMessagesPage';
import { TraineeChannelsPage } from './pages/TraineeChannelsPage';
import { InstructorChannelsPage } from './pages/InstructorChannelsPage';
import { AdminChannelsPage } from './pages/AdminChannelsPage';

// Notification Center, Admin Announcements & Mass Email Desk (Sprint E04-B)
import { NotificationCenterPage } from './pages/NotificationCenterPage';
import { AdminAnnouncementsPage } from './pages/AdminAnnouncementsPage';
import { MassEmailDeskPage } from './pages/MassEmailDeskPage';

// Super Admin, Governance, Audit & Reporting (Sprint E05-A)
import { SuperAdminDashboardPage } from './pages/SuperAdminDashboardPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { RolePermissionsPage } from './pages/RolePermissionsPage';
import { SystemSettingsPage } from './pages/SystemSettingsPage';
import { CentralAuditLogPage } from './pages/CentralAuditLogPage';
import { OperationalReportsPage } from './pages/OperationalReportsPage';

// UX-01: Professional Registration & Dedicated Demo Hub
import { RegisterPage } from './pages/RegisterPage';
import { DemoHubPage } from './pages/DemoHubPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <DemoRoleProvider>
        <Routes>
          {/* ================================================================= */}
          {/* 1. HALKA AÇIK ZİYARETÇİ DENEYİMİ (PublicEducationLayout - Sidebarsız) */}
          {/* ================================================================= */}
          <Route element={<PublicEducationLayout />}>
            {/* Halka Açık Ana Sayfa */}
            <Route path="/" element={<PublicHomePage />} />

            {/* Eğitim Kataloğu */}
            <Route path="/egitimler" element={<CatalogPage />} />

            {/* Program Detay & Müfredat */}
            <Route path="/egitimler/:id" element={<ProgramDetailPage />} />

            {/* Giriş & Demo Rol Masası */}
            <Route path="/giris" element={<LoginPage />} />

            {/* Yeni Aday Hesap Oluşturma (Sprint UX-01) */}
            <Route path="/hesap-olustur" element={<RegisterPage />} />

            {/* Başvuru Rehberi */}
            <Route path="/basvuru-rehberi" element={<ApplicationGuidePage />} />

            {/* 2026 Dönem Takvimi */}
            <Route path="/egitim-takvimi" element={<CalendarPage />} />

            {/* Karekodlu Belge Doğrulama (QR Simülasyonu) */}
            <Route path="/belge-dogrula" element={<CertificateVerifyPage />} />
            <Route path="/belge-dogrula/:verificationCode" element={<CertificateVerifyPage />} />
          </Route>

          {/* ================================================================= */}
          {/* 2. ÖZEL ROL DASHBOARDLARI (EducationLayout - Sidebar & Topbar ile) */}
          {/* ================================================================= */}
          {/* Aday Paneli & Başvuru Takibi (Sprint E02-A) */}
          <Route
            path="/aday"
            element={
              <EducationLayout>
                <CandidateDashboardPage />
              </EducationLayout>
            }
          />

          {/* Dinamik Aday Başvuru Formu (Sprint E02-A) */}
          <Route
            path="/aday/basvuru/:programId"
            element={
              <EducationLayout>
                <CandidateApplicationFormPage />
              </EducationLayout>
            }
          />

          {/* Kursiyer Paneli */}
          <Route
            path="/kursiyer"
            element={
              <EducationLayout>
                <TraineeDashboardPage />
              </EducationLayout>
            }
          />

          {/* Kursiyer Özel Mesajları (Sprint E04-A) */}
          <Route
            path="/kursiyer/mesajlar"
            element={
              <EducationLayout>
                <TraineeMessagesPage />
              </EducationLayout>
            }
          />

          {/* Kursiyer Grup Kanalları (Sprint E04-A) */}
          <Route
            path="/kursiyer/kanallar"
            element={
              <EducationLayout>
                <TraineeChannelsPage />
              </EducationLayout>
            }
          />

          {/* Eğitmen Operasyon & Manuel Yoklama Paneli */}
          <Route
            path="/egitmen"
            element={
              <EducationLayout>
                <InstructorDashboardPage />
              </EducationLayout>
            }
          />

          {/* Eğitmen Kursiyer Mesajları (Sprint E04-A) */}
          <Route
            path="/egitmen/mesajlar"
            element={
              <EducationLayout>
                <InstructorMessagesPage />
              </EducationLayout>
            }
          />

          {/* Eğitmen Sınıf Kanalları (Sprint E04-A) */}
          <Route
            path="/egitmen/kanallar"
            element={
              <EducationLayout>
                <InstructorChannelsPage />
              </EducationLayout>
            }
          />

          {/* İdari Yönetim Genel Bakış */}
          <Route
            path="/yonetim"
            element={
              <EducationLayout>
                <AdminOverviewPage />
              </EducationLayout>
            }
          />

          {/* Yönetici Başvuru Karar Masası */}
          <Route
            path="/yonetim/basvurular"
            element={
              <EducationLayout>
                <ApplicationDecisionPage />
              </EducationLayout>
            }
          />

          {/* Yönetici Kriter & Puanlama Masası (Sprint E02-B) */}
          <Route
            path="/yonetim/kriterler"
            element={
              <EducationLayout>
                <CriteriaManagementPage />
              </EducationLayout>
            }
          />

          {/* Yönetici Kesin Kayıt Masası (Sprint E02-C) */}
          <Route
            path="/yonetim/kesin-kayit"
            element={
              <EducationLayout>
                <EnrollmentManagementPage />
              </EducationLayout>
            }
          />

          {/* Yönetici Grup & Kontenjan Masası (Sprint E02-C) */}
          <Route
            path="/yonetim/gruplar"
            element={
              <EducationLayout>
                <GroupManagementPage />
              </EducationLayout>
            }
          />

          {/* Yönetici Oturum & Takvim Planlama (Sprint E03-A) */}
          <Route
            path="/yonetim/oturumlar"
            element={
              <EducationLayout>
                <SessionManagementPage />
              </EducationLayout>
            }
          />

          {/* Merkezi Denetim Kayıtları (Sprint E05-A) */}
          <Route
            path="/yonetim/denetim"
            element={
              <EducationLayout>
                <CentralAuditLogPage />
              </EducationLayout>
            }
          />

          {/* Yönetici Yoklama ve Devam Denetimi (Sprint E03-A) */}
          <Route
            path="/yonetim/yoklama-denetim"
            element={
              <EducationLayout>
                <AttendanceAuditPage />
              </EducationLayout>
            }
          />

          {/* Yönetici Ödev & Değerlendirme Denetimi (Sprint E03-B) */}
          <Route
            path="/yonetim/odevler"
            element={
              <EducationLayout>
                <AssignmentAuditPage />
              </EducationLayout>
            }
          />

          {/* Yönetici Nihai Başarı Onayı & Dönem Sonu Kütüğü (Sprint E03-C) */}
          <Route
            path="/yonetim/basari-onay"
            element={
              <EducationLayout>
                <SuccessDecisionPage />
              </EducationLayout>
            }
          />

          {/* Yönetici Belge Kütüğü & PDF/QR Masası (Sprint E03-D) */}
          <Route
            path="/yonetim/belgeler"
            element={
              <EducationLayout>
                <CertificateManagementPage />
              </EducationLayout>
            }
          />

          {/* Yönetici Grup Kanal Masası (Sprint E04-A) */}
          <Route
            path="/yonetim/kanallar"
            element={
              <EducationLayout>
                <AdminChannelsPage />
              </EducationLayout>
            }
          />

          {/* Ortak Bildirim Merkezi (Sprint E04-B) */}
          <Route
            path="/bildirimler"
            element={
              <EducationLayout>
                <NotificationCenterPage />
              </EducationLayout>
            }
          />

          {/* Yönetici Kurumsal Duyuru Masası (Sprint E04-B) */}
          <Route
            path="/yonetim/duyurular"
            element={
              <EducationLayout>
                <AdminAnnouncementsPage />
              </EducationLayout>
            }
          />

          {/* Yönetici Toplu E-Posta Simülasyon Masası (Sprint E04-B) */}
          <Route
            path="/yonetim/toplu-eposta"
            element={
              <EducationLayout>
                <MassEmailDeskPage />
              </EducationLayout>
            }
          />

          {/* Süper Yönetici Konsolu (Sprint E05-A) */}
          <Route
            path="/yonetim/super-admin"
            element={
              <EducationLayout>
                <SuperAdminDashboardPage />
              </EducationLayout>
            }
          />

          {/* Kullanıcı ve Rol Yönetimi (Sprint E05-A) */}
          <Route
            path="/yonetim/kullanicilar"
            element={
              <EducationLayout>
                <UserManagementPage />
              </EducationLayout>
            }
          />

          {/* Granüler Yetki Matrisi (Sprint E05-A) */}
          <Route
            path="/yonetim/roller"
            element={
              <EducationLayout>
                <RolePermissionsPage />
              </EducationLayout>
            }
          />

          {/* Sistem ve Politika Ayarları (Sprint E05-A) */}
          <Route
            path="/yonetim/ayarlar"
            element={
              <EducationLayout>
                <SystemSettingsPage />
              </EducationLayout>
            }
          />

          {/* Operasyonel Raporlama (Sprint E05-A) */}
          <Route
            path="/yonetim/raporlar"
            element={
              <EducationLayout>
                <OperationalReportsPage />
              </EducationLayout>
            }
          />

          {/* Özel Ayrılmış Demo ve Rol Yönetim Masası (Sprint UX-01) */}
          <Route
            path="/demo"
            element={
              <EducationLayout>
                <DemoHubPage />
              </EducationLayout>
            }
          />

          {/* Catch-all redirect to public homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DemoRoleProvider>
    </BrowserRouter>
  );
};

export default App;
