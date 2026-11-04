using System.Text;

namespace Education.Api.Services;

public static class CertificatePdfGenerator
{
    public static byte[] GenerateA4Landscape(
        string studentName,
        string programName,
        string termName,
        string certificateNumber,
        string verificationCode,
        DateOnly issueDate)
    {
        // A4 Landscape: 842 x 595 points
        var sb = new StringBuilder();

        // Background decorative border
        sb.AppendLine("q");
        // Outer dark green / navy border
        sb.AppendLine("0.12 0.23 0.19 rg"); // #1F3B31
        sb.AppendLine("20 20 802 555 re f");
        // Inner white canvas
        sb.AppendLine("1.0 1.0 1.0 rg");
        sb.AppendLine("24 24 794 547 re f");
        // Inner gold border
        sb.AppendLine("0.73 0.52 0.37 RG"); // #BA855E
        sb.AppendLine("2.5 w");
        sb.AppendLine("32 32 778 531 re S");
        sb.AppendLine("0.5 w");
        sb.AppendLine("36 36 770 523 re S");
        sb.AppendLine("Q");

        // Typography
        // Header
        sb.AppendLine("BT");
        sb.AppendLine("/F2 16 Tf");
        sb.AppendLine("0.12 0.23 0.19 rg");
        sb.AppendLine("230 515 Td");
        sb.AppendLine("(T.C. ISLAHIYE BELEDIYESI VE TICARET ODASI) Tj");
        sb.AppendLine("ET");

        sb.AppendLine("BT");
        sb.AppendLine("/F1 11 Tf");
        sb.AppendLine("0.45 0.45 0.45 rg");
        sb.AppendLine("300 495 Td");
        sb.AppendLine("(MESLEKI EGITIM VE GELISTIRME AKADEMISI) Tj");
        sb.AppendLine("ET");

        // Title
        sb.AppendLine("BT");
        sb.AppendLine("/F2 26 Tf");
        sb.AppendLine("0.73 0.52 0.37 rg");
        sb.AppendLine("270 445 Td");
        sb.AppendLine("(BASARI BELGESI) Tj");
        sb.AppendLine("ET");

        sb.AppendLine("BT");
        sb.AppendLine("/F1 12 Tf");
        sb.AppendLine("0.35 0.35 0.35 rg");
        sb.AppendLine("320 425 Td");
        sb.AppendLine("(CERTIFICATE OF COMPLETION) Tj");
        sb.AppendLine("ET");

        // Body text
        sb.AppendLine("BT");
        sb.AppendLine("/F1 13 Tf");
        sb.AppendLine("0.25 0.25 0.25 rg");
        sb.AppendLine("180 375 Td");
        sb.AppendLine("(Islahiye Dijital Egitim Platformu kapsaminda basariyla tamamlanan egitim anisina;) Tj");
        sb.AppendLine("ET");

        // Student Name
        var safeName = EscapePdfText(studentName.ToUpperInvariant());
        sb.AppendLine("BT");
        sb.AppendLine("/F2 24 Tf");
        sb.AppendLine("0.12 0.23 0.19 rg");
        sb.AppendLine("220 325 Td");
        sb.AppendLine($"({safeName}) Tj");
        sb.AppendLine("ET");

        // Line under name
        sb.AppendLine("q");
        sb.AppendLine("0.73 0.52 0.37 RG");
        sb.AppendLine("1.5 w");
        sb.AppendLine("180 315 m 660 315 l S");
        sb.AppendLine("Q");

        // Program Name
        var safeProgram = EscapePdfText(programName);
        var safeTerm = EscapePdfText(termName);
        sb.AppendLine("BT");
        sb.AppendLine("/F2 15 Tf");
        sb.AppendLine("0.15 0.15 0.15 rg");
        sb.AppendLine("180 275 Td");
        sb.AppendLine($"({safeProgram}) Tj");
        sb.AppendLine("ET");

        sb.AppendLine("BT");
        sb.AppendLine("/F1 12 Tf");
        sb.AppendLine("0.40 0.40 0.40 rg");
        sb.AppendLine("180 255 Td");
        sb.AppendLine($"({safeTerm} - Egitim ve Uygulama Programi) Tj");
        sb.AppendLine("ET");

        sb.AppendLine("BT");
        sb.AppendLine("/F1 11 Tf");
        sb.AppendLine("0.30 0.30 0.30 rg");
        sb.AppendLine("180 220 Td");
        sb.AppendLine("(Bu belge, yukarida adi gecen katilimcinin egitim programini asgari %80 devam) Tj");
        sb.AppendLine("0 -16 Td");
        sb.AppendLine("(ve en az 70 basari puaniyla tamamladigini resmi olarak teyit eder.) Tj");
        sb.AppendLine("ET");

        // Footer details
        // Left: Certificate metadata
        sb.AppendLine("BT");
        sb.AppendLine("/F2 9 Tf");
        sb.AppendLine("0.20 0.20 0.20 rg");
        sb.AppendLine("60 130 Td");
        sb.AppendLine($"(Belge No: {certificateNumber}) Tj");
        sb.AppendLine("0 -14 Td");
        sb.AppendLine($"(Dogrulama Kodu: {verificationCode}) Tj");
        sb.AppendLine("0 -14 Td");
        sb.AppendLine($"(Duzenleme Tarihi: {issueDate:dd.MM.yyyy}) Tj");
        sb.AppendLine("0 -14 Td");
        sb.AppendLine("(Durum: Resmi Kütükte Kayitli ve Gecerli) Tj");
        sb.AppendLine("ET");

        // QR simulation box & label
        sb.AppendLine("q");
        sb.AppendLine("0.94 0.94 0.94 rg");
        sb.AppendLine("680 70 80 80 re f");
        sb.AppendLine("0.73 0.52 0.37 RG");
        sb.AppendLine("1 w");
        sb.AppendLine("680 70 80 80 re S");
        // Inner mini squares to simulate QR code visual
        sb.AppendLine("0.12 0.23 0.19 rg");
        sb.AppendLine("688 122 18 18 re f");
        sb.AppendLine("734 122 18 18 re f");
        sb.AppendLine("688 78 18 18 re f");
        sb.AppendLine("712 100 16 16 re f");
        sb.AppendLine("Q");

        sb.AppendLine("BT");
        sb.AppendLine("/F1 8 Tf");
        sb.AppendLine("0.35 0.35 0.35 rg");
        sb.AppendLine("660 55 Td");
        sb.AppendLine("(QR Belge Dogrulama) Tj");
        sb.AppendLine("ET");

        // Signatures
        sb.AppendLine("BT");
        sb.AppendLine("/F2 11 Tf");
        sb.AppendLine("0.20 0.20 0.20 rg");
        sb.AppendLine("240 95 Td");
        sb.AppendLine("(Mehmet Yilmaz) Tj");
        sb.AppendLine("0 -14 Td");
        sb.AppendLine("/F1 9 Tf");
        sb.AppendLine("(Egitim Koordinatörü) Tj");
        sb.AppendLine("ET");

        sb.AppendLine("BT");
        sb.AppendLine("/F2 11 Tf");
        sb.AppendLine("0.20 0.20 0.20 rg");
        sb.AppendLine("460 95 Td");
        sb.AppendLine("(Islahiye Belediyesi) Tj");
        sb.AppendLine("0 -14 Td");
        sb.AppendLine("/F1 9 Tf");
        sb.AppendLine("(Yonetim Kurulu Onayi) Tj");
        sb.AppendLine("ET");

        var contentStream = sb.ToString();
        var contentBytes = Encoding.ASCII.GetBytes(contentStream);

        // Build PDF objects
        var pdf = new MemoryStream();
        var offsets = new List<long>();

        void Write(string s) => pdf.Write(Encoding.ASCII.GetBytes(s));

        Write("%PDF-1.4\n");

        // Obj 1: Catalog
        offsets.Add(pdf.Position);
        Write("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

        // Obj 2: Pages
        offsets.Add(pdf.Position);
        Write("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

        // Obj 3: Page (MediaBox: 842 x 595 - A4 Landscape)
        offsets.Add(pdf.Position);
        Write("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n");

        // Obj 4: Contents
        offsets.Add(pdf.Position);
        Write($"4 0 obj\n<< /Length {contentBytes.Length} >>\nstream\n");
        pdf.Write(contentBytes, 0, contentBytes.Length);
        Write("\nendstream\nendobj\n");

        // Obj 5: Font F1 (Helvetica)
        offsets.Add(pdf.Position);
        Write("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n");

        // Obj 6: Font F2 (Helvetica-Bold)
        offsets.Add(pdf.Position);
        Write("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n");

        // XRef
        var startXref = pdf.Position;
        Write($"xref\n0 {offsets.Count + 1}\n");
        Write("0000000000 65535 f \n");
        foreach (var offset in offsets)
        {
            Write($"{offset:D10} 00000 n \n");
        }

        Write($"trailer\n<< /Size {offsets.Count + 1} /Root 1 0 R >>\n");
        Write($"startxref\n{startXref}\n%%EOF\n");

        return pdf.ToArray();
    }

    private static string EscapePdfText(string text)
    {
        // Replace Turkish special characters with ASCII equivalents for standard Type1 PDF fonts
        var normalized = text
            .Replace("ı", "i").Replace("İ", "I")
            .Replace("ş", "s").Replace("Ş", "S")
            .Replace("ğ", "g").Replace("Ğ", "G")
            .Replace("ü", "u").Replace("Ü", "U")
            .Replace("ö", "o").Replace("Ö", "O")
            .Replace("ç", "c").Replace("Ç", "C")
            .Replace("(", "\\(").Replace(")", "\\)");
        return normalized;
    }
}
