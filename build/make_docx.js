// 합의서 출력용 Word 파일 생성: node build/make_docx.js
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, HeadingLevel,
} = require("docx");

// 사용법: node make_docx.js [치환표.json] [출력경로]
// 치환표(공란→실제 값)는 저장소 밖에 두고, 실명이 들어간 출력물은 커밋하지 않는다.
let raw = fs.readFileSync(path.join(__dirname, "agreement.json"), "utf8");
const [, , overlayPath, outArg] = process.argv;
if (overlayPath) {
  const pairs = JSON.parse(fs.readFileSync(overlayPath, "utf8"));
  for (const [from, to] of pairs) raw = raw.split(from).join(to);
}
const data = JSON.parse(raw);
const FONT = "Malgun Gothic";
const CIRC = ["①", "②", "③", "④", "⑤"];
const W = 9026; // A4 본문 폭(여백 2.54cm 기준, DXA)

const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: opts.after ?? 100, line: 340 },
    indent: opts.indent ? { left: opts.indent, hanging: opts.hanging || 0 } : undefined,
    alignment: opts.align,
    children: Array.isArray(text) ? text : [new TextRun({ text, size: opts.size || 22, bold: opts.bold })],
  });

const border = { style: BorderStyle.SINGLE, size: 4, color: "888888" };
const borders = { top: border, bottom: border, left: border, right: border };

function table(rows, widths, headerShade) {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, ri) =>
      new TableRow({
        children: r.map((c, ci) =>
          new TableCell({
            borders,
            width: { size: widths[ci], type: WidthType.DXA },
            shading: (ci === 0 || (headerShade && ri === 0))
              ? { type: ShadingType.CLEAR, color: "auto", fill: "F2F2F2" } : undefined,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: c, size: 21, bold: ci === 0 || (headerShade && ri === 0) })] })],
          })),
      })),
  });
}

const children = [];
children.push(new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun(data.title)] }));
children.push(p(data.lead, { after: 200 }));

children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(data.partiesTitle)] }));
children.push(table(data.parties, [2200, W - 2200], false));
children.push(p("", { after: 60 }));
children.push(p(data.background, { after: 200 }));

children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(data.articlesTitle)] }));
for (const a of data.articles) {
  const head = new TextRun({ text: `제${a.no}조(${a.title}) `, bold: true, size: 22 });
  let first = true;
  for (const b of a.body) {
    if (b.t === "p") {
      children.push(p(first ? [head, new TextRun({ text: b.text, size: 22 })] : b.text));
      first = false;
    } else {
      if (first) { children.push(p([head])); first = false; }
      b.items.forEach((it, i) => {
        const mark = b.t === "circ" ? CIRC[i] : `${i + 1}.`;
        children.push(p(`${mark} ${it}`, { indent: 400, hanging: 300 }));
      });
    }
  }
  children.push(p("", { after: 40 }));
}

children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(data.processTitle)] }));
data.process.forEach((s, i) => children.push(p(`${i + 1}. ${s}`, { indent: 400, hanging: 300 })));
children.push(p("", { after: 120 }));
children.push(p(data.dateLine, { align: AlignmentType.CENTER, after: 200 }));
children.push(table([["구분", "성명", "서명 또는 날인"], ...data.signatures], [2600, 4426, 2000], true));

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", run: { font: FONT, size: 36, bold: true },
        paragraph: { spacing: { before: 0, after: 300 }, keepNext: true } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { font: FONT, size: 26, bold: true },
        paragraph: { spacing: { before: 240, after: 120 }, keepNext: true, outlineLevel: 0 } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = outArg || path.join(__dirname, "..", "agreement.docx");
  fs.writeFileSync(out, buf);
  console.log("wrote", out);
});
