/* 베베박스 2.0 — 공유 목업 스토어 + 유틸 (백엔드 없이 localStorage) */
(function(global){
  const KEY = "bebebox2_state";

  // 사진 대용: 부드러운 그라데이션 + 이모지 SVG (오프라인/무의존)
  function ph(emoji, c1, c2){
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>
      <rect width='640' height='480' fill='url(#g)'/>
      <text x='320' y='270' font-size='190' text-anchor='middle'>${emoji}</text></svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  const DEFAULT = {
    onboarded:false, demo:false,
    profile:{ baby:"콩이", stage:"baby", age:"8개월", role:"엄마",
              avatar:ph("👶","#ffd9c2","#ff9e7a"), cover:ph("🌿","#cde7d8","#7ed3a8"), code:"KONG24" },
    candy:80,
    posts:[
      { id:"p1", img:ph("🍚","#fff0d6","#ffce8a"), cap:"이유식 처음으로 혼자 숟가락 잡은 날! 온통 난리났지만 너무 기특해 🥹", age:"8개월", likes:12, comments:3, t:Date.now()-3600e3*5 },
      { id:"p2", img:ph("🛁","#d6ecff","#8ec5ff"), cap:"목욕 후 뽀송뽀송 콩이. 이 표정 실화냐", age:"8개월", likes:21, comments:5, t:Date.now()-3600e3*30 },
      { id:"p3", img:ph("🧸","#ffe3ef","#ff9ec2"), cap:"첫 애착인형이 생겼어요", age:"7개월", likes:9, comments:1, t:Date.now()-3600e3*72 },
    ],
    // 위시(레지스트리) — 시기/우선순위/대상 + 상태
    wishlist:[
      { id:"w1", em:"🍼", nm:"젖병 세트", pri:"필수", target:"baby", pub:true,  got:true,  giver:"막내이모", msg:"콩이 맛있게 먹자! 이모가 늘 응원해 💕" },
      { id:"w2", em:"🧴", nm:"유아 로션", pri:"필수", target:"baby", pub:true,  got:true,  giver:"할머니",   msg:"보들보들 우리 강아지" },
      { id:"w3", em:"🚗", nm:"카시트",     pri:"필수", target:"baby", pub:true,  got:false },
      { id:"w4", em:"🛏️", nm:"아기 침대",  pri:"권장", target:"baby", pub:true,  got:false },
      { id:"w5", em:"🧦", nm:"유아 양말",  pri:"선택", target:"baby", pub:false, got:false },
      { id:"w6", em:"📚", nm:"초점책",     pri:"권장", target:"baby", pub:true,  got:false },
      { id:"w7", em:"🛒", nm:"유모차",     pri:"필수", target:"baby", pub:true,  got:false },
      { id:"w8", em:"🍽️", nm:"이유식기",  pri:"권장", target:"baby", pub:false, got:false },
    ],
    coupons:[],
    // 운영자용 목업 회원/펀넬
    admin:{
      members:[
        { code:"KONG24", baby:"콩이", kid:"kong_mom", candy:80, coupons:1, published:6, seg:"등록형",
          funnel:{views:142,giftClicks:38,giftsDone:12,hearts:64,comments:9,ai:21} },
        { code:"DAEL01", baby:"다엘", kid:"", candy:240, coupons:2, published:3, seg:"콘텐츠형",
          funnel:{views:88,giftClicks:9,giftsDone:2,hearts:120,comments:14,ai:40} },
        { code:"TAHA77", baby:"태하", kid:"taha_dad", candy:60, coupons:0, published:8, seg:"등록형",
          funnel:{views:210,giftClicks:55,giftsDone:18,hearts:80,comments:22,ai:6} },
      ],
      coupons:[
        { code:"KONG24", baby:"콩이", kid:"kong_mom", amount:3000, ccode:"BEBE7K2A", candy:120, at:Date.now()-86400e3, done:false },
        { code:"DAEL01", baby:"다엘", kid:"",         amount:3000, ccode:"BEBE9M4Z", candy:100, at:Date.now()-3600e3*6, done:false },
        { code:"TAHA77", baby:"태하", kid:"taha_dad", amount:3000, ccode:"BEBE3X1Q", candy:200, at:Date.now()-86400e3*3, done:true },
      ],
    },
  };

  const RULES = { post:20, share:30, gift:50, like:10, mission:100, couponCost:100, couponWon:3000, aiCost:20 };
  const AI_APPS = [
    {slug:"naming", em:"✏️", nm:"태명·이름 짓기", cost:0, sub:"무료"},
    {slug:"temper", em:"🧭", nm:"기질 분석", cost:0, sub:"무료"},
    {slug:"diary",  em:"📔", nm:"AI 그림일기", cost:20, sub:"−20"},
    {slug:"studio", em:"🎨", nm:"컨셉 스튜디오", cost:30, sub:"−30"},
    {slug:"vlog",   em:"🎬", nm:"브이로그 카드", cost:20, sub:"−20"},
    {slug:"future", em:"🔮", nm:"미래 모습", cost:10, sub:"−10"},
  ];

  function load(){
    try{ const s=JSON.parse(localStorage.getItem(KEY)); if(s&&s.profile) return s; }catch(e){}
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
  function reset(){ localStorage.removeItem(KEY); }

  // 유틸
  const $  = (s,r)=> (r||document).querySelector(s);
  const $$ = (s,r)=> [...(r||document).querySelectorAll(s)];
  const won = n => (Number(n)||0).toLocaleString("ko-KR")+"원";
  const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  function toast(msg){
    let t=$("#toast"); if(!t){ t=document.createElement("div"); t.id="toast"; t.className="toast"; document.body.appendChild(t); }
    t.textContent=msg; t.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove("show"),2200);
  }
  function timeago(t){ const m=Math.floor((Date.now()-t)/60000); if(m<60)return m+"분 전"; const h=Math.floor(m/60); if(h<24)return h+"시간 전"; return Math.floor(h/24)+"일 전"; }

  global.BB = { KEY, ph, DEFAULT, RULES, AI_APPS, load, save, reset, $, $$, won, esc, toast, timeago };
})(window);
