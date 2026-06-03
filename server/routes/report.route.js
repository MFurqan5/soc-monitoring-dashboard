const express = require("express");
const router = express.Router();
const pool = require("../db/connection");
const PDFDocument = require("pdfkit");

// GET /api/report/:ip
// Generate a professional CERT-format incident report as PDF
router.get("/:ip", async (req, res) => {
  try {
    const { ip } = req.params;

    // Get attacker profile
    const profileResult = await pool.query(
      `SELECT * FROM attacker_profiles WHERE ip = $1`,
      [ip]
    );

    if (profileResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Attacker profile not found" });
    }

    // Get all events from this attacker
    const eventsResult = await pool.query(
      `SELECT * FROM attack_logs WHERE source_ip = $1 ORDER BY timestamp DESC`,
      [ip]
    );

    const profile = profileResult.rows[0];
    const events = eventsResult.rows;

    // Create PDF document
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="threat-report-${ip}.pdf"`
    );

    doc.pipe(res);

    // Title Page
    doc.fontSize(28).font("Helvetica-Bold").text("INCIDENT REPORT", {
      align: "center",
    });
    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .font("Helvetica")
      .text("Security Threat Analysis & Attribution", {
        align: "center",
      });
    doc.moveDown(2);

    doc
      .fontSize(11)
      .text(`Report Generated: ${new Date().toISOString()}`, {
        align: "center",
      });
    doc
      .fontSize(11)
      .text(`Attacker IP: ${ip}`, { align: "center" })
      .moveDown(3);

    // Executive Summary Section
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("1. EXECUTIVE SUMMARY", { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(
        `This report documents a confirmed cyber threat originating from IP address ${ip}. The attacker has demonstrated sophisticated attack techniques and persistence, posing a significant risk to system security.`,
        { align: "left", width: 500 }
      );
    doc.moveDown(1);

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Risk Level: ");
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(getRiskColor(profile.threat_score))
      .text(
        `${getRiskLevel(profile.threat_score)} (Threat Score: ${profile.threat_score}/100)`,
        { continued: false }
      );
    doc.fillColor("black").moveDown(1.5);

    // Attacker Profile Section
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("2. ATTACKER PROFILE", { underline: true });
    doc.moveDown(0.5);

    const profileTable = [
      ["Attribute", "Value"],
      ["IP Address", ip],
      ["Country", profile.country || "UNKNOWN"],
      ["City", profile.city || "UNKNOWN"],
      ["ISP", profile.isp || "UNKNOWN"],
      ["Operating System", profile.os || "UNKNOWN"],
      ["Attack Tool", profile.tool || "UNKNOWN"],
      ["Known Malicious", profile.is_known_malicious ? "YES" : "NO"],
      ["Total Requests", String(profile.total_requests)],
      ["First Seen", new Date(profile.first_seen).toISOString()],
      ["Last Seen", new Date(profile.last_seen).toISOString()],
    ];

    drawTable(doc, profileTable, 50, 350);
    doc.moveDown(3);

    // Attack Breakdown Section
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("3. ATTACK BREAKDOWN", { underline: true });
    doc.moveDown(0.5);

    const breakdownTable = [
      ["Attack Type", "Count"],
      [
        "SQL Injection",
        String(profile.sqli_count),
      ],
      ["Cross-Site Scripting (XSS)", String(profile.xss_count)],
      ["Brute Force", String(profile.bruteforce_count)],
      ["Directory Traversal", String(profile.traversal_count)],
    ];

    drawTable(doc, breakdownTable, 50, 600);
    doc.moveDown(2);

    // Add new page for detailed events
    doc.addPage();

    // Recent Attacks Timeline Section
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("4. ATTACK TIMELINE", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");
    events.slice(0, 10).forEach((event, idx) => {
      doc.text(
        `${idx + 1}. [${new Date(event.timestamp).toISOString()}] ${event.method} ${event.path}`,
        { width: 500 }
      );
      doc.text(`   Type: ${event.attack_type.toUpperCase()} | Severity: ${event.severity}`, {
        width: 500,
      });
      if (event.payload) {
        doc.text(`   Payload: ${event.payload.substring(0, 100)}...`, {
          width: 500,
        });
      }
      doc.moveDown(0.3);
    });

    if (events.length > 10) {
      doc.text(`... and ${events.length - 10} more attacks`, {
        width: 500,
        italic: true,
      });
    }
    doc.moveDown(2);

    // Indicators of Compromise (IOCs)
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("5. INDICATORS OF COMPROMISE (IOCs)", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica").text(`IP Addresses:\n• ${ip}\n`);

    const payloads = events
      .filter((e) => e.payload)
      .map((e) => e.payload)
      .slice(0, 5);
    if (payloads.length > 0) {
      doc.text(`Malicious Payloads:\n`);
      payloads.forEach((p) => {
        doc.text(`• ${p.substring(0, 80)}...`);
      });
    }
    doc.moveDown(1.5);

    // Recommendations Section
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("6. RECOMMENDATIONS", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font("Helvetica");
    doc.text("Immediate Actions:", { underline: true });
    doc.text("1. Block this IP address at firewall and WAF level");
    doc.text("2. Review all access logs for this IP for breach indicators");
    doc.text("3. Check for any successful authentication using stolen credentials");
    doc.moveDown(0.5);
    doc.text("Follow-up Actions:", { underline: true });
    doc.text("1. Monitor for any return attempts from this IP or related IPs");
    doc.text("2. Share IOCs with threat intelligence feeds");
    doc.text("3. Implement advanced rate limiting and behavioral analysis");
    doc.moveDown(2);

    // Footer
    doc
      .fontSize(9)
      .font("Helvetica")
      .text(
        "This report is classified as SECURITY SENSITIVE. Unauthorized distribution is prohibited.",
        { align: "center" }
      );
    doc.text(
      `Generated by SOC Monitoring Dashboard - ${new Date().toLocaleString()}`,
      { align: "center" }
    );

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error("[report] Error:", err.message);
    res
      .status(500)
      .json({ success: false, error: "Failed to generate report" });
  }
});

// Helper function to get risk level based on threat score
function getRiskLevel(score) {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

// Helper function to get color for risk level
function getRiskColor(score) {
  if (score >= 80) return "#ff0000"; // RED
  if (score >= 60) return "#ff9900"; // ORANGE
  if (score >= 40) return "#ffcc00"; // YELLOW
  return "#00cc00"; // GREEN
}

// Helper function to draw table in PDF
function drawTable(doc, data, x, y, colWidths = [250, 200]) {
  const rowHeight = 20;
  const fontSize = 10;

  doc.fontSize(fontSize);

  // Draw header
  doc.fillColor("#333333");
  data[0].forEach((header, i) => {
    doc.text(header, x + (colWidths[i] ? colWidths.slice(0, i).reduce((a, b) => a + b, 0) : 0), y, {
      width: colWidths[i] || 200,
      align: "left",
    });
  });

  doc.moveTo(x, y + rowHeight - 2).lineTo(x + colWidths.reduce((a, b) => a + b, 0), y + rowHeight - 2).stroke();

  // Draw rows
  let currentY = y + rowHeight;
  for (let i = 1; i < data.length; i++) {
    doc.fillColor("#000000");
    data[i].forEach((cell, j) => {
      doc.text(cell || "", x + (colWidths[j] ? colWidths.slice(0, j).reduce((a, b) => a + b, 0) : 0), currentY, {
        width: colWidths[j] || 200,
        align: "left",
      });
    });
    currentY += rowHeight;
  }

  doc.moveTo(x, currentY).lineTo(x + colWidths.reduce((a, b) => a + b, 0), currentY).stroke();
}

module.exports = router;
