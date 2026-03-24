import { Document, Packer, Paragraph, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, TextRun, AlignmentType, BorderStyle, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportConfig {
  title: string;
  clause: string;
  description: string;
  headers: string[];
  rows: string[][];
  isRtl: boolean;
  filename: string;
}

function prepareData(config: ExportConfig) {
  const headers = config.isRtl ? [...config.headers].reverse() : config.headers;
  const rows = config.isRtl ? config.rows.map(r => [...r].reverse()) : config.rows;
  return { headers, rows };
}

export async function exportToWord(config: ExportConfig) {
  const { headers, rows } = prepareData(config);
  const textAlign = config.isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT;

  const borders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
  };

  const pct = Math.floor(100 / headers.length);

  const headerRow = new DocxTableRow({
    tableHeader: true,
    children: headers.map((h) =>
      new DocxTableCell({
        borders,
        shading: { fill: "1e3a5f" },
        children: [new Paragraph({ alignment: textAlign, children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20, font: "Arial" })] })],
        width: { size: pct, type: WidthType.PERCENTAGE },
      })
    ),
  });

  const dataRows = rows.map((cells) =>
    new DocxTableRow({
      children: cells.map((c) =>
        new DocxTableCell({
          borders,
          children: [new Paragraph({ alignment: textAlign, children: [new TextRun({ text: c, size: 18, font: "Arial" })] })],
          width: { size: pct, type: WidthType.PERCENTAGE },
        })
      ),
    })
  );

  const doc = new Document({
    sections: [{
      properties: { page: { size: { orientation: "landscape" as const } } },
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `${config.clause} - ${config.title}`, bold: true, size: 32, font: "Arial", color: "1e3a5f" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [new TextRun({ text: config.description, size: 22, font: "Arial", color: "666666" })],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: `${rows.length} records`, size: 20, font: "Arial" })],
        }),
        new DocxTable({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...dataRows],
        }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: config.isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
          spacing: { after: 400 },
          children: [new TextRun({ text: config.isRtl ? "___________________________ :تمت الموافقة من قبل" : "Approved By: ___________________________", size: 24, font: "Arial" })],
        }),
        new Paragraph({
          alignment: config.isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
          spacing: { after: 400 },
          children: [new TextRun({ text: config.isRtl ? "___________________________ :التوقيع" : "Signature:    ___________________________", size: 24, font: "Arial" })],
        }),
        new Paragraph({
          alignment: config.isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
          spacing: { after: 400 },
          children: [new TextRun({ text: config.isRtl ? "___________________________ :التاريخ" : "Date:            ___________________________", size: 24, font: "Arial" })],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${config.filename}.docx`);
}

export function exportToExcel(config: ExportConfig) {
  const { headers, rows } = prepareData(config);
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const colWidths = headers.map((_h, i) => {
    const maxLen = Math.max(headers[i].length, ...rows.map((r) => (r[i] || "").length));
    return { wch: Math.min(Math.max(maxLen, 12), 50) };
  });
  ws["!cols"] = colWidths;
  if (config.isRtl) ws["!RTL"] = true;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, config.title.substring(0, 31));
  XLSX.writeFile(wb, `${config.filename}.xlsx`);
}

export function exportToPdf(config: ExportConfig) {
  const { headers, rows } = prepareData(config);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(18);
  doc.setTextColor(30, 58, 95);
  doc.text(`${config.clause} - ${config.title}`, doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(config.description, doc.internal.pageSize.getWidth() / 2, 22, { align: "center" });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 28,
    styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak", halign: config.isRtl ? "right" : "left" },
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: "bold", fontSize: 8, halign: config.isRtl ? "right" : "left" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  const finalY = ((doc as unknown as Record<string, Record<string, number>>).lastAutoTable?.finalY) || doc.internal.pageSize.getHeight() - 50;
  const signY = Math.min(finalY + 15, doc.internal.pageSize.getHeight() - 35);
  const signX = config.isRtl ? doc.internal.pageSize.getWidth() - 14 : 14;
  const signAlign = config.isRtl ? "right" as const : "left" as const;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(config.isRtl ? "___________________________ :تمت الموافقة من قبل" : "Approved By: ___________________________", signX, signY, { align: signAlign });
  doc.text(config.isRtl ? "___________________________ :التوقيع" : "Signature:    ___________________________", signX, signY + 10, { align: signAlign });
  doc.text(config.isRtl ? "___________________________ :التاريخ" : "Date:            ___________________________", signX, signY + 20, { align: signAlign });

  doc.save(`${config.filename}.pdf`);
}
