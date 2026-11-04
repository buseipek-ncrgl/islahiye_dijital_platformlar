import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  QrCode,
  Download,
  CheckCircle2,
  ShieldCheck,
  Fingerprint,
  Calendar,
  Building2,
  FileCheck2,
  Check,
  Copy,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { CertificatePreviewModal } from '../components/certificate/CertificatePreviewModal';
import {
  getActiveAssignmentForCandidate,
  getGroupById,
} from '../services/enrollmentStorage';
import {
  getCertificatesByCandidateId,
  subscribeToCertificateUpdates,
  checkCertificateAcademicDiscrepancy,
} from '../services/certificateStorage';
import { calculateFinalEligibility } from '../services/successEngine';
import { calculateTraineeAttendance } from '../services/attendanceEngine';
import { calculateTraineeAssignmentPerformance } from '../services/assignmentEngine';
import { downloadCertificatePDF } from '../services/pdfEngine';
import { generateQRSVG, getAppVerificationUrl } from '../services/qrEngine';
import { CertificateRecord } from '../types';

export const TraineeCertificatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useDemoRole();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const unsub1 = subscribeToCertificateUpdates(() => setRefreshTrigger((p) => p + 1));
    return () => {
      unsub1();
    };
  }, []);

  const activeAssignment = useMemo(() => {
    return getActiveAssignmentForCandidate(currentUser.id);
  }, [currentUser.id, refreshTrigger]);

  const assignedGroup = useMemo(() => {
    if (!activeAssignment) return null;
    return getGroupById(activeAssignment.groupId) || null;
  }, [activeAssignment]);

  const traineeCertificates = useMemo(() => {
    return getCertificatesByCandidateId(currentUser.id);
  }, [currentUser.id, refreshTrigger]);

  // Canlı Devam ve Ödev Hesaplamaları
  const attendanceCalc = useMemo(() => {
    if (!assignedGroup) return null;
    return calculateTraineeAttendance(currentUser.id, assignedGroup.id, {
      enrollmentDate: activeAssignment?.assignedAt,
    });
  }, [currentUser.id, assignedGroup, activeAssignment, refreshTrigger]);

  const assignmentPerf = useMemo(() => {
    if (!assignedGroup) return null;
    return calculateTraineeAssignmentPerformance(currentUser.id, assignedGroup.id);
  }, [currentUser.id, assignedGroup, refreshTrigger]);

  // Nihai Uygunluk ve Karar
  const finalEligibility = useMemo(() => {
    if (!activeAssignment || !assignedGroup) return null;
    return calculateFinalEligibility(
      activeAssignment.enrollmentId || activeAssignment.candidateId || activeAssignment.id,
      activeAssignment.termId
    );
  }, [assignedGroup, activeAssignment, refreshTrigger]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Step Status Determinations
  const step1Passed = attendanceCalc && attendanceCalc.completedSessionsCount > 0 && attendanceCalc.hasPassedThreshold;
  const step2Passed = assignmentPerf && assignmentPerf.averageScore !== null && assignmentPerf.averageScore >= 70;
  const step3Passed = assignmentPerf && assignmentPerf.mandatoryAssignmentsTotal > 0 && assignmentPerf.isMandatoryAllApproved;
  const step4Passed = traineeCertificates.length > 0 || finalEligibility?.finalStatus === 'admin_approved';

  const completedStepsCount = (step1Passed ? 1 : 0) + (step2Passed ? 1 : 0) + (step3Passed ? 1 : 0) + (step4Passed ? 1 : 0);
  const journeyProgressPercent = Math.round((completedStepsCount / 4) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-16">
      {/* 1. Üst Başlık & Hızlı Navigasyon */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Belgelerim & Resmî Başarı Kütüğü
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            İslahiye Ticaret Odası onaylı katılım belgeleri, mezuniyet tescilleri ve 7/24 teyit edilebilir karekod doğrulama kodlarınız.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/kursiyer/belge-dogrula')}
            className="h-9 px-4 inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Karekod Masasında Doğrula</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/kursiyer')}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <span>Panoya Dön →</span>
          </button>
        </div>
      </div>

      {/* 2. REFERANS LMS STANDARDI: Sertifika Hak Ediş Yolculuğu (Milestone Stepper) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Stepper Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-600 text-white">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Resmî Belge Hak Ediş Yolculuğu (4 Aşamalı Denetim)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Oda mevzuatı gereği katılım belgesi tescili için 4 kriterin eksiksiz sağlanması zorunludur.
            </p>
          </div>

          {/* Genel İlerleme Göstergesi */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">
                {completedStepsCount} / 4 Koşul Tamamlandı
              </div>
              <div className="text-[11px] text-slate-500">
                %{journeyProgressPercent} Hak Ediş Tamamlandı
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-slate-200 relative flex items-center justify-center bg-white shadow-2xs">
              <span className="text-xs font-extrabold text-blue-700 tabular-nums">
                %{journeyProgressPercent}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Aşamalı Yatay Bağlantılı Stepper Akışı */}
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            
            {/* Step 1: %80 Devam Barajı */}
            <div
              className={`relative p-4 rounded-xl border transition-all ${
                step1Passed
                  ? 'bg-emerald-50/60 border-emerald-200 ring-1 ring-emerald-300/40'
                  : attendanceCalc && attendanceCalc.completedSessionsCount > 0
                  ? 'bg-amber-50/60 border-amber-200 ring-1 ring-amber-300/40'
                  : 'bg-slate-50/70 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    step1Passed
                      ? 'bg-emerald-600 text-white'
                      : attendanceCalc && attendanceCalc.completedSessionsCount > 0
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {step1Passed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    step1Passed
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : attendanceCalc && attendanceCalc.completedSessionsCount > 0
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {step1Passed ? 'Sağlandı' : attendanceCalc && attendanceCalc.completedSessionsCount > 0 ? 'Kritik' : 'Hesaplanıyor'}
                </span>
              </div>
              <h3 className="font-bold text-xs text-slate-900">1. Devam Koşulu</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">En az %80 oturum katılımı</p>
              
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-600">
                  {attendanceCalc && attendanceCalc.completedSessionsCount > 0
                    ? `${attendanceCalc.attendedCount} / ${attendanceCalc.completedSessionsCount} ders`
                    : 'Henüz ders yok'}
                </span>
                <strong className={`tabular-nums ${step1Passed ? 'text-emerald-700' : 'text-slate-800'}`}>
                  {attendanceCalc && attendanceCalc.completedSessionsCount > 0
                    ? `%${attendanceCalc.attendanceRate}`
                    : '%0'}
                </strong>
              </div>
            </div>

            {/* Step 2: 70/100 Not Ortalaması */}
            <div
              className={`relative p-4 rounded-xl border transition-all ${
                step2Passed
                  ? 'bg-emerald-50/60 border-emerald-200 ring-1 ring-emerald-300/40'
                  : assignmentPerf && assignmentPerf.averageScore !== null
                  ? 'bg-amber-50/60 border-amber-200 ring-1 ring-amber-300/40'
                  : 'bg-slate-50/70 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    step2Passed
                      ? 'bg-emerald-600 text-white'
                      : assignmentPerf && assignmentPerf.averageScore !== null
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {step2Passed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    step2Passed
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : assignmentPerf && assignmentPerf.averageScore !== null
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {step2Passed ? 'Sağlandı' : assignmentPerf && assignmentPerf.averageScore !== null ? 'Baraj Altı' : 'Bekliyor'}
                </span>
              </div>
              <h3 className="font-bold text-xs text-slate-900">2. Ödev Ortalaması</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">En az 70/100 puan başarı</p>
              
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-600">
                  {assignmentPerf && assignmentPerf.evaluatedAssignmentsCount > 0
                    ? `${assignmentPerf.evaluatedAssignmentsCount} teslim notlandı`
                    : 'Not bulunmuyor'}
                </span>
                <strong className={`tabular-nums ${step2Passed ? 'text-emerald-700' : 'text-slate-800'}`}>
                  {assignmentPerf && assignmentPerf.averageScore !== null
                    ? `${assignmentPerf.averageScore} / 100`
                    : '0 / 100'}
                </strong>
              </div>
            </div>

            {/* Step 3: Zorunlu Ödev Onayları */}
            <div
              className={`relative p-4 rounded-xl border transition-all ${
                step3Passed
                  ? 'bg-emerald-50/60 border-emerald-200 ring-1 ring-emerald-300/40'
                  : assignmentPerf && assignmentPerf.mandatoryAssignmentsTotal > 0
                  ? 'bg-amber-50/60 border-amber-200 ring-1 ring-amber-300/40'
                  : 'bg-slate-50/70 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    step3Passed
                      ? 'bg-emerald-600 text-white'
                      : assignmentPerf && assignmentPerf.mandatoryAssignmentsTotal > 0
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {step3Passed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '3'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    step3Passed
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : assignmentPerf && assignmentPerf.mandatoryAssignmentsTotal > 0
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {step3Passed ? 'Eksiksiz' : assignmentPerf && assignmentPerf.mandatoryAssignmentsTotal > 0 ? 'Onay Bekliyor' : 'Tanımsız'}
                </span>
              </div>
              <h3 className="font-bold text-xs text-slate-900">3. Zorunlu Ödevler</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Tüm zorunlu teslim onayı</p>
              
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-600">
                  {assignmentPerf && assignmentPerf.mandatoryAssignmentsTotal > 0
                    ? `${assignmentPerf.mandatoryAssignmentsApproved} onay / ${assignmentPerf.mandatoryAssignmentsTotal} toplam`
                    : 'Zorunlu ödev yok'}
                </span>
                <strong className={`tabular-nums ${step3Passed ? 'text-emerald-700' : 'text-slate-800'}`}>
                  {assignmentPerf && assignmentPerf.mandatoryAssignmentsTotal > 0
                    ? `${assignmentPerf.mandatoryAssignmentsApproved}/${assignmentPerf.mandatoryAssignmentsTotal}`
                    : '0/0'}
                </strong>
              </div>
            </div>

            {/* Step 4: Oda Yönetim Kurulu Onayı */}
            <div
              className={`relative p-4 rounded-xl border transition-all ${
                step4Passed
                  ? 'bg-emerald-50/60 border-emerald-200 ring-1 ring-emerald-300/40'
                  : finalEligibility?.finalStatus === 'awaiting_admin_decision'
                  ? 'bg-blue-50/60 border-blue-200 ring-1 ring-blue-300/40'
                  : 'bg-slate-50/70 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    step4Passed
                      ? 'bg-emerald-600 text-white'
                      : finalEligibility?.finalStatus === 'awaiting_admin_decision'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {step4Passed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '4'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    step4Passed
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : finalEligibility?.finalStatus === 'awaiting_admin_decision'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {step4Passed ? 'Tescil Edildi' : finalEligibility?.finalStatus === 'awaiting_admin_decision' ? 'Kurulda' : 'Sırada'}
                </span>
              </div>
              <h3 className="font-bold text-xs text-slate-900">4. Yönetim Kurulu Onayı</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Resmî sicil ve tescil kararı</p>
              
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-600">Oda Sicili</span>
                <strong className={`text-xs ${step4Passed ? 'text-emerald-700 font-bold' : 'text-slate-700 font-medium'}`}>
                  {step4Passed ? 'Onaylandı ✓' : finalEligibility?.finalStatus === 'awaiting_admin_decision' ? 'Onay Bekliyor' : 'Ön Koşul Aşamasında'}
                </strong>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3. DÜZENLENMİŞ RESMÎ BELGELER (PRESTİJ DİJİTAL BERAT KARTLARI) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span>Resmî Belgelerim & Karekod Doğrulama Kütüğü</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {traineeCertificates.length} Adet Tescilli
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Aşağıdaki başarı belgeleri İslahiye Ticaret Odası kütüğüne tescil edilmiş olup karekod ve güvenlik koduyla 7/24 teyit edilebilir.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Fingerprint className="w-4 h-4 text-emerald-600" />
            <span>Kriptografik Kütük Güvencesi</span>
          </div>
        </div>

        {traineeCertificates.length === 0 ? (
          /* Henüz Belge Olmadığında: Prestij Taslak Önizleme Kartı */
          <div className="bg-gradient-to-b from-white to-slate-50/70 rounded-2xl border-2 border-dashed border-slate-200 p-8 sm:p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto shadow-inner border border-amber-200">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h3 className="text-base font-bold text-slate-900">
                {finalEligibility?.finalStatus === 'admin_approved'
                  ? 'Yönetim Kurulu Onayınız Verildi — Resmî Belgeniz Düzenleniyor'
                  : 'Henüz Düzenlenmiş Resmî Bir Belgeniz Bulunmuyor'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                4 başarı kriteri tamamlandığında ve Oda Yönetim Kurulu tescil kararı aldığında adınıza özel karekodlu resmî katılım belgesi otomatik olarak bu masada üretilecek ve e-Devlet uyumlu kütüğe işlenecektir.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/kursiyer/belge-dogrula')}
                className="h-9 px-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-slate-500" />
                <span>Örnek Doğrulama Masasını Gör</span>
              </button>
            </div>
          </div>
        ) : (
          /* Tescilli Belgeler Varsa: Lüks Editoryal Berat Kartı (Credly / Coursera Standardı) */
          <div className="space-y-4">
            {traineeCertificates.map((cert) => {
              const disc = checkCertificateAcademicDiscrepancy(cert);
              const isCancelled = cert.status === 'cancelled';
              const isSuperseded = cert.status === 'superseded';
              const isUnderReview = cert.status === 'under_review' || disc.hasDiscrepancy;
              const qrSvgString = generateQRSVG(getAppVerificationUrl(cert.verificationCode), 84);

              return (
                <div
                  key={cert.id}
                  className={`relative rounded-2xl border transition-all overflow-hidden ${
                    isCancelled
                      ? 'bg-rose-50/30 border-rose-200'
                      : isUnderReview
                      ? 'bg-amber-50/30 border-amber-200'
                      : 'bg-white border-slate-200/90 shadow-xs hover:shadow-md'
                  }`}
                >
                  {/* Top Subtle Amber/Navy Security Strip */}
                  <div className="h-1.5 bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-600" />

                  <div className="p-5 sm:p-7 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
                    
                    {/* Sol Bölüm: Berat Anteti, Rozet ve Program Detayı */}
                    <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                      
                      {/* Altın Mühür Rozeti */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300/80 text-amber-900 flex flex-col items-center justify-center shrink-0 shadow-inner">
                        <Award className="w-7 h-7 sm:w-8 sm:h-8" />
                        <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">İTO</span>
                      </div>

                      {/* Başlık ve Metin Bilgileri */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                            {cert.certificateNumber}
                          </span>
                          <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                            {cert.certificateTypeLabel}
                          </span>
                          {isCancelled ? (
                            <span className="text-xs font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-lg">
                              İptal Edildi
                            </span>
                          ) : isSuperseded ? (
                            <span className="text-xs font-semibold text-blue-800 bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded-lg">
                              Yeni Belge Düzenlendi
                            </span>
                          ) : isUnderReview ? (
                            <span className="text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-lg">
                              Yeniden İncelemede
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Resmî Kütükte Geçerli</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate" title={cert.programTitle}>
                            {cert.programTitle}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {cert.cohortName || '2026 Eğitim Dönemi'} • {cert.groupName || 'Aktif Şube'}
                          </p>
                        </div>

                        {/* Düzenleme Künyesi */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Tescil: <strong>{new Date(cert.issuedAt).toLocaleDateString('tr-TR')}</strong></span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Makam: <strong>{cert.issuedBy}</strong></span>
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-700 flex items-center gap-1">
                            <span>Kod:</span>
                            <strong className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {cert.verificationCode}
                            </strong>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(cert.verificationCode)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                              title="Kodu Kopyala"
                            >
                              {copiedCode === cert.verificationCode ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Orta Bölüm: Canlı Karekod Rozeti (Mikro QR Önizleme) */}
                    <div className="hidden xl:flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                      <div
                        className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: qrSvgString }}
                      />
                      <div className="text-[11px] text-slate-500 leading-tight space-y-1 max-w-[130px]">
                        <strong className="block text-slate-800 font-semibold">Doğrulama Karekodu</strong>
                        <span>Akıllı telefonla okutulduğunda anında kütükten teyit edilir.</span>
                      </div>
                    </div>

                    {/* Sağ Bölüm: Kurumsal Aksiyon Butonları (40px/44px) */}
                    <div className="flex flex-wrap lg:flex-col items-center justify-end gap-2 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => downloadCertificatePDF(cert)}
                        className="h-9 px-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Resmî PDF İndir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewCert(cert)}
                        className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition cursor-pointer"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Önizle & Yazdır</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/kursiyer/belge-dogrula/${cert.verificationCode}`)}
                        className="h-8 px-3 inline-flex items-center justify-center gap-1.5 text-blue-700 hover:text-blue-800 text-xs font-semibold transition cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Kütükten Doğrula →</span>
                      </button>
                    </div>

                  </div>

                  {/* İptal gerekçesi uyarısı */}
                  {isCancelled && cert.cancellationReason && (
                    <div className="px-6 py-3 bg-rose-100/70 border-t border-rose-200 text-xs text-rose-900 font-medium">
                      <strong>İptal Gerekçesi:</strong> {cert.cancellationReason}
                    </div>
                  )}

                  {/* Akademik uyumsuzluk uyarısı */}
                  {isUnderReview && (
                    <div className="px-6 py-3 bg-amber-100/70 border-t border-amber-200 text-xs text-amber-950 font-medium">
                      <strong>Uyarı:</strong> Not veya devam verilerinizde yapılan son güncelleme sebebiyle belgeniz idari yeniden incelemeye alınmıştır.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Resmî Belge Güvenlik ve Kütük Kılavuz Kartı */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Karekod ve Güvenlik Kodu Doğrulaması</span>
          </h4>
          <p className="leading-relaxed">
            Belgenizin sağ alt köşesindeki karekod veya "İE-2026-..." formatındaki tescil kodu, işverenler ve kamu kurumları tarafından İslahiye Ticaret Odası Belge Doğrulama Masası'ndan 7/24 ücretsiz olarak sorgulanabilir.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Meclis & Yönetim Kurulu Kütük Kaydı</span>
          </h4>
          <p className="leading-relaxed">
            Mezuniyet ve katılım belgeleri, eğitim koordinatörlüğü ve yetkili oda yönetimi tarafından onaylandığı anda tekil sicil numarasıyla dijital kütüğe kaydedilir ve içeriğin değiştirilemezliği garanti altına alınır.
          </p>
        </div>
      </div>

      {/* 5. Belge Önizleme ve Yazdırma Modalı */}
      {previewCert && (
        <CertificatePreviewModal
          certificate={previewCert}
          onClose={() => setPreviewCert(null)}
        />
      )}
    </div>
  );
};
