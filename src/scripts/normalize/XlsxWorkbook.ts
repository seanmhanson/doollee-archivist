import ExcelJS from "exceljs";

type SheetMeta = {
  sheet: string;
  collection: string;
  recordCount: number;
  generatedAt: string;
};

export default class XlsxWorkbook {
  private workbook: ExcelJS.Workbook;
  private summarySheet: ExcelJS.Worksheet;
  private sheetMeta: SheetMeta[] = [];
  private readonly generatedAt: string;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.generatedAt = new Date().toISOString();
    this.summarySheet = this.workbook.addWorksheet("Summary");
  }

  addSheet(name: string, rows: Record<string, unknown>[], recordCount: number, collection = "", headers?: string[]) {
    const sheet = this.workbook.addWorksheet(name);

    const resolvedHeaders = headers ?? (rows.length > 0 ? [...new Set(rows.flatMap(Object.keys))] : null);
    if (resolvedHeaders) {
      const headerRow = sheet.addRow(resolvedHeaders);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
      });
      sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: resolvedHeaders.length },
      };
      for (const row of rows) {
        sheet.addRow(resolvedHeaders.map((h) => row[h] ?? ""));
      }
    }

    this.sheetMeta.push({ sheet: name, collection, recordCount, generatedAt: this.generatedAt });
  }

  private populateSummarySheet() {
    const headers = ["Sheet", "Collection", "RecordCount", "GeneratedAt"];
    const headerRow = this.summarySheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
    });
    this.summarySheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];
    this.summarySheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };
    for (const meta of this.sheetMeta) {
      this.summarySheet.addRow([meta.sheet, meta.collection, meta.recordCount, meta.generatedAt]);
    }
  }

  async write(outputPath: string) {
    this.populateSummarySheet();
    await this.workbook.xlsx.writeFile(outputPath);
  }
}
