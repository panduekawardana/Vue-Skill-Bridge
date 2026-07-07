import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { certificates } from "../db/schema/certificates.js";
import { internships } from "../db/schema/internships.js";
import { students } from "../db/schema/students.js";
import { umkm } from "../db/schema/umkm.js";
import { users } from "../db/schema/users.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CERT_DIR = path.join(__dirname, "../../uploads/certificates");

if (!fs.existsSync(CERT_DIR)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });
}

// ─── PDF GENERATION ────────────────────────────────────────

export function generateCertificatePdf(record) {
  return new Promise((resolve, reject) => {
    const fileName = `${record.certificateNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    const filePath = path.join(CERT_DIR, fileName);

    const doc = new PDFDocument({
      layout: "landscape",
      size: "A4",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });

    const stream = fs.createWriteStream(filePath);

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);

    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Decorative border
    doc.rect(20, 20, pageWidth - 40, pageHeight - 40).lineWidth(3).strokeColor("#1a5e8c").stroke();
    doc.rect(25, 25, pageWidth - 50, pageHeight - 50).lineWidth(1).strokeColor("#3b82f6").stroke();

    // Top accent line
    doc.rect(40, 55, pageWidth - 80, 6).fillColor("#3b82f6").fill();

    // Header
    doc.fontSize(32).font("Helvetica-Bold").fillColor("#1a5e8c")
      .text("SERTIFIKAT KOMPETENSI", { align: "center" });

    doc.moveDown(0.5);
    doc.fontSize(14).font("Helvetica").fillColor("#6b7280")
      .text("Skill Bridge — Platform Magang Mikro SMK/UMKM", { align: "center" });

    // Separator
    doc.moveDown(1);
    doc.moveTo(pageWidth / 2 - 80, doc.y).lineTo(pageWidth / 2 + 80, doc.y).lineWidth(1).strokeColor("#d1d5db").stroke();
    doc.moveDown(1);

    // Body
    doc.fontSize(12).font("Helvetica").fillColor("#374151")
      .text("Diberikan kepada:", { align: "center" });

    doc.moveDown(0.3);
    doc.fontSize(24).font("Helvetica-Bold").fillColor("#1a5e8c")
      .text(record.studentName || "Peserta", { align: "center" });

    doc.moveDown(0.5);
    doc.fontSize(12).font("Helvetica").fillColor("#374151")
      .text(
        `dari ${record.studentSchool || "SMK"} — Jurusan ${record.studentMajor || "-"}`,
        { align: "center" },
      );

    doc.moveDown(0.8);
    doc.fontSize(11).font("Helvetica").fillColor("#6b7280")
      .text(
        `Telah menyelesaikan magang mikro di ${record.businessName || "Perusahaan"}`,
        { align: "center" },
      );

    doc.moveDown(0.3);
    doc.fontSize(11).font("Helvetica").fillColor("#6b7280")
      .text(
        `dengan durasi ${record.metadata?.duration || "14 hari"} dan mencapai kompetensi yang diharapkan.`,
        { align: "center" },
      );

    // Details
    doc.moveDown(2);
    const detailsY = doc.y;
    const leftX = pageWidth / 2 - 180;
    const rightX = pageWidth / 2 + 20;

    doc.fontSize(10).font("Helvetica").fillColor("#374151");

    doc.text(`No. Sertifikat:`, leftX, detailsY);
    doc.font("Helvetica-Bold").fillColor("#1a5e8c")
      .text(record.certificateNumber, leftX + 95, detailsY);

    doc.font("Helvetica").fillColor("#374151")
      .text(`Diterbitkan:`, rightX, detailsY);
    doc.font("Helvetica-Bold").fillColor("#1a5e8c")
      .text(
        record.issuedAt
          ? new Date(record.issuedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
          : "-",
        rightX + 78,
        detailsY,
      );

    // Bottom accent line
    const bottomY = pageHeight - 70;
    doc.rect(40, bottomY, pageWidth - 80, 6).fillColor("#3b82f6").fill();

    // Footer
    doc.fontSize(9).font("Helvetica").fillColor("#9ca3af")
      .text(
        "Sertifikat ini diterbitkan secara otomatis oleh Skill Bridge Platform.",
        { align: "center" },
      );

    doc.fontSize(8).fillColor("#d1d5db")
      .text(
        `Verifikasi: ${process.env.VERIFY_BASE_URL || "http://localhost:5000/api/certificates/verify"}/${record.certificateNumber}`,
        { align: "center" },
      );

    doc.end();
  });
}

// ─── PUBLIC VERIFICATION ───────────────────────────────────

export const verifyCertificate = asyncHandler(async (req, res) => {
  const { certNumber } = req.params;

  const [result] = await db
    .select({
      id: certificates.id,
      certificateNumber: certificates.certificateNumber,
      fileUrl: certificates.fileUrl,
      metadata: certificates.metadata,
      issuedAt: certificates.issuedAt,
      verifiedAt: certificates.verifiedAt,
      studentName: users.fullName,
      studentSchool: students.school,
      studentMajor: students.major,
      businessName: umkm.businessName,
    })
    .from(certificates)
    .leftJoin(students, eq(certificates.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .leftJoin(internships, eq(certificates.internshipId, internships.id))
    .leftJoin(umkm, eq(internships.umkmId, umkm.id))
    .where(eq(certificates.certificateNumber, certNumber))
    .limit(1);

  if (!result) {
    return res.status(404).json({
      valid: false,
      message: "Sertifikat tidak ditemukan",
    });
  }

  // Mark as verified if not already
  if (!result.verifiedAt) {
    await db
      .update(certificates)
      .set({ verifiedAt: new Date() })
      .where(eq(certificates.id, result.id));
  }

  res.json({
    valid: true,
    certificate: {
      number: result.certificateNumber,
      studentName: result.studentName,
      school: result.studentSchool,
      major: result.studentMajor,
      businessName: result.businessName,
      issuedAt: result.issuedAt,
      duration: result.metadata?.duration || "14 days",
    },
  });
});

// ─── DOWNLOAD PDF ──────────────────────────────────────────

export const downloadCertificate = asyncHandler(async (req, res) => {
  const [cert] = await db
    .select({
      id: certificates.id,
      certificateNumber: certificates.certificateNumber,
      fileUrl: certificates.fileUrl,
    })
    .from(certificates)
    .where(eq(certificates.id, req.params.id))
    .limit(1);

  if (!cert) throw new AppError("Certificate not found", 404);

  const fileName = `${cert.certificateNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  const filePath = path.join(CERT_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    // Regenerate if file missing
    const [fullRecord] = await getCertificateData(cert.id);
    if (!fullRecord) throw new AppError("Certificate data not found", 404);
    await generateCertificatePdf(fullRecord);
  }

  res.download(filePath, fileName, (err) => {
    if (err) throw new AppError("Failed to download certificate", 500);
  });
});

async function getCertificateData(certId) {
  const result = await db
    .select({
      id: certificates.id,
      certificateNumber: certificates.certificateNumber,
      fileUrl: certificates.fileUrl,
      metadata: certificates.metadata,
      issuedAt: certificates.issuedAt,
      verifiedAt: certificates.verifiedAt,
      studentName: users.fullName,
      studentSchool: students.school,
      studentMajor: students.major,
      businessName: umkm.businessName,
    })
    .from(certificates)
    .leftJoin(students, eq(certificates.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .leftJoin(internships, eq(certificates.internshipId, internships.id))
    .leftJoin(umkm, eq(internships.umkmId, umkm.id))
    .where(eq(certificates.id, certId))
    .limit(1);

  return result;
}

// ─── REST API ──────────────────────────────────────────────

export const getCertificates = asyncHandler(async (req, res) => {
  const conditions = [];

  if (req.user.role === "student") {
    const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);
    if (studentProfile) conditions.push(eq(certificates.studentId, studentProfile.id));
  }

  const result = await db
    .select({
      id: certificates.id,
      certificateNumber: certificates.certificateNumber,
      fileUrl: certificates.fileUrl,
      metadata: certificates.metadata,
      issuedAt: certificates.issuedAt,
      verifiedAt: certificates.verifiedAt,
      studentName: users.fullName,
      studentSchool: students.school,
      studentMajor: students.major,
    })
    .from(certificates)
    .leftJoin(students, eq(certificates.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(certificates.issuedAt));

  res.json(result);
});

export const getCertificate = asyncHandler(async (req, res) => {
  const [result] = await db
    .select({
      id: certificates.id,
      studentId: certificates.studentId,
      internshipId: certificates.internshipId,
      certificateNumber: certificates.certificateNumber,
      fileUrl: certificates.fileUrl,
      metadata: certificates.metadata,
      issuedAt: certificates.issuedAt,
      verifiedAt: certificates.verifiedAt,
      studentName: users.fullName,
      studentSchool: students.school,
      studentMajor: students.major,
      businessName: umkm.businessName,
    })
    .from(certificates)
    .leftJoin(students, eq(certificates.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .leftJoin(internships, eq(certificates.internshipId, internships.id))
    .leftJoin(umkm, eq(internships.umkmId, umkm.id))
    .where(eq(certificates.id, req.params.id))
    .limit(1);

  if (!result) throw new AppError("Certificate not found", 404);
  res.json(result);
});
