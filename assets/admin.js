/* 베베박스 2.0 — 운영자 대시보드 (목업) */
(function(){
  const {$, $$, esc, won, toast} = BB;
  const S = BB.load();
  const A = S.admin;
  let seg = "전체";

  $("#enter").onclick = enter;
  $("#key").addEventListener("keydown", e=>{ if(e.key==="Enter")enter(); });
  function enter(){ if(!$("#key").value.trim()){ toast("키를 입력하세요 (데모는 아무 값)"); return; } $("#gate").classList.add("hidden"); $("#dash").classList.remove("hidden"); render(); }

  function kpis(){
    const pend=A.coupons.filter(c=>!c.done).length, done=A.coupons.filter(c=>c.done).length;
    const records=S.posts.length*7; // 데모 합계
    const gifts=A.members.reduce((s,m)=>s+m.funnel.giftsDone,0);
    return [["가족(회원)",A.members.length,""],["🎟️ 지급 대기",pend,"hot"],["발급 완료",done,""],["누적 기록",records,""],["지인 선물 완료",gifts,""]];
  }

  function render(){
    const dash=$("#dash");
    dash.innerHTML = `
      <div class="a-top"><div><h1>베베박스 운영자 대시보드</h1><p class="sub">캔디 교환 회원에게 키디키디 쿠폰을 발급하고, 전환을 모니터링하세요</p></div></div>
      <div class="a-kpis">${kpis().map(k=>`<div class="a-card" style="padding:16px ${k[2]==='hot'?';background:var(--accent-soft);border-color:#ffd9c6':''}"><b style="display:block;font-size:26px;font-weight:800;color:var(--accent)">${k[1]}</b><span class="sub" style="font-size:12px">${k[0]}</span></div>`).join("")}</div>

      <div class="a-card">
        <div class="hd"><span>🎟️ 쿠폰 지급 대기열 <span class="muted">— 교환 완료 → 키디키디 쿠폰 발급 후 체크</span></span>
          <label class="muted" style="cursor:pointer"><input type="checkbox" id="showdone"/> 발급완료 보기</label></div>
        <div style="overflow:auto"><table id="cp-tbl"></table></div>
      </div>

      <div class="a-layout">
        <div class="a-card">
          <div class="hd"><span>회원(가족) 목록</span></div>
          <div style="padding:12px 16px"><div class="seg" id="seg">
            ${["전체","등록형","콘텐츠형"].map(s=>`<button class="chip ${s===seg?'on':''}" data-seg="${s}">${s}</button>`).join("")}</div></div>
          <div style="overflow:auto"><table id="mem-tbl"></table></div>
        </div>
        <div class="a-card">
          <div class="hd" id="detail-hd">회원 상세</div>
          <div id="detail" style="padding:18px"><p class="muted center" style="padding:30px 0">왼쪽에서 회원을 선택하세요</p></div>
        </div>
      </div>
      <p class="muted center" style="margin-top:18px">베베박스 2.0 · 데모(목업) — 실제 쿠폰 자동발급·키 보안은 P2 로드맵</p>`;
    renderCoupons(); renderMembers();
    $("#showdone").onchange=renderCoupons;
    $$("#seg [data-seg]").forEach(b=>b.onclick=()=>{ seg=b.dataset.seg; render(); });
  }

  function renderCoupons(){
    const showDone = $("#showdone")?.checked;
    const list = A.coupons.filter(c=>showDone||!c.done);
    const t=$("#cp-tbl");
    t.innerHTML = `<thead><tr><th>아기 / 코드</th><th>키디 아이디</th><th>쿠폰</th><th class="num">캔디</th><th>처리</th></tr></thead><tbody>`+
      (list.length?list.map((c,i)=>`<tr>
        <td><b>${esc(c.baby)}</b><br/><span class="muted">${c.code}</span></td>
        <td>${c.kid?esc(c.kid):'<span class="kidmiss">키디 아이디 없음</span>'}</td>
        <td>${won(c.amount)} <span class="chip" style="font-family:monospace">${c.ccode}</span></td>
        <td class="num">${c.candy}</td>
        <td><button class="btn ${c.done?'ghost':'primary'} sm" data-cp="${i}">${c.done?'✓ 발급됨':'지급 완료 체크'}</button></td>
      </tr>`).join(""):`<tr><td colspan="5"><p class="muted center" style="padding:20px">지급할 쿠폰이 없어요 🎉</p></td></tr>`)+`</tbody>`;
    $$("#cp-tbl [data-cp]").forEach(b=>b.onclick=()=>{ const c=list[+b.dataset.cp]; c.done=!c.done; BB.save(S); toast(c.done?"발급 완료로 표시했어요":"발급 완료를 취소했어요"); render(); });
  }

  function renderMembers(){
    const list = A.members.filter(m=>seg==="전체"||m.seg===seg);
    const t=$("#mem-tbl");
    t.innerHTML = `<thead><tr><th>아기 / 코드</th><th>세그먼트</th><th class="num">캔디</th><th class="num">공개위시</th></tr></thead><tbody>`+
      list.map(m=>`<tr class="click" data-mem="${m.code}">
        <td><b>${esc(m.baby)}</b><br/><span class="muted">${m.code}${m.kid?'':' · <span class="kidmiss">키디미연동</span>'}</span></td>
        <td><span class="chip ${m.seg==='등록형'?'accent':'lav'}">${m.seg}</span></td>
        <td class="num"><b>${m.candy}</b></td><td class="num">${m.published}</td></tr>`).join("")+`</tbody>`;
    $$("#mem-tbl [data-mem]").forEach(tr=>tr.onclick=()=>detail(tr.dataset.mem));
  }

  function detail(code){
    const m=A.members.find(x=>x.code===code); if(!m)return;
    $("#detail-hd").textContent = `회원 상세 · ${m.baby}`;
    const f=m.funnel;
    $("#detail").innerHTML = `
      <div class="row" style="gap:8px;flex-wrap:wrap"><span class="chip ${m.seg==='등록형'?'accent':'lav'}">${m.seg}</span>
        <span class="chip gold">🍬 ${m.candy}</span><span class="chip">코드 ${m.code}</span>
        <span class="chip ${m.kid?'mint':'pink'}">${m.kid?('키디 '+m.kid):'키디 미연동'}</span></div>
      <p class="eyebrow" style="margin-top:18px">지인 유입 전환 펀넬</p>
      <div style="margin-top:8px">
        <div class="funnel-step"><span>👀 공유 페이지 조회</span><b>${f.views}</b></div>
        <div class="funnel-step"><span>🛍 선물 버튼 클릭</span><b>${f.giftClicks} <span class="muted">(${Math.round(f.giftClicks/f.views*100)}%)</span></b></div>
        <div class="funnel-step"><span>🎁 선물 완료</span><b>${f.giftsDone} <span class="muted">(${Math.round(f.giftsDone/f.views*100)}%)</span></b></div>
      </div>
      <p class="eyebrow" style="margin-top:18px">참여</p>
      <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><span class="chip">❤️ 하트 ${f.hearts}</span><span class="chip">💬 댓글 ${f.comments}</span><span class="chip">✨ AI ${f.ai}</span></div>
      <div class="note" style="margin-top:18px">세그먼트 <b>${m.seg}</b> — ${m.seg==='등록형'?'레지스트리 전환 유도(선물 알림·공유 독려)':'콘텐츠 리워드로 유지(AI 무료권·연속기록 보너스)'}에 집중</div>`;
  }
})();
