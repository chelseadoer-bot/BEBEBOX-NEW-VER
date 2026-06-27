/* 베베박스 2.0 — 공유(지인) 페이지 */
(function(){
  const {$, $$, esc, won, toast, timeago, RULES} = BB;
  const S = BB.load();
  const P = S.profile;

  $("#s-cover").src = P.cover;
  $("#s-av").src = P.avatar;
  $("#s-name").textContent = `${P.baby}의 하루`;
  $("#s-age").textContent = `${P.age} · 성장 기록 중 👶`;
  document.title = `${P.baby}의 하루 · 베베박스`;

  // 피드(읽기 전용)
  $("#s-feed").innerHTML = S.posts.map(p=>`
    <article class="post">
      <img class="ph" src="${p.img}"/>
      <div class="bd">
        <div class="meta"><img class="av" src="${P.avatar}"/><div><b>${esc(P.baby)}</b> <span>· ${p.age} · ${timeago(p.t)}</span></div></div>
        <p class="cap">${esc(p.cap)}</p>
        <div class="act"><span data-like="${p.id}">♥ <b>${p.likes}</b></span><span>💬 <b>${p.comments}</b></span></div>
      </div>
    </article>`).join("");
  $$("#s-feed [data-like]").forEach(el=>el.onclick=()=>{ const b=el.querySelector("b"); b.textContent=+b.textContent+1; toast("공감을 남겼어요 ❤️"); });

  // 선물 오버레이
  function openSheet(id,html){ $("#"+id.replace("-sheet","")+"-body").innerHTML=html; $("#"+id).classList.add("open"); }
  function closeSheets(){ $$(".sheet").forEach(s=>s.classList.remove("open")); }
  $$(".sheet [data-close]").forEach(b=>b.onclick=closeSheets);

  function giftStats(){ const pub=S.wishlist.filter(w=>w.pub); return {total:pub.length, got:pub.filter(w=>w.got).length}; }
  // 부담없는 가격대 칩 (큐레이션)
  const PRICE = {"필수":["2~3만","3~5만"],"권장":["1~2만","2~4만"],"선택":["1만 이하","1~2만"]};

  function renderGift(){
    const pub = S.wishlist.filter(w=>w.pub);
    const got = pub.filter(w=>w.got);
    const need = pub.filter(w=>!w.got);
    const gs=giftStats(); const pct=gs.total?Math.round(gs.got/gs.total*100):0;
    const shelf = got.length
      ? `<div class="shelf" style="margin:6px 0 14px"><div class="row">${got.slice(0,4).map(w=>`<div class="it"><span class="giver">${esc(w.giver||"가족")}</span><span class="obj">${w.em}</span></div>`).join("")}</div><div class="board"></div></div>` : "";
    openSheet("gift-sheet", `<div class="handle"></div>
      <h3>${esc(P.baby)}에게 선물하기</h3>
      <p class="muted center" style="margin-bottom:12px">부담 갖지 마세요 — 작은 마음도 큰 힘이 돼요 💝</p>
      <a class="card between" href="#" id="g-plan" style="background:linear-gradient(135deg,#fff4ec,#ffe6da);border-color:#ffd9c6;margin-bottom:12px">
        <div><span class="chip accent">BEST</span><b style="display:block;margin-top:6px">추천 선물 한 번에 보기</b><span class="muted">키디키디 베이비 기획전 <span class="stub">데모</span></span></div><span style="font-size:22px">🎁</span></a>
      ${got.length?`<p class="eyebrow">받은 선물 선반</p>${shelf}`:""}
      <div class="card pad-s" style="margin-bottom:14px"><div class="between"><b>🎁 ${gs.got}/${gs.total}개 채워졌어요</b><span class="muted">${pct}%</span></div><div class="bar" style="margin-top:8px"><i style="width:${pct}%"></i></div></div>
      <p class="eyebrow">받고 싶어요</p>
      <div class="stack" style="margin-top:8px">
        ${need.map(w=>`<div class="tile between" data-give="${w.id}" style="cursor:pointer">
          <div class="row"><span style="font-size:26px">${w.em}</span><div><b>${esc(w.nm)}</b><br/><span class="muted">${w.pri} · 가격대 ${PRICE[w.pri][0]}~${PRICE[w.pri][1]}원대</span></div></div>
          <span class="btn primary sm">선물</span></div>`).join("") || `<p class="muted center" style="padding:14px">받고 싶은 선물이 곧 등록돼요</p>`}
      </div>`);
    $("#g-plan").onclick=(e)=>{e.preventDefault(); toast("실제 기획전 링크는 배포 시 연결 (데모)");};
    $$("#gift-body [data-give]").forEach(b=>b.onclick=()=>flow(b.dataset.give));
  }

  function flow(id){
    const w=S.wishlist.find(x=>x.id===id); if(!w)return;
    openSheet("flow-sheet", `<div class="handle"></div>
      <div class="center"><div style="font-size:42px">${w.em}</div><h3>${esc(w.nm)}</h3></div>
      <label class="lbl">관계</label>
      <div class="chip-row" id="f-rel" style="margin-top:8px">${["이모","고모","삼촌","할머니","할아버지","친구","지인"].map((r,i)=>`<button class="chip ${i===0?'on':''}" data-rel="${r}">${r}</button>`).join("")}</div>
      <label class="lbl">이름 (선택)</label><input class="field" id="f-name" placeholder="예: 막내이모" maxlength="16"/>
      <label class="lbl">축하 한마디 💌</label><textarea class="field" id="f-msg" rows="2" placeholder="${esc(P.baby)}에게 따뜻한 한마디를 남겨주세요"></textarea>
      <div class="note" style="margin-top:12px">‘선물 완료’를 누르면 ${esc(P.baby)}의 <b>받은 선물 선반</b>에 인사말과 함께 올라가요. <span class="stub">결제는 데모</span></div>
      <button class="btn primary" id="f-done" style="margin-top:14px">🎁 선물 완료하고 한마디 남기기</button>`);
    let rel="이모"; $$("#flow-body [data-rel]").forEach(b=>b.onclick=()=>{ rel=b.dataset.rel; $$("#flow-body [data-rel]").forEach(x=>x.classList.remove("on")); b.classList.add("on"); });
    $("#f-done").onclick=()=>{
      const nm=$("#f-name").value.trim()||rel; const msg=$("#f-msg").value.trim();
      w.got=true; w.giver=nm; w.msg=msg||`${P.baby} 건강하게 자라렴 💕`; BB.save(S);
      closeSheets(); confetti(); toast("선물 완료! 선반에 올라갔어요 🎁");
      setTimeout(renderGift, 600);
    };
  }

  $("#s-fab").onclick=renderGift;

  /* 컨페티 */
  function confetti(){
    const cv=$("#confetti"); if(!cv)return; const ctx=cv.getContext("2d");
    cv.width=innerWidth; cv.height=innerHeight; const cols=["#ff7a51","#ffd166","#ff5d8f","#2fae84","#8ec5ff","#7b61ff"];
    let parts=[]; for(let i=0;i<130;i++)parts.push({x:cv.width/2,y:cv.height*0.4,vx:(Math.random()-.5)*13,vy:Math.random()*-14-3,g:.32+Math.random()*.2,s:6+Math.random()*6,c:cols[i%cols.length],r:Math.random()*6});
    let f=0; (function loop(){ f++; ctx.clearRect(0,0,cv.width,cv.height); parts.forEach(p=>{p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.r+=.2;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);ctx.restore();}); if(f<90)requestAnimationFrame(loop); else ctx.clearRect(0,0,cv.width,cv.height); })();
  }
})();
