/* 베베박스 2.0 — 사용자 앱 로직 */
(function(){
  const {$, $$, esc, won, toast, timeago, RULES, AI_APPS} = BB;
  let S = BB.load();
  const save = ()=> BB.save(S);

  /* ---------- 공통 ---------- */
  function refreshCandy(){ $$(".js-candy").forEach(e=>e.textContent=S.candy); const h=$("#home-candy"); if(h)h.textContent=S.candy; }
  function addCandy(n,why){ S.candy+=n; save(); refreshCandy(); if(why)toast(`${why} · +${n}🍬`); }
  function spendCandy(n){ if(S.candy<n)return false; S.candy-=n; save(); refreshCandy(); return true; }

  function go(view){
    $$(".view").forEach(v=>v.classList.remove("active"));
    $("#v-"+view).classList.add("active");
    const onApp = !["landing","onboard"].includes(view);
    $("#nav").classList.toggle("hidden", !onApp);
    $("#fab-write").classList.toggle("hidden", view!=="diary");
    $$("#nav button").forEach(b=>b.classList.toggle("on", b.dataset.go===view));
    window.scrollTo(0,0);
    if(view==="home")renderHome();
    if(view==="diary")renderDiary();
    if(view==="wish")renderWish();
    if(view==="ai")renderAI();
    if(view==="me")renderMe();
    refreshCandy();
  }

  /* ---------- 시트 ---------- */
  function openSheet(id,html){ const s=$("#"+id); $("#"+id+"-body").innerHTML=html; s.classList.add("open"); }
  function closeSheets(){ $$(".sheet").forEach(s=>s.classList.remove("open")); }
  $$(".sheet [data-close]").forEach(b=>b.onclick=closeSheets);

  /* ---------- 랜딩 / 온보딩 ---------- */
  $("#btn-demo").onclick = ()=>{ S.demo=true; S.onboarded=true; save(); toast("둘러보기 모드 · 콩이네 데모예요"); go("home"); };
  $("#btn-start").onclick = ()=> onboard(0);

  const obSteps = [
    {q:"어떤 역할로 함께하나요?", opts:[["엄마","👩"],["아빠","👨"],["가족·지인","👵"]], key:"role"},
    {q:"아기 이름이나 태명을 알려주세요", input:true, hint:"아직이라면 태명도 좋아요 (예: 콩이)", key:"baby"},
  ];
  let obIdx=0;
  function onboard(i){ obIdx=i; go("onboard"); const st=obSteps[i]; const b=$("#ob-body");
    if(st.opts){
      b.innerHTML = `<p class="eyebrow">시작하기 ${i+1}/${obSteps.length}</p><h2 class="h-l" style="margin:6px 0 18px">${st.q}</h2>`+
        `<div class="stack">`+st.opts.map(o=>`<button class="btn line" data-v="${o[0]}" style="justify-content:flex-start;font-size:16px">${o[1]} ${o[0]}</button>`).join("")+`</div>`;
      $$("#ob-body [data-v]").forEach(btn=>btn.onclick=()=>{ S.profile.role=btn.dataset.v; save(); onboard(i+1); });
    } else {
      b.innerHTML = `<p class="eyebrow">시작하기 ${i+1}/${obSteps.length}</p><h2 class="h-l" style="margin:6px 0 8px">${st.q}</h2>`+
        `<input class="field" id="ob-in" placeholder="${st.hint}" maxlength="12"/>`+
        `<button class="btn line" id="ob-skip" style="margin-top:10px">아직 안 정했어요</button>`+
        `<div style="height:18px"></div><button class="btn primary" id="ob-done">시작하기 →</button>`;
      $("#ob-done").onclick=()=>{ const v=$("#ob-in").value.trim()||"우리 아기"; S.profile.baby=v; S.onboarded=true; save(); toast("환영해요! 🎉"); go("home"); };
      $("#ob-skip").onclick=()=>{ S.profile.baby="우리 아기"; S.onboarded=true; save(); go("home"); };
    }
  }
  $("#ob-back").onclick=()=>{ if(obIdx>0)onboard(obIdx-1); else go("landing"); };

  /* ---------- 홈 ---------- */
  function giftStats(){ const pub=S.wishlist.filter(w=>w.pub); const got=pub.filter(w=>w.got); return {total:pub.length, got:got.length}; }
  function renderHome(){
    $("#home-title").textContent = `${S.profile.baby}의 하루`;
    const gs=giftStats(); const pct=gs.total?Math.round(gs.got/gs.total*100):0;
    const last=S.posts[0];
    const todos = [
      {em:"✍️", b:"오늘 일기 쓰기", s:`기록하면 +${RULES.post}🍬`, go:()=>compose()},
      {em:"📤", b:"가족에게 공유하기", s:`공유하면 +${RULES.share}🍬`, go:()=>doShare()},
      {em:"🎁", b:"받고 싶은 선물 정하기", s:`받을 때마다 +${RULES.gift}🍬`, go:()=>go("wish")},
    ];
    $("#home-body").innerHTML = `
      <div class="card" style="background:linear-gradient(135deg,#fff5ee,#ffe9e0);border-color:#ffded0">
        <div class="between"><div><p class="eyebrow">이렇게 써요</p><b class="h-m">기록하고 · 선물받고 · 캔디로 즐겨요</b></div></div>
        <div class="loop" style="margin-top:12px">
          <div class="step" data-loop="diary"><div class="ic">✍️</div><div class="lb">일기</div><div class="rw">+${RULES.post}</div></div>
          <span class="arrow">›</span>
          <div class="step"><div class="ic">❤️</div><div class="lb">공감</div><div class="rw">+${RULES.like}</div></div>
          <span class="arrow">›</span>
          <div class="step" data-loop="wish"><div class="ic">🎁</div><div class="lb">선물</div><div class="rw">+${RULES.gift}</div></div>
          <span class="arrow">›</span>
          <div class="step"><div class="ic">🍬</div><div class="lb">캔디</div></div>
          <span class="arrow">›</span>
          <div class="step use" data-loop="ai"><div class="ic">✨</div><div class="lb">AI·선물권</div></div>
        </div>
      </div>

      <div class="sec-title"><h2>오늘 할 일</h2></div>
      <div class="stack" id="home-todos">
        ${todos.map((t,i)=>`<div class="todo" data-todo="${i}"><div class="em">${t.em}</div><div class="tx"><b>${t.b}</b><span>${t.s}</span></div><div class="go">›</div></div>`).join("")}
      </div>

      <div class="sec-title"><h2>받고 싶은 선물</h2><a data-go="wish">관리 ›</a></div>
      <div class="card pad-s" data-go="wish" style="cursor:pointer">
        <div class="between"><b>🎁 ${gs.got}/${gs.total}개 도착</b><span class="muted">${pct}%</span></div>
        <div class="bar" style="margin-top:10px"><i style="width:${pct}%"></i></div>
        <p class="muted" style="margin-top:8px">선물 1개 받을 때마다 +${RULES.gift}🍬 · 탭해서 관리</p>
      </div>

      ${last?`<div class="sec-title"><h2>최근 일기</h2><a data-go="diary">전체 ›</a></div>
      <div class="post" data-go="diary" style="cursor:pointer"><img class="ph" src="${last.img}"/><div class="bd"><p class="cap">${esc(last.cap)}</p><div class="act"><span>♥ <b>${last.likes}</b></span><span>💬 <b>${last.comments}</b></span></div></div></div>`:""}
    `;
    $$("#home-body [data-todo]").forEach(el=>el.onclick=()=>todos[+el.dataset.todo].go());
    $$("#home-body [data-loop]").forEach(el=>el.onclick=()=>go(el.dataset.loop));
    $$("#home-body [data-go]").forEach(el=>el.onclick=()=>go(el.dataset.go));
  }

  /* ---------- 일기 ---------- */
  function renderDiary(){
    $("#feed-list").innerHTML = S.posts.map(p=>`
      <article class="post">
        <img class="ph" src="${p.img}"/>
        <div class="bd">
          <div class="meta"><img class="av" src="${S.profile.avatar}"/><div><b>${esc(S.profile.baby)}</b> <span>· ${p.age} · ${timeago(p.t)}</span></div></div>
          <p class="cap">${esc(p.cap)}</p>
          <div class="act"><span data-like="${p.id}">♥ <b>${p.likes}</b></span><span>💬 <b>${p.comments}</b></span></div>
        </div>
      </article>`).join("") || `<div class="card center" style="padding:40px 18px"><div style="font-size:40px">📔</div><b class="h-m" style="display:block;margin:10px 0 4px">첫 일기를 남겨보세요</b><p class="sub">오늘의 ${esc(S.profile.baby)} 순간을 기록하면 +${RULES.post}🍬</p><button class="btn primary" id="empty-write" style="margin-top:16px">✏️ 기록하기</button></div>`;
    const ew=$("#empty-write"); if(ew)ew.onclick=compose;
    $$("#feed-list [data-like]").forEach(el=>el.onclick=()=>{ const p=S.posts.find(x=>x.id===el.dataset.like); p.likes++; save(); renderDiary(); });
  }
  function compose(){
    openSheet("sheet-compose", `<div class="handle"></div><h3>오늘의 기록</h3>
      <label class="lbl">사진 (데모는 자동 첨부)</label>
      <div style="display:flex;gap:8px;margin-top:8px">${["🍚","🛁","🧸","🌳","🎈"].map((e,i)=>`<button class="iconbtn" data-em="${e}" style="background:var(--accent-soft);font-size:22px">${e}</button>`).join("")}</div>
      <label class="lbl">한 줄 기록</label>
      <textarea class="field" id="cmp-text" rows="3" placeholder="오늘 ${esc(S.profile.baby)}는 어땠나요?"></textarea>
      <button class="btn primary" id="cmp-save" style="margin-top:16px">올리기 · +${RULES.post}🍬</button>`);
    let em="🍚"; $$("#sheet-compose-body [data-em]").forEach(b=>b.onclick=()=>{em=b.dataset.em; $$("#sheet-compose-body [data-em]").forEach(x=>x.style.outline="none"); b.style.outline="2px solid var(--accent)";});
    $("#cmp-save").onclick=()=>{ const t=$("#cmp-text").value.trim()||"오늘도 사랑스러운 하루 💕";
      const colors={"🍚":["#fff0d6","#ffce8a"],"🛁":["#d6ecff","#8ec5ff"],"🧸":["#ffe3ef","#ff9ec2"],"🌳":["#dff3e3","#8ed99e"],"🎈":["#ffe6e0","#ff9e8f"]}[em];
      S.posts.unshift({id:"p"+Date.now(),img:BB.ph(em,colors[0],colors[1]),cap:t,age:S.profile.age,likes:0,comments:0,t:Date.now()});
      save(); closeSheets(); addCandy(RULES.post,"일기 작성"); go("diary"); };
  }

  /* ---------- 위시 · 선반 ---------- */
  function renderWish(){
    const got=S.wishlist.filter(w=>w.got);
    const gs=giftStats(); const pct=gs.total?Math.round(gs.got/gs.total*100):0;
    const shelf = got.length
      ? `<div class="shelf"><div class="row">${got.slice(0,4).map(w=>`<div class="it" data-gift="${w.id}"><span class="giver">${esc(w.giver||"선물")}</span><span class="obj">${w.em}</span></div>`).join("")}</div><div class="board"></div></div>`
      : `<div class="shelf"><div class="empty">아직 받은 선물이 없어요<br/>위시를 공개하고 가족에게 공유해 보세요</div><div class="board"></div></div>`;
    const priCls={"필수":"req","권장":"rec","선택":"opt"};
    $("#wish-body").innerHTML = `
      <div class="sec-title"><h2>🎁 받은 선물 선반</h2><span class="muted">탭하면 인사말</span></div>
      ${shelf}
      <div class="card pad-s" style="margin-top:14px">
        <div class="between"><b>받고 싶은 선물 ${gs.got}/${gs.total}개 도착</b><span class="muted">${pct}%</span></div>
        <div class="bar" style="margin-top:10px"><i style="width:${pct}%"></i></div>
      </div>
      <div class="sec-title"><h2>위시리스트</h2><span class="muted">탭해서 설정</span></div>
      <div class="grid3">
        ${S.wishlist.map(w=>{
          const st = w.got?`<span class="st got">🎁 받음</span>`:w.pub?`<span class="st pub">공개중</span>`:`<span class="st need">비공개</span>`;
          return `<button class="wish ${w.got?'got':''}" data-wish="${w.id}">
            <span class="pri"><span class="badge ${priCls[w.pri]}">${w.pri}</span></span>
            ${w.got?`<span class="corner">🎁</span>`:w.pub?`<span class="corner">❤️</span>`:""}
            <span class="em">${w.em}</span><span class="nm">${esc(w.nm)}</span>${st}</button>`;
        }).join("")}
      </div>
      <div class="note" style="margin-top:14px">👆 카드를 탭하면 공개·받음·인사말·상품을 한 곳에서 설정해요</div>`;
    $$("#wish-body [data-wish]").forEach(b=>b.onclick=()=>wishSheet(b.dataset.wish));
    $$("#wish-body [data-gift]").forEach(b=>b.onclick=()=>giftSheet(b.dataset.gift));
  }
  function wishSheet(id){
    const w=S.wishlist.find(x=>x.id===id); if(!w)return;
    const msg = w.got&&w.msg ? `<div class="note" style="margin-bottom:12px">💌 <b>${esc(w.giver||"준 분")}</b>: ${esc(w.msg)}</div>`:"";
    openSheet("sheet-wish", `<div class="handle"></div>
      <div class="center"><div style="font-size:40px">${w.em}</div><h3>${esc(w.nm)}</h3><p class="muted">${w.pri} · ${w.target==="mom"?"엄마":"아기"}</p></div>
      <div style="height:14px"></div>${msg}
      <div class="stack">
        <button class="btn ${w.pub?'ghost':'primary'}" data-act="pub">${w.pub?"🙈 공개 취소":"❤️ 공유 위시에 공개"}</button>
        <button class="btn line" data-act="recv">🎁 ${w.got?"선물 인사말 수정":"받았어요 · 준 사람·인사말"}</button>
        <button class="btn line" data-act="prod">🛍 상품 고르기 <span class="stub">데모</span></button>
        ${w.got?`<button class="btn line" data-act="unrecv">↩️ 받음 취소</button>`:""}
      </div>`);
    $("#sheet-wish-body [data-act='pub']").onclick=()=>{ w.pub=!w.pub; save(); closeSheets(); renderWish(); toast(w.pub?"공유 위시에 공개했어요 ❤️":"공개를 내렸어요"); };
    $("#sheet-wish-body [data-act='recv']").onclick=()=>recvForm(w);
    $("#sheet-wish-body [data-act='prod']").onclick=()=>toast("실제 키디키디 상품 연동은 배포 시 키 연결 (데모)");
    const un=$("#sheet-wish-body [data-act='unrecv']"); if(un)un.onclick=()=>{ w.got=false; w.giver=""; w.msg=""; save(); closeSheets(); renderWish(); toast("받음 표시를 취소했어요"); };
  }
  function recvForm(w){
    openSheet("sheet-wish", `<div class="handle"></div><h3>🎁 선물 받았어요</h3>
      <label class="lbl">누가 선물해 줬나요?</label><input class="field" id="rf-giver" placeholder="예: 막내이모" maxlength="16" value="${esc(w.giver||"")}"/>
      <label class="lbl">남긴 인사말 (선택)</label><textarea class="field" id="rf-msg" rows="2" placeholder="예: 콩이 건강하게 자라렴 💕">${esc(w.msg||"")}</textarea>
      <button class="btn primary" id="rf-save" style="margin-top:16px">선반에 올리기</button>`);
    $("#rf-save").onclick=()=>{ const g=$("#rf-giver").value.trim(); if(!g){toast("준 사람을 적어주세요");return;}
      const was=w.got; w.got=true; w.pub=true; w.giver=g; w.msg=$("#rf-msg").value.trim();
      save(); closeSheets(); renderWish(); if(!was)addCandy(RULES.gift,`${g}님 선물 기록`); else toast("인사말을 저장했어요"); };
  }
  function giftSheet(id){
    const w=S.wishlist.find(x=>x.id===id); if(!w)return;
    openSheet("sheet-gift", `<div class="handle"></div><div style="font-size:46px">${w.em}</div>
      <h3 style="margin-top:6px">${esc(w.nm)}</h3>
      <p style="font-size:15px;color:var(--ink);line-height:1.6;margin:12px 18px">${esc(w.msg||"따뜻한 마음을 담아 선물해 주셨어요 💝")}</p>
      <p class="chip pink" style="display:inline-block">${esc(w.giver||"가족")}님이 선물해 줬어요</p>
      <button class="btn ghost" data-close style="margin-top:18px">닫기</button>`);
    $$("#sheet-gift-body [data-close]").forEach(b=>b.onclick=closeSheets);
  }

  /* ---------- AI 스튜디오 ---------- */
  const AI_RESULT = {
    naming:["콩이 · 단단하고 야무진 아이", "여울 · 맑게 흐르는 시냇물처럼", "하랑 · 하늘처럼 큰 사람"],
    temper:["호기심 대장형 🔭 — 새로운 자극을 즐기고 반응이 빨라요. 충분한 탐색 시간을 주세요."],
    diary:["오늘 콩이는 작은 손으로 세상을 처음 만졌다. 그 떨림이 우리에게도 번졌다."],
    studio:["🎨 '봄날의 아기천사' 컨셉 카드가 완성됐어요 (데모 이미지)"],
    vlog:["🎬 콩이의 8개월 하이라이트 30초 카드 (데모)"],
    future:["🔮 20년 뒤 콩이: 따뜻한 리더. 사람을 모으는 힘이 있어요."],
  };
  function renderAI(){
    $("#ai-body").innerHTML = `
      <div class="card" style="background:linear-gradient(135deg,#f0ecff,#e8f7f0);border-color:#e3d9ff">
        <b class="h-m">✨ AI로 우리 아이를 더 알아가요</b>
        <p class="sub" style="margin-top:6px">결과는 일기에 담고 카톡으로 공유할 수 있어요. <b>첫 결과는 무료!</b></p>
      </div>
      <div class="grid3" style="margin-top:14px;grid-template-columns:repeat(2,1fr)">
        ${AI_APPS.map(a=>`<button class="tile" data-ai="${a.slug}" style="text-align:left">
          <div style="font-size:26px">${a.em}</div>
          <b style="display:block;font-size:14px;margin-top:8px">${a.nm}</b>
          <span class="chip ${a.cost?'gold':'mint'}" style="margin-top:8px">${a.cost?('−'+a.cost+'🍬'):'무료'}</span>
        </button>`).join("")}
      </div>
      <div class="note" style="margin-top:14px">실제 생성 AI(작명·그림·영상)는 배포 시 키 연결 — 지금은 데모 결과예요 <span class="stub">stub</span></div>`;
    $$("#ai-body [data-ai]").forEach(b=>b.onclick=()=>runAI(b.dataset.ai));
  }
  function runAI(slug){
    const app=AI_APPS.find(a=>a.slug===slug);
    const free = !localStorage.getItem("bb2_ai_free");
    if(app.cost>0 && !free && !spendCandy(app.cost)){ toast(`캔디가 부족해요 (필요 ${app.cost}🍬)`); return; }
    if(app.cost>0 && free){ localStorage.setItem("bb2_ai_free","1"); }
    const out = (AI_RESULT[slug]||["완성됐어요!"]);
    const txt = out[Math.floor(Math.random()*out.length)];
    openSheet("sheet-ai", `<div class="handle"></div><div style="font-size:44px">${app.em}</div>
      <h3 style="margin-top:6px">${app.nm}</h3>
      ${app.cost>0&&free?`<p class="chip mint" style="display:inline-block;margin-top:6px">첫 결과 무료 🎁</p>`:""}
      <p style="font-size:15px;line-height:1.7;color:var(--ink);margin:16px 14px">${esc(txt)}</p>
      <div class="stack" style="margin-top:8px">
        <button class="btn primary" id="ai-share">📤 일기에 담고 공유 · +${RULES.share}🍬</button>
        <button class="btn ghost" data-close>닫기</button>
      </div>`);
    $("#sheet-ai-body [data-close]").onclick=closeSheets;
    $("#ai-share").onclick=()=>{ closeSheets(); addCandy(RULES.share,"AI 결과 공유"); };
    refreshCandy();
  }

  /* ---------- 내정보 / 지갑 ---------- */
  function renderMe(){
    const canEx = S.candy>=RULES.couponCost;
    $("#me-body").innerHTML = `
      <div class="card center">
        <img src="${S.profile.avatar}" style="width:72px;height:72px;border-radius:50%;margin:0 auto;border:3px solid #fff;box-shadow:var(--sh-m)"/>
        <b class="h-l" style="display:block;margin-top:10px">${esc(S.profile.baby)}</b>
        <p class="muted">${S.profile.role} · 가족코드 ${S.profile.code}</p>
      </div>
      <div class="card" style="margin-top:14px;background:linear-gradient(135deg,#fff4dc,#ffe9c2);border-color:#ffe0a8">
        <div class="between"><span class="muted">내 캔디</span></div>
        <b style="font-size:34px;font-weight:800;color:#9a6b07">🍬 ${S.candy}</b>
        <div class="bar" style="margin-top:12px"><i style="width:${Math.min(100,S.candy/RULES.couponCost*100)}%;background:linear-gradient(90deg,#ffd479,#f0a818)"></i></div>
        <p class="muted" style="margin-top:8px">${canEx?"지금 상품권으로 바꿀 수 있어요! 🎉":`상품권까지 ${RULES.couponCost-S.candy}🍬`}</p>
        <button class="btn ${canEx?'primary':'ghost'}" id="ex-btn" style="margin-top:12px" ${canEx?"":"disabled"}>🎟️ ${RULES.couponCost}🍬 → ${won(RULES.couponWon)} 상품권 받기</button>
      </div>
      ${S.coupons.length?`<div class="sec-title"><h2>내 쿠폰</h2></div>${S.coupons.map(c=>`<div class="tile between" style="margin-bottom:8px"><div><b>${won(c.amount)} 키디 상품권</b><br/><span class="muted">코드 ${c.code}</span></div><span class="chip gold">발급대기</span></div>`).join("")}`:""}
      <div class="sec-title"><h2>캔디 모으는 법</h2></div>
      <div class="card flat gap-s">
        ${[["✍️ 일기 쓰기",`+${RULES.post}`],["📤 공유하기",`+${RULES.share}`],["🎁 선물 받기",`+${RULES.gift}`],["❤️ 좋아요 모으기",`+${RULES.like}`],["🧩 오늘의 미션",`+${RULES.mission}`]].map(r=>`<div class="between"><span>${r[0]}</span><b class="chip gold">${r[1]}🍬</b></div>`).join("")}
      </div>
      <button class="btn line" id="me-reset" style="margin-top:18px">🔄 데모 초기화</button>
      <p class="muted center" style="margin-top:14px">베베박스 2.0 · 데모(목업) 빌드</p>`;
    const ex=$("#ex-btn"); if(ex&&canEx)ex.onclick=()=>{ S.candy-=RULES.couponCost; S.coupons.unshift({amount:RULES.couponWon,code:"BEBE"+Math.random().toString(36).slice(2,8).toUpperCase()}); save(); renderMe(); refreshCandy(); toast("상품권으로 교환했어요! 🎟️"); };
    $("#me-reset").onclick=()=>{ BB.reset(); localStorage.removeItem("bb2_ai_free"); S=BB.load(); toast("데모를 초기화했어요"); go("landing"); };
  }

  /* ---------- 공유 ---------- */
  function doShare(){
    const url = location.origin + location.pathname.replace(/index\.html$/,"") + "share.html?code="+S.profile.code;
    if(navigator.share){ navigator.share({title:`${S.profile.baby}의 하루`, text:`${S.profile.baby}에게 선물하고 함께 키워요 🎁`, url}).then(()=>addCandy(RULES.share,"공유")).catch(()=>{}); }
    else { navigator.clipboard?.writeText(url); toast("공유 링크를 복사했어요 · +"+RULES.share+"🍬"); addCandy(RULES.share); }
  }
  $("#btn-share-home").onclick=doShare;

  /* ---------- 네비/부팅 ---------- */
  $$("#nav button").forEach(b=>b.onclick=()=>go(b.dataset.go));
  $("#fab-write").onclick=compose;
  refreshCandy();
  go(S.onboarded ? "home" : "landing");
})();
