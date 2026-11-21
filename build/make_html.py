"""합의서 원본 HTML 생성: python3 build/make_html.py
agreement.json 하나만 고치면 HTML·Word가 같은 내용으로 다시 만들어진다."""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
d = json.loads((ROOT / "build" / "agreement.json").read_text(encoding="utf-8"))
CIRC = "①②③④⑤"
e = html.escape


def body_html(body):
    out = []
    for b in body:
        if b["t"] == "p":
            out.append(f"<p>{e(b['text'])}</p>")
        elif b["t"] == "ol":
            out.append("<ol>" + "".join(f"<li>{e(i)}</li>" for i in b["items"]) + "</ol>")
        else:
            out.append('<ul class="circ">' + "".join(
                f"<li><span class='m'>{CIRC[n]}</span>{e(i)}</li>" for n, i in enumerate(b["items"])) + "</ul>")
    return "\n".join(out)


parties = "".join(f"<tr><th>{e(k)}</th><td>{e(v)}</td></tr>" for k, v in d["parties"])
articles = "\n".join(
    f"""<section class="art" data-block>
  <h3 data-ref="제{a['no']}조({e(a['title'])})">제{a['no']}조({e(a['title'])})</h3>
  {body_html(a['body'])}
</section>""" for a in d["articles"])
process = "".join(f"<li>{e(s)}</li>" for s in d["process"])
sigs = "".join(f"<tr><th>{e(a)}</th><td>{e(b)}</td><td class='seal'>{e(c)}</td></tr>" for a, b, c in d["signatures"])

page = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(d['title'])}</title>
<style>
  :root{{--ink:#1d1d1f;--line:#9aa3ad;--soft:#f4f6f8;--accent:#2b4a7a}}
  *{{box-sizing:border-box}}
  body{{margin:0;background:#fff;color:var(--ink);font-family:"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif;line-height:1.75}}
  .bar{{position:sticky;top:0;background:#fff;border-bottom:1px solid #e3e7ec;padding:10px 16px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;z-index:10}}
  .bar a,.bar button{{font:inherit;font-size:14px;color:var(--accent);border:1px solid #c9d3e0;border-radius:8px;padding:6px 12px;background:#fff;text-decoration:none;cursor:pointer}}
  .paper{{max-width:794px;margin:24px auto 90px;padding:56px 64px;border:1px solid #e3e7ec;box-shadow:0 2px 18px rgba(0,0,0,.05)}}
  h1{{text-align:center;font-size:26px;letter-spacing:.08em;margin:0 0 24px}}
  h2{{font-size:18px;border-bottom:2px solid var(--ink);padding-bottom:4px;margin:30px 0 12px}}
  h3{{font-size:15.5px;margin:18px 0 4px}}
  p{{margin:4px 0}}
  table{{width:100%;border-collapse:collapse;font-size:14.5px}}
  th,td{{border:1px solid var(--line);padding:7px 10px;text-align:left;vertical-align:top}}
  th{{background:var(--soft);width:28%;font-weight:700}}
  ol{{margin:4px 0;padding-left:26px}}
  ul.circ{{list-style:none;margin:4px 0;padding-left:4px}}
  ul.circ li{{display:flex;gap:6px}} ul.circ .m{{flex:none}}
  .date{{text-align:center;margin:26px 0 14px}}
  .sig th{{width:26%}} .sig td.seal{{width:22%;text-align:center;color:#888}}
  .note{{font-size:12.5px;color:#777;text-align:center;margin-top:28px}}
  @media (max-width:700px){{.paper{{padding:28px 18px;margin:12px 8px 90px}} h1{{font-size:21px}}}}
  @media print{{.bar,.note{{display:none}} .paper{{border:0;box-shadow:none;margin:0;padding:0;max-width:none}} @page{{size:A4;margin:22mm}}}}
</style>
</head>
<body>
<nav class="bar">
  <a href="index.html">처음으로</a>
  <a href="guide.html">한눈에 보는 설명</a>
  <a href="agreement.docx" download>Word 파일 받기</a>
  <button type="button" onclick="window.print()">인쇄</button>
</nav>
<main class="paper">
  <h1>{e(d['title'])}</h1>
  <p>{e(d['lead'])}</p>

  <h2>{e(d['partiesTitle'])}</h2>
  <section data-block>
    <h3 data-ref="당사자와 목적물" style="margin-top:0;font-size:14px;color:#666">기본 사항</h3>
    <table>{parties}</table>
    <p style="margin-top:12px">{e(d['background'])}</p>
  </section>

  <h2>{e(d['articlesTitle'])}</h2>
  {articles}

  <h2>{e(d['processTitle'])}</h2>
  <ol>{process}</ol>
  <p class="date">{e(d['dateLine'])}</p>
  <table class="sig"><tr><th>구분</th><th style="background:var(--soft)">성명</th><th style="background:var(--soft);text-align:center">서명 또는 날인</th></tr>{sigs}</table>
  <p class="note">공개용 사본입니다. 개인 정보는 ○○○로 가렸습니다. 조항 옆 '수정 요청' 버튼으로 바꾸고 싶은 내용을 보낼 수 있습니다.</p>
</main>
<script src="assets/feedback.js"></script>
</body>
</html>
"""
(ROOT / "agreement.html").write_text(page, encoding="utf-8")
print("wrote", ROOT / "agreement.html")
