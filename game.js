
const S={seven:"images/symbols/seven.png",bar:"images/symbols/bar.png",bell:"images/symbols/bell.png",cherry:"images/symbols/cherry.png",watermelon:"images/symbols/watermelon.png",replay:"images/symbols/replay.png"};
const R={
 left:[
   "seven","replay","bell","watermelon","replay","cherry","bell",
   "replay","bar","bell","watermelon","replay","bell","cherry",
   "replay","seven","bell","replay","watermelon","bell","replay"
 ],
 center:[
   "replay","seven","watermelon","bell","replay","bar","bell",
   "replay","watermelon","bell","replay","seven","bell","replay",
   "watermelon","bar","bell","replay","bell","watermelon","replay"
 ],
 right:[
   "watermelon","replay","seven","bell","replay","watermelon","bell",
   "bar","replay","bell","watermelon","replay","bell","seven",
   "replay","watermelon","bell","bar","replay","bell","replay"
 ]
};
const E=id=>document.getElementById(id),H=()=>innerWidth<=650?80:110;

window.addEventListener("error",e=>{
 const b=document.getElementById("runtimeError");
 if(b){b.style.display="block";b.textContent=`ERROR: ${e.message} (${e.lineno||"?"})`;}
});


let soundOn=true,audioCtx=null,currentBgm=null,bigBgmIndex=0,masterVolume=.65;
let reelMotorNodes=null;

function safeAudioContext(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return null;
    if(!audioCtx)audioCtx=new AC();
    if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});
    return audioCtx;
  }catch(e){
    console.warn("AudioContext unavailable:",e);
    return null;
  }
}
function tone(freq,d=.06,vol=.035,type="square",delay=0){
  if(!soundOn)return;
  try{
    const c=safeAudioContext();
    if(!c)return;
    const o=c.createOscillator(),g=c.createGain(),s=c.currentTime+delay;
    o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(Math.max(.0001,vol*masterVolume),s);
    g.gain.exponentialRampToValueAtTime(.0001,s+d);
    o.connect(g);g.connect(c.destination);o.start(s);o.stop(s+d);
  }catch(e){console.warn("SE skipped:",e);}
}

function noiseBurst(d=.06,vol=.025,filterFreq=1200){
 if(!soundOn)return;
 try{
   const c=safeAudioContext(); if(!c)return;
   const len=Math.max(1,Math.floor(c.sampleRate*d));
   const buf=c.createBuffer(1,len,c.sampleRate);
   const data=buf.getChannelData(0);
   for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);
   const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
   src.buffer=buf;f.type="bandpass";f.frequency.value=filterFreq;f.Q.value=.8;
   g.gain.value=vol*masterVolume;
   src.connect(f);f.connect(g);g.connect(c.destination);src.start();
 }catch(e){console.warn("noise SE skipped:",e);}
}
function startReelMotor(){
 if(!soundOn || reelMotorNodes)return;
 try{
   const c=safeAudioContext(); if(!c)return;
   const osc=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
   osc.type="sawtooth";osc.frequency.value=92;
   f.type="lowpass";f.frequency.value=520;
   g.gain.value=.016*masterVolume;
   osc.connect(f);f.connect(g);g.connect(c.destination);osc.start();
   reelMotorNodes={osc,g,f};
 }catch(e){console.warn("motor SE skipped:",e);}
}
function stopReelMotor(){
 try{
   if(reelMotorNodes){
     const c=safeAudioContext();
     reelMotorNodes.g.gain.setTargetAtTime(.0001,c.currentTime,.025);
     setTimeout(()=>{try{reelMotorNodes.osc.stop()}catch(e){} reelMotorNodes=null;},90);
   }
 }catch(e){reelMotorNodes=null;}
}

function playFileSE(id,rate=1,vol=1){
 if(!soundOn)return;
 try{
   const base=E(id); if(!base)return;
   const a=base.cloneNode(true);
   a.volume=Math.max(0,Math.min(1,masterVolume*vol));
   a.playbackRate=rate;
   const pr=a.play();
   if(pr&&pr.catch)pr.catch(()=>{});
 }catch(e){console.warn("file SE skipped:",e);}
}
const SE={
 bet(){
   tone(190,.045,.075,"square");
   tone(285,.05,.055,"square",.035);
   noiseBurst(.045,.035,1700);
 },
 lever(){
   playFileSE("seLeverFile",1,1);
 },
 stop(n){
   playFileSE("seStopFile",1+(n-1)*.018,1);
 },
 bell(){
   playFileSE("seBellFile",1,1);
 },
 replay(){
   playFileSE("seReplayFile",1,1);
 },
 rare(){
   tone(250,.065,.07,"sawtooth");
   tone(700,.08,.055,"square",.06);
   noiseBurst(.06,.03,1400);
 },
 chance(){
   [320,520,760,1040].forEach((f,i)=>tone(f,.075,.055,"square",i*.045));
 },
 bonus(){
   [392,523,659,784].forEach((f,i)=>tone(f,.13,.07,"triangle",i*.08));
 }
};
function stopBgm(){
  try{
    if(currentBgm){currentBgm.pause();currentBgm.currentTime=0;}
  }catch(e){console.warn("BGM stop skipped:",e);}
  currentBgm=null;
}
function playBgm(id){
  if(!soundOn)return;
  try{
    stopBgm();
    const a=E(id);
    if(!a)return;
    a.volume=masterVolume;a.loop=true;a.currentTime=0;
    const promise=a.play();
    if(promise&&typeof promise.catch==="function"){
      promise.catch(e=>console.warn("BGM play blocked:",e));
    }
    currentBgm=a;
  }catch(e){
    console.warn("BGM skipped:",e);
    currentBgm=null;
  }
}
function startBonusBgm(type){
  try{
    if(type==="REG"){playBgm("bgmBar");return;}
    const ids=["bgmBig1","bgmBig2","bgmBig3"];
    playBgm(ids[bigBgmIndex%ids.length]);
    bigBgmIndex++;
  }catch(e){console.warn("Bonus BGM skipped:",e);}
}

let credit=50,bet=0,pay=0,game=0,spinning=false,waiting=false,order=0,currentRole="MISS";
let off={left:0,center:0,right:0},timer={},stopped={left:true,center:true,right:true};
let stopHit={left:false,center:false,right:false};
 missPlan=currentRole==="MISS"?chooseLegalMissCenters():null;
let missPlan=null;
let replayReady=false;
let bonusStock=null;      // BIG / REG: internal bonus carried until aligned
let bonusMode=null;       // BIG / REG currently paying out
let bonusTotal=0;
let bonusTarget=0;
let lastSpinStart=0;
let refillCount=0;

const SETTING=6;
const BET_PER_GAME=3;
const CREDIT_MAX=50;
const ASSIST_COMA=5;
const REEL_WAIT_MS=4100;

const P={
  BIG:1/220,
  REG:1/260,
  WEAK_CHERRY:1/55,
  STRONG_CHERRY:1/320,
  WATERMELON:1/75,
  CHANCE:1/140,
  BELL:1/6.2,
  REPLAY:1/7.3
};
const BONUS_RATE={
  WEAK_CHERRY:.03,
  STRONG_CHERRY:.45,
  WATERMELON:.08,
  CHANCE:.22
};

function drawRole(){
 if(bonusStock) return bonusStock==="BIG"?"BIG_ALIGN":"REG_ALIGN";
 if(bonusMode) return Math.random()<.76?"BELL":(Math.random()<.55?"REPLAY":"MISS");

 const r=Math.random();
 let c=0;
 const roles=[
   ["STRONG_CHERRY",P.STRONG_CHERRY],
   ["CHANCE",P.CHANCE],
   ["WATERMELON",P.WATERMELON],
   ["WEAK_CHERRY",P.WEAK_CHERRY],
   ["BELL",P.BELL],
   ["REPLAY",P.REPLAY]
 ];
 for(const [role,prob] of roles){
   c+=prob;
   if(r<c){
     if(BONUS_RATE[role] && Math.random()<BONUS_RATE[role]){
       bonusStock=Math.random()<.56?"BIG":"REG";
     }
     return role;
   }
 }
 if(Math.random()<P.BIG){bonusStock="BIG";return "MISS";}
 if(Math.random()<P.REG){bonusStock="REG";return "MISS";}
 return "MISS";
}

function build(k){
 const strip=E(k+"Strip"),seq=[...R[k],...R[k],...R[k]];
 strip.innerHTML=seq.map(x=>`<div class="symbol symbol-${x}"><img src="${S[x]}" alt="${x}"></div>`).join("");
 off[k]=R[k].length*H();
 strip.style.transform=`translateY(-${off[k]}px)`;
}
["left","center","right"].forEach(build);

function sync(){
 E("credit").textContent=credit;
 E("bet").textContent=bet;
 E("pay").textContent=pay;
 E("game").textContent=game;

 const needBet=!replayReady && bet!==BET_PER_GAME;
 E("betBtn").disabled=spinning||waiting||!needBet;
 E("leverBtn").disabled=spinning||waiting||bet!==BET_PER_GAME;

 if(replayReady && !spinning && !waiting && bet!==BET_PER_GAME){
   bet=BET_PER_GAME;
   E("bet").textContent=bet;
   E("leverBtn").disabled=false;
 }
}
function ensureCredit(){
 if(credit>=BET_PER_GAME)return false;
 credit=CREDIT_MAX;
 refillCount++;
 E("status").textContent=`CREDIT自動補充 → ${CREDIT_MAX}枚`;
 return true;
}
function awardCoins(n){
 const room=Math.max(0,CREDIT_MAX-credit);
 const toCredit=Math.min(room,n);
 credit+=toCredit;
 const overflow=n-toCredit;
 if(overflow>0)pay+=overflow;
 return {toCredit,overflow};
}
function roleSymbol(role){
 return {
  BIG_ALIGN:"seven",REG_ALIGN:"bar",
  BELL:"bell",REPLAY:"replay",WATERMELON:"watermelon",
  WEAK_CHERRY:"cherry",STRONG_CHERRY:"cherry"
 }[role]||null;
}
function norm(v,n){return ((v%n)+n)%n}

function visibleTriplet(k,centerIdx){
 const arr=R[k],n=arr.length;
 return {
   top:arr[norm(centerIdx-1,n)],
   middle:arr[norm(centerIdx,n)],
   bottom:arr[norm(centerIdx+1,n)]
 };
}
function isWinningSymbolTriplet(a,b,c){
 return (a==="bell"&&b==="bell"&&c==="bell") ||
        (a==="replay"&&b==="replay"&&c==="replay") ||
        (a==="watermelon"&&b==="watermelon"&&c==="watermelon") ||
        (a==="seven"&&b==="seven"&&c==="seven") ||
        (a==="bar"&&b==="bar"&&c==="bar");
}
function accidentalHit(leftIdx,centerIdx,rightIdx){
 const L=visibleTriplet("left",leftIdx),C=visibleTriplet("center",centerIdx),Rr=visibleTriplet("right",rightIdx);

 // Standard 5 lines: top, middle, bottom, diagonal down, diagonal up.
 const lines=[
   [L.top,C.top,Rr.top],
   [L.middle,C.middle,Rr.middle],
   [L.bottom,C.bottom,Rr.bottom],
   [L.top,C.middle,Rr.bottom],
   [L.bottom,C.middle,Rr.top]
 ];
 if(lines.some(x=>isWinningSymbolTriplet(...x)))return true;

 // Cherry is treated as a left-reel pay symbol. Avoid showing cherry on active left positions on MISS.
 if(L.top==="cherry"||L.middle==="cherry"||L.bottom==="cherry")return true;
 return false;
}
function chooseLegalMissCenters(){
 const n=R.left.length;
 // Prefer centers close to current stop position so MISS still feels like a natural stop.
 const base={
   left:pressedCenterIndex("left"),
   center:pressedCenterIndex("center"),
   right:pressedCenterIndex("right")
 };
 let best=null,bestCost=1e9;
 for(let dl=-5;dl<=5;dl++){
   const li=norm(base.left+dl,n);
   for(let dc=-5;dc<=5;dc++){
     const ci=norm(base.center+dc,n);
     for(let dr=-5;dr<=5;dr++){
       const ri=norm(base.right+dr,n);
       if(accidentalHit(li,ci,ri))continue;
       const cost=Math.abs(dl)+Math.abs(dc)+Math.abs(dr);
       if(cost<bestCost){best={left:li,center:ci,right:ri};bestCost=cost}
     }
   }
 }
 return best||base;
}

function pressedCenterIndex(k){
 const n=R[k].length,h=H();
 return norm(Math.round(off[k]/h)-n+1,n);
}
function findAssistIndex(k,symbol,maxSlide=ASSIST_COMA){
 if(!symbol)return null;
 const arr=R[k],n=arr.length,press=pressedCenterIndex(k);
 // Reel visual moves toward decreasing strip indexes in this implementation.
 for(let slide=0;slide<=maxSlide;slide++){
   const idx=norm(press-slide,n);
   if(arr[idx]===symbol)return {idx,slide,hit:true};
 }
 return {idx:press,slide:0,hit:false};
}
function targetFor(k,role){
 if(role==="WEAK_CHERRY"){
   if(k!=="left")return null;
   return "cherry";
 }
 if(role==="STRONG_CHERRY"){
   if(k==="left")return "cherry";
   if(k==="right")return "seven";
   return null;
 }
 if(role==="CHANCE"){
   return {left:"watermelon",center:"bell",right:"seven"}[k];
 }
 return roleSymbol(role);
}
function setCenter(k,idx,slide=0){
 const h=H(),n=R[k].length;
 if(idx==null)idx=pressedCenterIndex(k);
 off[k]=(n+idx-1)*h;
 const strip=E(k+"Strip");
 const dur=Math.min(.22,.075+slide*.025);
 strip.style.transition=`transform ${dur}s cubic-bezier(.12,.78,.22,1)`;
 strip.style.transform=`translateY(-${off[k]}px)`;
 setTimeout(()=>strip.style.transition="",Math.ceil(dur*1000)+35);
}
function flashCabinet(kind){
 const cab=document.querySelector(".cab");
 if(!cab)return;
 const cls={
  WEAK_CHERRY:"flash-red",
  STRONG_CHERRY:"flash-red3",
  WATERMELON:"flash-green",
  CHANCE:"flash-chance"
 }[kind];
 if(!cls)return;
 cab.classList.remove(cls);
 void cab.offsetWidth;
 cab.classList.add(cls);
 setTimeout(()=>cab.classList.remove(cls),kind==="STRONG_CHERRY"?850:620);
}
function updateBonusGlow(){
 const cab=document.querySelector(".cab");
 if(!cab)return;
 cab.classList.toggle("rainbow-hold",!!bonusStock && !bonusMode);
 cab.classList.toggle("bonus-active",!!bonusMode);
 if(bonusStock)E("manLamp").classList.add("on");
 else if(!bonusMode)E("manLamp").classList.remove("on");
}
function allBonusSymbolsCaptured(){
 return stopHit.left && stopHit.center && stopHit.right;
}
function roleCaptured(){
 if(currentRole==="WEAK_CHERRY")return stopHit.left;
 if(currentRole==="STRONG_CHERRY")return stopHit.left; // right 7 is a strong-stop accent, not payout requirement
 if(currentRole==="WATERMELON"||currentRole==="BELL"||currentRole==="REPLAY")return stopHit.left&&stopHit.center&&stopHit.right;
 if(currentRole==="CHANCE")return true; // chance is an internal zero-payout role
 return true;
}

E("betBtn").onclick=()=>{
 if(spinning||waiting||bet===BET_PER_GAME)return;
 ensureCredit();
 credit-=BET_PER_GAME;
 bet=BET_PER_GAME;
 replayReady=false;
 try{SE.bet();}catch(e){console.warn("audio ignored",e);}
 E("status").textContent=bonusStock?`${bonusStock==="BIG"?"7":"BAR"}を狙え！（5コマアシスト）`:"3枚掛け完了 / レバーON";
 sync();
};

function start(k,speed){
 stopped[k]=false;
 const strip=E(k+"Strip"),total=R[k].length*H();
 timer[k]=setInterval(()=>{
   off[k]-=speed;
   if(off[k]<=total*.15)off[k]+=total;
   strip.style.transform=`translateY(-${off[k]}px)`;
 },16);
}
function actuallyStartSpin(){
 waiting=false;
 spinning=true;
 game++;
 order=0;
 stopHit={left:false,center:false,right:false};
 lastSpinStart=Date.now();

 if(bonusStock){
   E("status").textContent=`${bonusStock==="BIG"?"7":"BAR"}を狙え！ 最大5コマ引込`;
 }else if(bonusMode){
   E("status").textContent=`${bonusMode} BONUS ${bonusTotal}/${bonusTarget}枚`;
 }else{
   E("status").textContent="回転中… STOP!";
 }
 updateBonusGlow();
 startReelMotor();
 start("left",32);start("center",35);start("right",38);
 ["stopL","stopC","stopR"].forEach(id=>{E(id).disabled=false;E(id).classList.add("ready")});
 sync();
}
E("leverBtn").onclick=()=>{
 if(spinning||waiting||bet!==BET_PER_GAME)return;

 // Internal role is decided at LEVER ON, even if the reel wait is still active.
 currentRole=drawRole();
 try{SE.lever();}catch(e){console.warn("audio ignored",e);}
 updateBonusGlow();

 const elapsed=Date.now()-lastSpinStart;
 const wait=Math.max(0,REEL_WAIT_MS-elapsed);
 if(wait>35 && lastSpinStart>0){
   waiting=true;
   E("status").innerHTML=`WAIT <span class="wait-badge">${(wait/1000).toFixed(1)}s</span>`;
   sync();
   setTimeout(actuallyStartSpin,wait);
 }else{
   actuallyStartSpin();
 }
};

function stop(k,b){
 if(!spinning||stopped[k])return;
 clearInterval(timer[k]);
 stopped[k]=true;

 const target=targetFor(k,currentRole);
 let idx=pressedCenterIndex(k),slide=0,hit=false;
 if(currentRole==="MISS" && missPlan){
   idx=missPlan[k];
   slide=Math.min(ASSIST_COMA,Math.abs(norm(idx-pressedCenterIndex(k),R[k].length)));
   hit=true;
 }else if(target){
   const assist=findAssistIndex(k,target,ASSIST_COMA);
   idx=assist.idx;slide=assist.slide;hit=assist.hit;
 }
 stopHit[k]=target?hit:true;
 setCenter(k,idx,slide);

 b.disabled=true;b.classList.remove("ready");
 order++;
 try{SE.stop(order);}catch(e){console.warn("audio ignored",e);}
 if(order===2 && bonusStock && !bonusMode){
   const stoppedKeys=["left","center","right"].filter(x=>stopped[x]);
   if(stoppedKeys.length===2 && stoppedKeys.every(x=>stopHit[x])){
     setTimeout(()=>playFileSE("seTenpaiFile",1,1),70);
   }
 }
 if(order===3){
   stopReelMotor();
   setTimeout(finish,150);
 }
}

function startBonus(type){
 bonusStock=null;
 bonusMode=type;
 bonusTotal=0;
 bonusTarget=type==="BIG"?250:100;
 replayReady=false;
 updateBonusGlow();
 try{SE.bonus();}catch(e){console.warn("audio ignored",e);}
 startBonusBgm(type);
 return `${type} BONUS START! 目標 ${bonusTarget}枚`;
}
function endBonus(){
 const type=bonusMode,total=bonusTotal;
 bonusMode=null;bonusTotal=0;bonusTarget=0;
 stopBgm();updateBonusGlow();
 return `${type}終了 TOTAL ${total}枚`;
}

function finish(){
 spinning=false;
 let msg="ハズレ";
 const captured=roleCaptured();

 // BONUS is never started by internal hit alone. All 3 bonus symbols must be aligned.
 if(currentRole==="BIG_ALIGN"||currentRole==="REG_ALIGN"){
   if(allBonusSymbolsCaptured()){
     msg=startBonus(bonusStock);
   }else{
     msg=`${bonusStock}成立中 / ${bonusStock==="BIG"?"7":"BAR"}を狙え（取りこぼし・持越し）`;
     updateBonusGlow();
   }
 }
 else if(currentRole==="BELL"){
   if(captured){
     const coins=bonusMode?15:8;
     awardCoins(coins);
     if(bonusMode)bonusTotal+=coins;
     msg=`ベル +${coins}枚`;
     try{SE.bell();}catch(e){}
   }else msg="ベル成立（取りこぼし）";
 }
 else if(currentRole==="REPLAY"){
   if(captured){
     replayReady=true;
     msg="REPLAY / 次ゲーム3枚掛け不要";
     try{SE.replay();}catch(e){}
   }else{
     // Safety fallback: internal replay still grants replay even on an impossible visual miss.
     replayReady=true;
     msg="REPLAY成立 / 再遊技";
   }
 }
 else if(currentRole==="WATERMELON"){
   flashCabinet("WATERMELON");
   if(captured){awardCoins(8);msg="スイカ +8枚";try{SE.rare();}catch(e){}}
   else msg="スイカ成立（取りこぼし）";
 }
 else if(currentRole==="WEAK_CHERRY"){
   flashCabinet("WEAK_CHERRY");
   if(captured){awardCoins(1);msg="弱チェリー +1枚";playFileSE("seCherryFile",1,1)}
   else msg="弱チェリー成立（取りこぼし）";
 }
 else if(currentRole==="STRONG_CHERRY"){
   flashCabinet("STRONG_CHERRY");
   if(captured){awardCoins(1);msg="強チェリー +1枚";playFileSE("seCherryFile",1.05,1)}
   else msg="強チェリー成立（取りこぼし）";
 }
 else if(currentRole==="CHANCE"){
   flashCabinet("CHANCE");
   msg="チャンス目！";
   try{SE.chance();}catch(e){}
 }

 // If this game newly stocked a bonus, keep rainbow until 7/BAR is actually aligned.
 if(bonusStock && !bonusMode && currentRole!=="BIG_ALIGN" && currentRole!=="REG_ALIGN"){
   updateBonusGlow();
   msg+=` / ${bonusStock}内部成立！ 次G ${bonusStock==="BIG"?"7":"BAR"}を狙え`;
 }

 if(bonusMode && currentRole!=="BIG_ALIGN" && currentRole!=="REG_ALIGN"){
   if(bonusTotal>=bonusTarget){
     msg+=` / ${endBonus()}`;
   }else{
     msg+=` / ${bonusMode} ${bonusTotal}/${bonusTarget}枚`;
   }
 }

 // 3-bet fixed: only replay carries the bet forward for free.
 if(replayReady){
   bet=BET_PER_GAME;
 }else{
   bet=0;
 }
 if(credit<BET_PER_GAME && !replayReady){
   ensureCredit();
   msg+=` / CREDIT自動補充`;
 }
 E("status").textContent=msg;
 sync();
}

E("stopL").onclick=()=>stop("left",E("stopL"));
E("stopC").onclick=()=>stop("center",E("stopC"));
E("stopR").onclick=()=>stop("right",E("stopR"));

E("paytableBtn").onclick=()=>{
  E("paytableModal").classList.add("open");
  E("paytableModal").setAttribute("aria-hidden","false");
};
E("paytableClose").onclick=closePaytable;
E("paytableModal").onclick=e=>{if(e.target===E("paytableModal"))closePaytable()};
document.addEventListener("keydown",e=>{if(e.key==="Escape")closePaytable()});
function closePaytable(){
  E("paytableModal").classList.remove("open");
  E("paytableModal").setAttribute("aria-hidden","true");
}


E("soundBtn").onclick=()=>{
 soundOn=!soundOn;
 E("soundBtn").textContent=soundOn?"SOUND ON":"SOUND OFF";
 E("soundBtn").classList.toggle("off",!soundOn);
 if(!soundOn){stopBgm();stopReelMotor();}
};


let autoMode=false,autoTimer=null;
function autoSchedule(ms=250){
 clearTimeout(autoTimer);
 if(autoMode)autoTimer=setTimeout(autoStep,ms);
}
function autoStep(){
 if(!autoMode)return;
 try{
   if(!E("betBtn").disabled){E("betBtn").click();return autoSchedule(180);}
   if(!E("leverBtn").disabled){E("leverBtn").click();return autoSchedule(500);}
   if(!E("stopL").disabled){E("stopL").click();return autoSchedule(220);}
   if(!E("stopC").disabled){E("stopC").click();return autoSchedule(220);}
   if(!E("stopR").disabled){E("stopR").click();return autoSchedule(520);}
 }catch(e){console.warn("AUTO skipped:",e);}
 autoSchedule(220);
}
E("autoBtn").onclick=()=>{
 autoMode=!autoMode;
 E("autoBtn").textContent=autoMode?"AUTO ON":"AUTO OFF";
 E("autoBtn").classList.toggle("on",autoMode);
 if(autoMode)autoStep(); else clearTimeout(autoTimer);
};


function applyVolume(v){
 masterVolume=Math.max(0,Math.min(1,v));
 const pct=Math.round(masterVolume*100);
 const slider=E("volumeSlider"),label=E("volumeValue");
 if(slider)slider.value=pct;
 if(label)label.textContent=pct+"%";
 ["bgmBig1","bgmBig2","bgmBig3","bgmBar","seLeverFile","seStopFile","seBellFile","seReplayFile","seCherryFile","seTenpaiFile"].forEach(id=>{
   const a=E(id); if(a)a.volume=masterVolume;
 });
 if(reelMotorNodes && reelMotorNodes.g){
   reelMotorNodes.g.gain.value=.016*masterVolume;
 }
 if(masterVolume===0){
   soundOn=false;
   E("soundBtn").textContent="SOUND OFF";
   E("soundBtn").classList.add("off");
 }else if(!soundOn){
   soundOn=true;
   E("soundBtn").textContent="SOUND ON";
   E("soundBtn").classList.remove("off");
 }
}
E("volumeSlider").addEventListener("input",e=>applyVolume(+e.target.value/100));
E("volumeDown").onclick=()=>applyVolume(masterVolume-.05);
E("volumeUp").onclick=()=>applyVolume(masterVolume+.05);

// SOUND ONに戻した時は現在の音量を維持
const oldSoundToggle=E("soundBtn").onclick;
E("soundBtn").onclick=()=>{
 if(oldSoundToggle)oldSoundToggle();
 if(soundOn && masterVolume===0)applyVolume(.25);
};
applyVolume(.65);

sync();
