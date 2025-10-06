"use client";
import React from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";

type RawItem = Record<string, any>;

type ExportButtonsProps = {
  data: RawItem[]; // we accept raw/enriched objects and normalize
};

export default function ExportButtons({ data }: ExportButtonsProps) {
  if (!data || data.length === 0) return null;

  // Normalize a single item into the export shape
  const normalize = (r: RawItem) => {
    const company =
      r.title ||
      r.site?.company_name ||
      r.site?.companyName ||
      r.company ||
      r.name ||
      r.url ||
      "";
    const url = r.url || r.site?.url || r.link || r.website || "";

    // emails: accept arrays or comma/semicolon strings
    let emailsArr: string[] = [];
    if (Array.isArray(r.site?.emails)) emailsArr = r.site.emails;
    else if (Array.isArray(r.emails)) emailsArr = r.emails;
    else if (typeof r.site?.emails === "string")
      emailsArr = r.site.emails.split(/[;,]\s*/);
    else if (typeof r.emails === "string") emailsArr = r.emails.split(/[;,]\s*/);

    // phones: accept arrays or strings
    let phonesArr: string[] = [];
    if (Array.isArray(r.site?.phones)) phonesArr = r.site.phones;
    else if (Array.isArray(r.phones)) phonesArr = r.phones;
    else if (typeof r.site?.phones === "string")
      phonesArr = r.site.phones.split(/[;,]\s*/);
    else if (typeof r.phones === "string") phonesArr = r.phones.split(/[;,]\s*/);
    else if (r.site?.phone) phonesArr = [String(r.site.phone)];
    else if (r.phone) phonesArr = [String(r.phone)];

    const emails = emailsArr.filter(Boolean).join(", ");
    const phones = phonesArr.filter(Boolean).join(", ");

    const ceo = r.linkedin?.ceo || r.ceo || r.site?.ceo || "";

    // linkedinProfile: try multiple common places
    const linkedinProfile =
      r.linkedin?.profile ||
      r.linkedinProfile ||
      r.site?.linkedin_page ||
      r.site?.linkedin ||
      (r.linkedin?.company?.url || "");

    return {
      company,
      url,
      emails,
      phones,
      ceo,
      linkedinProfile,
    };
  };

  // Build normalized array
  const formatted = data.map(normalize);

  // Column order and headers we want in the outputs
  const headers = ["Company", "Website", "Emails", "Phones", "CEO", "LinkedIn"];
  const keys = ["company", "url", "emails", "phones", "ceo", "linkedinProfile"];

  // UTIL: escape for CSV
  const quote = (v: any) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;

  // Export CSV
  const exportCSV = () => {
    const rows = formatted.map((f) => keys.map((k) => f[k] ?? ""));
    const csvRows = [
      headers.map((h) => `"${h}"`).join(","), // header row
      ...rows.map((r) => r.map((c) => quote(c)).join(",")),
    ];
    const csvContent = csvRows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "companies.csv");
  };

  // Export Excel (explicit column order using aoa_to_sheet to avoid column shuffling)
  const exportExcel = () => {
    const rows = [headers, ...formatted.map((f) => keys.map((k) => f[k] ?? ""))];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    // Optionally set column widths for better readability
    ws["!cols"] = [
      { wch: 30 }, // Company
      { wch: 40 }, // Website
      { wch: 40 }, // Emails
      { wch: 30 }, // Phones
      { wch: 20 }, // CEO
      { wch: 40 }, // LinkedIn
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Companies");
    XLSX.writeFile(wb, "companies.xlsx");
  };

  // Export Word
  const exportWord = async () => {
    const tableRows: TableRow[] = [];

    // Header row (using widths summing close to 100)
    tableRows.push(
      new TableRow({
        children: headers.map(
          (h) =>
            new TableCell({
              children: [new Paragraph(h)],
              width: { size: 20, type: WidthType.PERCENTAGE },
            })
        ),
      })
    );

    // Data rows
    formatted.forEach((f) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(f.company || "")],
              width: { size: 20, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph(f.url || "")],
              width: { size: 20, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph(f.emails || "")],
              width: { size: 20, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph(f.phones || "")],
              width: { size: 15, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph(f.ceo || "")],
              width: { size: 10, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph(f.linkedinProfile || "")],
              width: { size: 15, type: WidthType.PERCENTAGE },
            }),
          ],
        })
      );
    });

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: "Company Search Results", heading: "Heading1" }),
            new Table({ rows: tableRows }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "companies.docx");
  };

  return (
    <div className="flex gap-3 mb-4">
      <button
        onClick={exportCSV}
        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
        type="button"
      >
        Export CSV
      </button>
      <button
        onClick={exportExcel}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        type="button"
      >
        Export Excel
      </button>
      <button
        onClick={exportWord}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        type="button"
      >
        Export Word
      </button>
    </div>
  );
}