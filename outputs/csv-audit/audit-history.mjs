import fs from "node:fs/promises";
import { Workbook } from "@oai/artifact-tool";

const sourcePath =
  "C:/Users/letic/Downloads/historico-completo-vendas-assinaturas.csv";
const source = await fs.readFile(sourcePath, "utf8");
const logicalLines = source
  .replace(/^\uFEFF/, "")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) =>
    line.startsWith('"') && line.endsWith('"')
      ? line.slice(1, -1).replace(/""/g, '"')
      : line,
  );

function parseLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

const headers = parseLine(logicalLines[0]);
const rows = logicalLines.slice(1).map((line) =>
  Object.fromEntries(
    headers.map((header, index) => [header, parseLine(line)[index] ?? ""]),
  ),
);
const money = (value) =>
  Number(
    String(value ?? "")
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", "."),
  ) || 0;
const exactKey = (row) =>
  [row.tipo, row.data_hora, row.cliente, row.plano, row.metodo, row.valor].join("|");
const counts = (field) =>
  Object.fromEntries(
    [...new Set(rows.map((row) => row[field]))]
      .sort((left, right) => left.localeCompare(right, "pt-BR"))
      .map((value) => [value, rows.filter((row) => row[field] === value).length]),
  );
const duplicateGroups = [...new Set(rows.map(exactKey))]
  .map((key) => ({ key, count: rows.filter((row) => exactKey(row) === key).length }))
  .filter((item) => item.count > 1);

const correctedCsv = [
  headers,
  ...rows.map((row) => headers.map((header) => row[header])),
]
  .map((row) =>
    row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
  )
  .join("\r\n");
const workbook = await Workbook.fromCSV(correctedCsv, { sheetName: "Histórico" });
const inspection = await workbook.inspect({
  kind: "table",
  range: `Histórico!A1:H${Math.min(rows.length + 1, 10)}`,
  include: "values",
  tableMaxRows: 10,
  tableMaxCols: 8,
  maxChars: 8000,
});

console.log(
  JSON.stringify({
    headers,
    rows: rows.length,
    totalValue: rows.reduce((sum, row) => sum + money(row.valor), 0),
    totalCommission: rows.reduce((sum, row) => sum + money(row.comissao), 0),
    types: counts("tipo"),
    methods: counts("metodo"),
    sellers: counts("vendedor"),
    firstDateTime: rows.at(-1)?.data_hora ?? "",
    lastDateTime: rows[0]?.data_hora ?? "",
    blankSeller: rows.filter((row) => !row.vendedor).length,
    blankCommission: rows.filter((row) => !row.comissao).length,
    duplicateGroups,
    inspection: inspection.ndjson,
  }),
);
