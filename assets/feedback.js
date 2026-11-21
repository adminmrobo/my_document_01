// 수정 요청 보내기: 조항별 버튼 → 의견 작성 → 복사 / 공유(문자·카톡) / GitHub 이슈
(function () {
  const REPO = "adminmrobo/my_document_01";
  const css = `
  .fb-btn{font:inherit;font-size:13px;border:1px solid #c9d3e0;background:#fff;color:#2b4a7a;border-radius:6px;padding:3px 10px;cursor:pointer;margin-left:8px;vertical-align:middle}
  .fb-btn:hover{background:#eef3fa}
  .fb-fab{position:fixed;right:18px;bottom:18px;z-index:50;background:#2b4a7a;color:#fff;border:0;border-radius:999px;padding:12px 18px;font:inherit;font-size:15px;box-shadow:0 4px 14px rgba(0,0,0,.18);cursor:pointer}
  .fb-mask{position:fixed;inset:0;background:rgba(20,30,45,.45);display:none;align-items:center;justify-content:center;z-index:60;padding:16px}
  .fb-mask.on{display:flex}
  .fb-box{background:#fff;border-radius:12px;max-width:560px;width:100%;padding:20px;box-shadow:0 10px 40px rgba(0,0,0,.25);max-height:90vh;overflow:auto}
  .fb-box h3{margin:0 0 8px;font-size:18px}
  .fb-quote{background:#f5f7fa;border-left:4px solid #2b4a7a;padding:8px 12px;font-size:14px;color:#333;margin:8px 0 12px;white-space:pre-wrap}
  .fb-box label{display:block;font-size:13px;color:#555;margin:10px 0 4px}
  .fb-box input,.fb-box textarea{width:100%;box-sizing:border-box;font:inherit;font-size:15px;border:1px solid #c9d3e0;border-radius:8px;padding:8px}
  .fb-box textarea{min-height:110px}
  .fb-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
  .fb-row button{flex:1 1 140px;font:inherit;font-size:14px;border-radius:8px;padding:10px;border:1px solid #2b4a7a;background:#fff;color:#2b4a7a;cursor:pointer}
  .fb-row button.main{background:#2b4a7a;color:#fff}
  .fb-note{font-size:12px;color:#777;margin-top:10px}
  .fb-toast{position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:#222;color:#fff;padding:8px 14px;border-radius:8px;font-size:14px;opacity:0;transition:opacity .2s;z-index:70}
  .fb-toast.on{opacity:1}
  @media print{.fb-btn,.fb-fab,.fb-mask,.fb-toast{display:none!important}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const mask = document.createElement("div");
  mask.className = "fb-mask";
  mask.innerHTML = `<div class="fb-box" role="dialog" aria-modal="true">
    <h3>수정 요청 보내기</h3>
    <div class="fb-quote" id="fbQuote"></div>
    <label for="fbName">보내는 분 (예: 임차인 ○○○)</label>
    <input id="fbName" placeholder="이름 또는 역할">
    <label for="fbText">바꾸고 싶은 내용</label>
    <textarea id="fbText" placeholder="예) 반환 기한을 계약 종료일 기준 7영업일로 해 주세요."></textarea>
    <div class="fb-row">
      <button class="main" id="fbShare">문자·카톡으로 보내기</button>
      <button id="fbCopy">내용 복사</button>
      <button id="fbIssue">GitHub으로 보내기</button>
    </div>
    <div class="fb-row"><button id="fbClose">닫기</button></div>
    <p class="fb-note">'문자·카톡으로 보내기'는 휴대폰 공유 화면을 엽니다. 공유가 안 되는 기기에서는 내용이 복사되니 붙여 넣어 보내 주세요. GitHub 계정이 있으면 'GitHub으로 보내기'로 요청을 남길 수 있습니다.</p>
  </div>`;
  document.body.appendChild(mask);
  const toast = document.createElement("div"); toast.className = "fb-toast"; document.body.appendChild(toast);
  const $ = (id) => document.getElementById(id);
  let current = { ref: "전체", text: "" };

  function say(msg) { toast.textContent = msg; toast.classList.add("on"); setTimeout(() => toast.classList.remove("on"), 1800); }
  function compose() {
    const who = $("fbName").value.trim() || "(이름 없음)";
    return `[보증금 반환 합의서 수정 요청]\n대상: ${current.ref}\n보낸 사람: ${who}\n\n요청 내용:\n${$("fbText").value.trim()}\n\n현재 문구:\n${current.text}`;
  }
  async function copy(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch (e) {
      const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (_) {} ta.remove(); return ok;
    }
  }
  function need() { if (!$("fbText").value.trim()) { say("바꾸고 싶은 내용을 적어 주세요"); $("fbText").focus(); return false; } return true; }

  window.openFeedback = function (ref, text) {
    current = { ref, text: text || "" };
    $("fbQuote").textContent = ref + (text ? "\n" + text : "");
    $("fbText").value = ""; mask.classList.add("on"); $("fbText").focus();
  };
  $("fbClose").onclick = () => mask.classList.remove("on");
  mask.addEventListener("click", (e) => { if (e.target === mask) mask.classList.remove("on"); });
  $("fbCopy").onclick = async () => { if (!need()) return; say((await copy(compose())) ? "복사했습니다" : "복사에 실패했습니다"); };
  $("fbShare").onclick = async () => {
    if (!need()) return;
    const t = compose();
    if (navigator.share) { try { await navigator.share({ title: "합의서 수정 요청", text: t }); return; } catch (e) { if (e.name === "AbortError") return; } }
    say((await copy(t)) ? "복사했습니다. 문자나 카톡에 붙여 넣어 주세요" : "복사에 실패했습니다");
  };
  $("fbIssue").onclick = () => {
    if (!need()) return;
    const url = `https://github.com/${REPO}/issues/new?title=${encodeURIComponent("[수정 요청] " + current.ref)}&body=${encodeURIComponent(compose())}`;
    window.open(url, "_blank", "noopener");
  };

  // 조항마다 버튼 달기: data-ref 속성이 있는 요소
  document.querySelectorAll("[data-ref]").forEach((el) => {
    const b = document.createElement("button");
    b.className = "fb-btn"; b.type = "button"; b.textContent = "수정 요청";
    b.onclick = () => {
      let text = el.dataset.text || "";
      const block = el.closest("[data-block]");
      if (!text && block) {
        const parts = [...block.children].filter((c) => c !== el).map((c) => c.innerText.trim());
        text = parts.join("\n").replace(/\n{2,}/g, "\n");
      }
      openFeedback(el.dataset.ref, text);
    };
    (el.querySelector(".fb-anchor") || el).appendChild(b);
  });
  const fab = document.createElement("button");
  fab.className = "fb-fab"; fab.type = "button"; fab.textContent = "✎ 수정 요청";
  fab.onclick = () => openFeedback("전체", "");
  document.body.appendChild(fab);
})();
