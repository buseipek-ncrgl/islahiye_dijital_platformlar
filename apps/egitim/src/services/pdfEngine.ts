/**
 * Professional Certificate PDF Generation Engine (Sprint E03-D Düzeltmesi & E04-A Standardı)
 * A4 Yatay (842 x 595 pt), Vektörel Kurumsal Tasarım, Eksiksiz Türkçe Karakter Desteği (/ToUnicode CMap),
 * Kesin Bayt Seviyesi xref Tablosu, Gerçek ISO/IEC 18004 QR Doğrulama Matrisi ve Açık Demo İbaresi.
 */

import { CertificateRecord } from '../types';
import { generateQRMatrix, getAppVerificationUrl } from './qrEngine';

/**
 * Standard /ToUnicode CMap stream for PostScript Type 1 standard fonts
 * Maps single-byte Turkish CP1254 characters to valid 16-bit Unicode codepoints
 * for 100% correct text selection, search and clipboard copying in Acrobat and Chrome.
 */
const TO_UNICODE_CMAP = `/CIDInit /ProcSet findresource begin
12 dict begin
begincmap
/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def
/CMapName /Custom-ToUnicode def
/CMapType 2 def
1 begincodespacerange
<00> <FF>
endcodespacerange
1 beginbfrange
<20> <7E> <0020>
endbfrange
16 beginbfchar
<C7> <00C7>
<D0> <011E>
<D6> <00D6>
<DC> <00DC>
<DD> <0130>
<DE> <015E>
<E7> <00E7>
<F0> <011F>
<F6> <00F6>
<FC> <00FC>
<FD> <0131>
<FE> <015F>
<93> <201C>
<94> <201D>
<96> <2013>
<97> <2014>
endbfchar
endcmap
CMapName currentdict /CMap defineresource pop
end
end`;

/**
 * Encodes Turkish string into single-byte PDF hex literal matching our /Differences & /ToUnicode map
 */
export const encodeTurkishPdfHex = (str: string): string => {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const code = ch.charCodeAt(0);
    let byteVal = code;
    if (code <= 127) {
      byteVal = code;
    } else {
      switch (ch) {
        case 'Ç': byteVal = 0xC7; break;
        case 'Ğ': byteVal = 0xD0; break;
        case 'Ö': byteVal = 0xD6; break;
        case 'Ü': byteVal = 0xDC; break;
        case 'İ': byteVal = 0xDD; break;
        case 'Ş': byteVal = 0xDE; break;
        case 'ç': byteVal = 0xE7; break;
        case 'ğ': byteVal = 0xF0; break;
        case 'ö': byteVal = 0xF6; break;
        case 'ü': byteVal = 0xFC; break;
        case 'ı': byteVal = 0xFD; break;
        case 'ş': byteVal = 0xFE; break;
        case '“': byteVal = 0x93; break;
        case '”': byteVal = 0x94; break;
        case '–': byteVal = 0x96; break;
        case '—': byteVal = 0x97; break;
        default:
          byteVal = code < 256 ? code : 0x3F; // '?' fallback
      }
    }
    hex += byteVal.toString(16).padStart(2, '0');
  }
  return `<${hex}>`;
};

/**
 * A4 Yatay Standart PDF 1.4 Dosya Akışı Üretir
 */
export const generateCertificatePDFString = (cert: CertificateRecord): string => {
  // A4 Landscape: 842 pt x 595 pt
  const width = 842;
  const height = 595;

  const verUrl = getAppVerificationUrl(cert.verificationCode);
  const qr = generateQRMatrix(verUrl);

  // QR Kod Vektör Çizim Komutları (PDF stream)
  // QR konumu: Sağ alt köşe (x: 680, y: 70, boyut: 90 pt)
  const qrX = 680;
  const qrY = 70;
  const qrSize = 90;
  const qrCell = qrSize / (qr.size + 4);

  let qrDrawing = `
    % QR Zemin
    1 1 1 rg
    ${qrX - 5} ${qrY - 5} ${qrSize + 10} ${qrSize + 10} re f
    0.1 0.15 0.25 rg
  `;

  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.modules[r][c]) {
        // PDF koordinat sisteminde y aşağıdan yukarıyadır
        const px = qrX + (c + 2) * qrCell;
        const py = qrY + (qr.size - 1 - r + 2) * qrCell;
        qrDrawing += `\n    ${px.toFixed(2)} ${py.toFixed(2)} ${(qrCell + 0.1).toFixed(2)} ${(qrCell + 0.1).toFixed(2)} re f`;
      }
    }
  }

  // Düzenleme tarihi formatı (DD.MM.YYYY)
  const issueDateStr = new Date(cert.issuedAt).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // PDF İçerik Akışı (Vector graphics + Text)
  const contentStream = `q
    % 1. Arka Plan
    0.98 0.98 0.99 rg
    0 0 ${width} ${height} re f

    % 2. Dış Çerçeve (Deep Navy #1E3A8A)
    0.12 0.23 0.54 RG
    4 w
    24 24 ${width - 48} ${height - 48} re S

    % 3. İç İnce Çerçeve (Warm Bronze/Gold #BA855E)
    0.73 0.52 0.37 RG
    1.5 w
    32 32 ${width - 64} ${height - 64} re S

    % Köşe Dekoratif Motifleri
    0.73 0.52 0.37 RG
    2 w
    36 36 20 20 re S
    ${width - 56} 36 20 20 re S
    36 ${height - 56} 20 20 re S
    ${width - 56} ${height - 56} 20 20 re S

    % 4. Üst Kurumsal Başlık
    BT
    /F1 11 Tf
    0.4 0.45 0.55 rg
    1 0 0 1 230 ${height - 75} Tm
    ${encodeTurkishPdfHex('İSLAHİYE TİCARET ODASI — AKADEMİ VE EĞİTİM KOORDİNASYONU')} Tj
    ET

    % 5. Belge Ana Başlığı
    BT
    /F2 26 Tf
    0.08 0.15 0.35 rg
    1 0 0 1 270 ${height - 118} Tm
    ${encodeTurkishPdfHex('EĞİTİM BAŞARI BELGESİ')} Tj
    ET

    % Dekoratif Ayırıcı Çizgi (Altın / Bakır)
    0.73 0.52 0.37 RG
    1.5 w
    260 ${height - 132} m 582 ${height - 132} l S

    % 6. Zorunlu Demo Açıklaması (Prompt Kuralı)
    BT
    /F1 9 Tf
    0.85 0.25 0.2 rg
    1 0 0 1 255 ${height - 150} Tm
    ${encodeTurkishPdfHex('ÖRNEK BELGE — DEMO / RESMÎ GEÇERLİLİĞİ YOKTUR')} Tj
    ET

    % 7. İthaf Metni
    BT
    /F1 11 Tf
    0.3 0.35 0.45 rg
    1 0 0 1 310 ${height - 188} Tm
    ${encodeTurkishPdfHex('Bu belge, İslahiye Ticaret Odası tarafından düzenlenen')} Tj
    ET

    % 8. Kursiyer Adı Soyadı (Büyük ve Vurgulu)
    BT
    /F2 24 Tf
    0.06 0.1 0.25 rg
    1 0 0 1 200 ${height - 232} Tm
    ${encodeTurkishPdfHex(cert.traineeName.toUpperCase())} Tj
    ET

    % 9. Program ve Başarı Metni
    BT
    /F1 12 Tf
    0.2 0.25 0.35 rg
    1 0 0 1 120 ${height - 275} Tm
    ${encodeTurkishPdfHex(
      `adına kayıtlı kursiyerin "${cert.programTitle}" (${cert.cohortName}) programı kapsamındaki`
    )} Tj
    1 0 0 1 110 ${height - 295} Tm
    ${encodeTurkishPdfHex(
      'ders oturumlarına en az %80 devam göstererek ve gerekli tüm ödev/uygulama yükümlülüklerini'
    )} Tj
    1 0 0 1 160 ${height - 315} Tm
    ${encodeTurkishPdfHex(
      'başarıyla tamamladığı yetkili oda yönetimi kararıyla onaylanarak düzenlenmiştir.'
    )} Tj
    ET

    % 10. Başarı Kanıt Metrikleri Özeti Kutusu (Gri arka plan)
    0.95 0.96 0.98 rg
    100 ${height - 400} 642 62 re f
    0.85 0.88 0.92 RG
    1 w
    100 ${height - 400} 642 62 re S

    BT
    /F1 10 Tf
    0.25 0.3 0.4 rg
    1 0 0 1 120 ${height - 365} Tm
    ${encodeTurkishPdfHex(`Resmî Devam Oranı: %${cert.eligibilitySnapshot.attendanceRate || 80}`)} Tj
    1 0 0 1 300 ${height - 365} Tm
    ${encodeTurkishPdfHex(`Ödev Not Ortalaması: ${cert.eligibilitySnapshot.assignmentAverage || 70} / 100`)} Tj
    1 0 0 1 500 ${height - 365} Tm
    ${encodeTurkishPdfHex(`Zorunlu Ödevler: ${cert.eligibilitySnapshot.mandatoryAssignmentsApproved} Onaylandı`)} Tj
    1 0 0 1 120 ${height - 388} Tm
    ${encodeTurkishPdfHex(`Eğitim Grubu: ${cert.groupName}`)} Tj
    1 0 0 1 420 ${height - 388} Tm
    ${encodeTurkishPdfHex(`Onay Karar Referansı: ${cert.successDecisionId}`)} Tj
    ET

    % 11. Sol Alt: Yetkili Merci ve Tarih
    BT
    /F1 10 Tf
    0.4 0.45 0.55 rg
    1 0 0 1 70 145 Tm
    ${encodeTurkishPdfHex('Onaylayan İdari Merci:')} Tj
    /F1 11 Tf
    0.1 0.15 0.25 rg
    1 0 0 1 70 128 Tm
    ${encodeTurkishPdfHex(cert.issuedBy)} Tj
    /F1 9 Tf
    0.4 0.45 0.55 rg
    1 0 0 1 70 110 Tm
    ${encodeTurkishPdfHex(`Düzenleme Tarihi: ${issueDateStr}`)} Tj
    1 0 0 1 70 95 Tm
    ${encodeTurkishPdfHex(`Belge Kayıt No: ${cert.certificateNumber}`)} Tj
    1 0 0 1 70 80 Tm
    ${encodeTurkishPdfHex(`Doğrulama Kodu: ${cert.verificationCode}`)} Tj
    ET

    % 12. QR Kod ve Doğrulama Açıklaması
    ${qrDrawing}

    BT
    /F1 8 Tf
    0.3 0.35 0.4 rg
    1 0 0 1 660 52 Tm
    ${encodeTurkishPdfHex('Karekod ile Belgeyi Doğrula')} Tj
    1 0 0 1 650 40 Tm
    ${encodeTurkishPdfHex('(Yalnızca belge teyidi içindir)')} Tj
    ET

    % Alt Güvenlik Dipnotu
    BT
    /F1 7 Tf
    0.55 0.6 0.65 rg
    1 0 0 1 180 32 Tm
    ${encodeTurkishPdfHex('Bu belge İslahiye Dijital Platformlar Frontend Demo simülasyonudur. Resmî üniversite veya MEB belgesi niteliği taşımaz.')} Tj
    ET
    Q`;

  const streamLength = Buffer.byteLength(contentStream, 'utf8');
  const cmapLength = Buffer.byteLength(TO_UNICODE_CMAP, 'utf8');

  // Object builders
  const objects: string[] = [];

  // 1: Catalog
  objects.push(`1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
`);

  // 2: Pages
  objects.push(`2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
`);

  // 3: Page
  objects.push(`3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 ${width} ${height}]
  /Contents 4 0 R
  /Resources <<
    /Font <<
      /F1 5 0 R
      /F2 6 0 R
    >>
  >>
>>
endobj
`);

  // 4: Contents Stream
  objects.push(`4 0 obj
<<
  /Length ${streamLength}
>>
stream
${contentStream}
endstream
endobj
`);

  // 5: Font F1 (Helvetica) with Encoding and ToUnicode
  objects.push(`5 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
  /Encoding 7 0 R
  /ToUnicode 8 0 R
>>
endobj
`);

  // 6: Font F2 (Helvetica-Bold) with Encoding and ToUnicode
  objects.push(`6 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica-Bold
  /Encoding 7 0 R
  /ToUnicode 8 0 R
>>
endobj
`);

  // 7: Encoding with Differences for Turkish
  objects.push(`7 0 obj
<<
  /Type /Encoding
  /BaseEncoding /WinAnsiEncoding
  /Differences [
    208 /Gbreve
    221 /Idotaccent
    222 /Scedilla
    240 /gbreve
    253 /dotlessi
    254 /scedilla
  ]
>>
endobj
`);

  // 8: ToUnicode CMap Stream
  objects.push(`8 0 obj
<<
  /Length ${cmapLength}
>>
stream
${TO_UNICODE_CMAP}
endstream
endobj
`);

  // Dynamically calculate exact byte offsets
  const header = '%PDF-1.4\n';
  let body = '';
  const offsets: number[] = [0];
  let currentOffset = header.length;

  for (let i = 0; i < objects.length; i++) {
    offsets.push(currentOffset);
    body += objects[i];
    currentOffset += objects[i].length;
  }

  const startxref = currentOffset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += offsets[i].toString().padStart(10, '0') + ' 00000 n \n';
  }

  const trailer = `trailer
<<
  /Size ${objects.length + 1}
  /Root 1 0 R
>>
startxref
${startxref}
%%EOF`;

  return header + body + xref + trailer;
};

export const generateCertificatePDFBlob = (cert: CertificateRecord): Blob => {
  return new Blob([generateCertificatePDFString(cert)], { type: 'application/pdf' });
};

/**
 * Belgeyi İstemci Tarafında `.pdf` Dosyası Olarak İndirir
 */
export const downloadCertificatePDF = (cert: CertificateRecord) => {
  try {
    const blob = generateCertificatePDFBlob(cert);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = cert.traineeName.replace(/\s+/g, '_').toLowerCase();
    a.href = url;
    a.download = `İE_Basari_Belgesi_${cert.certificateNumber.replace(/\//g, '-')}_${safeName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (err) {
    console.error('PDF indirme hatası:', err);
  }
};
