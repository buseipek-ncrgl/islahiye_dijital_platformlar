import React, { useMemo } from 'react';
import { X, Download, Printer, QrCode, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';
import { CertificateRecord } from '../../types';
import { Button } from '../ui/Button';
import { downloadCertificatePDF } from '../../services/pdfEngine';
import { generateQRSVG, getAppVerificationUrl } from '../../services/qrEngine';

interface CertificatePreviewModalProps {
  certificate: CertificateRecord | null;
  onClose: () => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  certificate,
  onClose,
}) => {
  if (!certificate) return null;

  const verUrl = getAppVerificationUrl(certificate.verificationCode);
  const qrSvg = useMemo(() => generateQRSVG(verUrl, 110), [verUrl]);

  const issueDateStr = new Date(certificate.issuedAt).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    downloadCertificatePDF(certificate);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Toolbar Header */}
        <div className="bg-brand-navy p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Resmî Belge Önizleme Masası</h3>
              <p className="text-[11px] text-blue-200">
                {certificate.certificateNumber} • {certificate.traineeName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
              className="text-xs border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
            >
              Yazdır
            </Button>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownload}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              PDF İndir
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Preview Area */}
        <div className="p-4 sm:p-8 bg-slate-100 flex justify-center overflow-x-auto">
          {/* A4 Landscape Ratio Container (1.414 ratio: 842 x 595 pt) */}
          <div
            id="printable-certificate"
            className="w-full max-w-[800px] aspect-[1.414/1] bg-white rounded-xl shadow-md border-8 border-brand-navy p-6 sm:p-10 relative flex flex-col justify-between select-none text-slate-900"
            style={{ minHeight: '520px' }}
          >
            {/* Altın / Bakır İnce İç Kenarlık */}
            <div className="absolute inset-2 border-2 border-[#BA855E]/60 pointer-events-none rounded-lg" />
            
            {/* Köşe Motifleri */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#BA855E]" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#BA855E]" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#BA855E]" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#BA855E]" />

            {/* ÜST BÖLÜM: Kurumsal Başlık ve Açık Demo İbaresi */}
            <div className="text-center space-y-1 relative z-10 pt-2">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 font-bold block">
                İSLAHİYE TİCARET ODASI — AKADEMİ VE EĞİTİM KOORDİNASYONU
              </span>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-brand-navy font-serif">
                {certificate.certificateTypeLabel.toUpperCase()}
              </h1>
              
              {/* Vurgulu Bakır Ayırıcı */}
              <div className="w-32 h-0.5 bg-[#BA855E] mx-auto my-1" />

              {/* Zorunlu Açık Demo İbaresi */}
              <div className="inline-block px-3 py-0.5 bg-red-50 border border-red-200 rounded text-[9px] sm:text-[10px] font-bold text-red-700 uppercase tracking-wider">
                ÖRNEK BELGE — DEMO / RESMÎ GEÇERLİLİĞİ YOKTUR
              </div>
            </div>

            {/* ORTA BÖLÜM: Kursiyer ve Başarı Takdiri Metni */}
            <div className="text-center my-auto space-y-3 relative z-10 px-4">
              <p className="text-xs text-slate-500 italic">
                Bu belge, İslahiye Ticaret Odası koordinasyonunda yürütülen eğitim sürecinde
              </p>

              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-normal font-serif border-b border-slate-200 pb-2 inline-block px-8">
                {certificate.traineeName}
              </div>

              <div className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed">
                adına kayıtlı kursiyerin <strong>"{certificate.programTitle}"</strong> ({certificate.cohortName})
                programı kapsamındaki ders oturumlarına en az <strong>%80</strong> devam göstererek ve
                gerekli tüm uygulama/ödev standartlarını başarıyla tamamladığı yetkili oda yönetimi tarafından onaylanarak tescil edilmiştir.
              </div>

              {/* Başarı Kanıt Rozeti */}
              <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-lg text-[11px] text-slate-600">
                <span>Devam Oranı: <strong className="text-emerald-700">%{certificate.eligibilitySnapshot.attendanceRate}</strong></span>
                <span>•</span>
                <span>Ödev Ortalaması: <strong className="text-blue-700">{certificate.eligibilitySnapshot.assignmentAverage} / 100</strong></span>
                <span>•</span>
                <span>Zorunlu Ödevler: <strong className="text-emerald-700">{certificate.eligibilitySnapshot.mandatoryAssignmentsApproved} Onaylı</strong></span>
              </div>
            </div>

            {/* ALT BÖLÜM: Yetkili Merci, Belge Numarası ve QR Doğrulama */}
            <div className="flex flex-col sm:flex-row items-end justify-between gap-4 pt-4 border-t border-slate-100 relative z-10">
              {/* Sol: Yetkili Merci & Kayıt Bilgisi */}
              <div className="text-left space-y-1 text-xs">
                <div className="text-slate-500 text-[11px]">Onaylayan İdari Merci:</div>
                <div className="font-bold text-slate-900 text-sm">{certificate.issuedBy}</div>
                <div className="text-[11px] text-slate-500">
                  Düzenleme Tarihi: <strong>{issueDateStr}</strong> • Belge No: <strong className="font-mono text-slate-800">{certificate.certificateNumber}</strong>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Doğrulama Kodu: {certificate.verificationCode}
                </div>
              </div>

              {/* Sağ: QR Doğrulama Alanı */}
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div
                  className="w-16 h-16 bg-white rounded border border-slate-200 flex items-center justify-center p-1"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
                <div className="text-left text-[10px] text-slate-500 space-y-0.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-slate-700" />
                    Belgeyi Doğrula
                  </div>
                  <p className="max-w-[120px] leading-tight text-[9px] text-slate-500">
                    Karekod yalnızca belge kimliğini doğrulamak içindir.
                  </p>
                  <a
                    href={verUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-mono text-[9px] inline-flex items-center gap-0.5"
                  >
                    Doğrula <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Alt Güvenlik Açıklaması */}
            <div className="text-center text-[9px] text-slate-400 pt-2 border-t border-slate-100 mt-2">
              Bu belge İslahiye Dijital Platformlar Eğitim Portalı bünyesinde demo amaçlı simüle edilmiştir. Resmî diploma veya mesleki akreditasyon niteliği taşımaz.
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              İndirilen PDF dosyasında tüm metinler, Türkçe karakterler (ğ, ü, ş, ı, ö, ç, İ) ve QR kod vektörel olarak saklanır.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={onClose}>
              Kapat
            </Button>
            <Button size="sm" variant="primary" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={handleDownload}>
              PDF Olarak İndir
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
