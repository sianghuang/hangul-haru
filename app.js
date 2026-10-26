'use strict';

// Unicode Hangul syllables: (initial * 21 + medial) * 28 + final + U+AC00.
// Romanization is beginner-friendly guidance; connected speech can change pronunciation.
const VOWELS = [
  ['ㅏ','a','「啊」a，張口發音'],['ㅑ','ya','ya，在 a 前加 y'],
  ['ㅓ','eo','eo，嘴巴較放鬆，不等於英文 o'],['ㅕ','yeo','yeo，在 eo 前加 y'],
  ['ㅗ','o','o，嘴唇稍微圓起'],['ㅛ','yo','yo，在 o 前加 y'],
  ['ㅜ','u','u，圓唇的「嗚」'],['ㅠ','yu','yu，在 u 前加 y'],
  ['ㅡ','eu','eu，嘴唇平展，不能直接念成 u'],['ㅣ','i','i，接近「衣」'],
  ['ㅐ','ae','ae，現代韓語常接近 ㅔ'],['ㅒ','yae','yae，現代韓語常接近 ㅖ'],
  ['ㅔ','e','e，現代韓語常接近 ㅐ'],['ㅖ','ye','ye，接近「耶」'],
  ['ㅘ','wa','ㅗ + ㅏ → wa'],['ㅙ','wae','ㅗ + ㅐ → wae'],
  ['ㅚ','oe','oe，現代口語常接近 we'],['ㅝ','wo','ㅜ + ㅓ → wo'],
  ['ㅞ','we','ㅜ + ㅔ → we'],['ㅟ','wi','wi，接近「威」'],
  ['ㅢ','ui','ui，實際發音依詞的位置可能改變']
].map(([ko,rr,note],rank)=>({
  ko,rr,note,
  index:{'ㅏ':0,'ㅐ':1,'ㅑ':2,'ㅒ':3,'ㅓ':4,'ㅔ':5,'ㅕ':6,'ㅖ':7,'ㅗ':8,'ㅘ':9,'ㅙ':10,'ㅚ':11,'ㅛ':12,'ㅜ':13,'ㅝ':14,'ㅞ':15,'ㅟ':16,'ㅠ':17,'ㅡ':18,'ㅢ':19,'ㅣ':20}[ko],
  type:'vowel',advanced:rank>=10
}));
const CONSONANTS = [
  ['ㄱ','g/k','기역 · 詞首常接近輕的 k；兩母音間接近 g',0,'가'],
  ['ㄴ','n','니은 · 接近英文 n',2,'나'],
  ['ㄷ','d/t','디귿 · 詞首常接近輕的 t',3,'다'],
  ['ㄹ','r/l','리을 · 音節開頭近閃音 r，收尾近 l',5,'라'],
  ['ㅁ','m','미음 · 接近英文 m',6,'마'],
  ['ㅂ','b/p','비읍 · 詞首常接近輕的 p',7,'바'],
  ['ㅅ','s','시옷 · 一般接近 s；在 i 前會更像 sh',9,'사'],
  ['ㅇ','靜音 / ng','이응 · 音節開頭不發音，收尾時發 ng',11,'아'],
  ['ㅈ','j','지읒 · 不送氣的 j 類發音',12,'자'],
  ['ㅊ','ch','치읓 · 送氣的 ch',14,'차'],
  ['ㅋ','k','키읔 · 明顯送氣的 k',15,'카'],
  ['ㅌ','t','티읕 · 明顯送氣的 t',16,'타'],
  ['ㅍ','p','피읖 · 明顯送氣的 p',17,'파'],
  ['ㅎ','h','히읗 · 類似英文 h',18,'하'],
  ['ㄲ','kk','쌍기역 · 緊音，發音緊實，不等於多加氣',1,'까'],
  ['ㄸ','tt','쌍디귿 · 緊音，不送氣',4,'따'],
  ['ㅃ','pp','쌍비읍 · 緊音，不送氣',8,'빠'],
  ['ㅆ','ss','쌍시옷 · 緊音 s',10,'싸'],
  ['ㅉ','jj','쌍지읒 · 緊音 j',13,'짜']
].map(([ko,rr,note,index,say],rank)=>({ko,rr,note,index,say,type:'consonant',advanced:rank>=14}));

// Category choices are intentionally distinct, with all Hangul written in native Korean script.
const WORDS = [
  ['안녕','annyeong','你好／再見（非正式）','greeting'],
  ['안녕하세요','annyeonghaseyo','您好／你好（禮貌）','greeting'],
  ['감사합니다','gamsahamnida','謝謝（正式）','greeting'],
  ['고마워','gomawo','謝謝（熟人）','greeting'],
  ['죄송합니다','joesonghamnida','對不起（正式）','greeting'],
  ['미안해요','mianhaeyo','對不起（禮貌）','greeting'],
  ['네','ne','是／好的','greeting'],
  ['아니요','aniyo','不是／不用','greeting'],
  ['또 봐','tto bwa','再見／下次見（熟人）','greeting'],
  ['반가워요','bangawoyo','很高興認識你','greeting'],
  ['잘 자요','jal jayo','晚安／好好睡','greeting'],
  ['괜찮아요','gwaenchanayo','沒關係／我沒事','greeting'],
  ['밥','bap','飯','food'],
  ['물','mul','水','food'],
  ['커피','keopi','咖啡','food'],
  ['차','cha','茶','food'],
  ['우유','uyu','牛奶','food'],
  ['김치','gimchi','泡菜','food'],
  ['라면','ramyeon','泡麵','food'],
  ['떡','tteok','韓式年糕','food'],
  ['빵','ppang','麵包','food'],
  ['사과','sagwa','蘋果','food'],
  ['딸기','ttalgi','草莓','food'],
  ['바나나','banana','香蕉','food'],
  ['과일','gwail','水果','food'],
  ['고기','gogi','肉','food'],
  ['불고기','bulgogi','韓式烤肉','food'],
  ['비빔밥','bibimbap','拌飯','food'],
  ['식당','sikdang','餐廳','food'],
  ['맛있어요','masisseoyo','很好吃','food'],
  ['맵다','maepda','辣（原形）','food'],
  ['배고파요','baegopayo','肚子餓','food'],
  ['소금','sogeum','鹽','food'],
  ['과자','gwaja','零食／餅乾','food'],
  ['지하철','jihacheol','地鐵','travel'],
  ['버스','beoseu','公車','travel'],
  ['택시','taeksi','計程車','travel'],
  ['기차','gicha','火車','travel'],
  ['공항','gonghang','機場','travel'],
  ['호텔','hotel','飯店','travel'],
  ['여권','yeogwon','護照','travel'],
  ['여행','yeohaeng','旅行','travel'],
  ['한국','hanguk','韓國','travel'],
  ['서울','seoul','首爾','travel'],
  ['부산','busan','釜山','travel'],
  ['화장실','hwajangsil','廁所','travel'],
  ['어디','eodi','哪裡','travel'],
  ['여기','yeogi','這裡','travel'],
  ['저기','jeogi','那裡','travel'],
  ['길','gil','路','travel'],
  ['지도','jido','地圖','travel'],
  ['출구','chulgu','出口','travel'],
  ['입구','ipgu','入口','travel'],
  ['표','pyo','票','travel'],
  ['역','yeok','車站','travel'],
  ['얼마예요','eolmayeyo','多少錢？','travel'],
  ['사진','sajin','照片','travel'],
  ['예약','yeyak','預約','travel'],
  ['비행기','bihaenggi','飛機','travel'],
  ['집','jip','家','daily'],
  ['사람','saram','人','daily'],
  ['친구','chingu','朋友','daily'],
  ['가족','gajok','家人／家庭','daily'],
  ['엄마','eomma','媽媽','daily'],
  ['아빠','appa','爸爸','daily'],
  ['아이','ai','小孩','daily'],
  ['아기','agi','嬰兒','daily'],
  ['이름','ireum','名字','daily'],
  ['학교','hakgyo','學校','daily'],
  ['선생님','seonsaengnim','老師','daily'],
  ['학생','haksaeng','學生','daily'],
  ['회사','hoesa','公司','daily'],
  ['의자','uija','椅子','daily'],
  ['책','chaek','書','daily'],
  ['펜','pen','筆','daily'],
  ['꽃','kkot','花','daily'],
  ['바다','bada','大海','daily'],
  ['하늘','haneul','天空','daily'],
  ['날씨','nalssi','天氣','daily'],
  ['오늘','oneul','今天','daily'],
  ['내일','naeil','明天','daily'],
  ['어제','eoje','昨天','daily'],
  ['지금','jigeum','現在','daily'],
  ['사랑','sarang','愛','daily'],
  ['행복','haengbok','幸福','daily'],
  ['시간','sigan','時間','daily'],
  ['여자','yeoja','女性','daily'],
  ['남자','namja','男性','daily'],
  ['이야기','iyagi','故事','daily'],
  ['얘기','yaegi','談話／故事','daily'],
  ['음악','eumak','音樂','daily'],
  ['영화','yeonghwa','電影','daily'],
  ['전화','jeonhwa','電話','daily'],
  ['컴퓨터','keompyuteo','電腦','daily'],
  ['빨리','ppalli','快點','daily'],
  ['쌀','ssal','米','daily'],
  ['왜','wae','為什麼','daily'],
  ['웨이터','weiteo','服務生（外來語）','daily'],
  ['원','won','韓元（貨幣單位）','daily'],
  ['귀','gwi','耳朵','daily'],
  ['운동','undong','運動','daily'],
  ['열쇠','yeolsoe','鑰匙','daily'],
  ['짜다','jjada','鹹（原形）','daily'],
  ['예','ye','是（正式回答）','greeting']
].map(([ko,rr,zh,cat])=>({ko,rr,zh,cat}));

const $ = id => document.getElementById(id);
const CATEGORIES={greeting:'問候',daily:'日常',food:'美食',travel:'旅遊'};
const TODAY = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const STORAGE='hangul-haru-v1';
const defaults={letterFilter:'all',advancedVowels:false,tenseConsonants:false,withBatchim:false,wordTheme:'all',blind:true,random:true,autoplay:false};
function readStorage(){try{const s=JSON.parse(localStorage.getItem(STORAGE)||'{}');return s&&typeof s==='object'?s:{}}catch{return {}}}
const saved=readStorage();
const state={mode:'letters',settings:{...defaults,...(saved.settings||{})},seen:saved.seen&&typeof saved.seen==='object'?saved.seen:{},today:saved.today===TODAY()?saved.today:TODAY(),todayCount:saved.today===TODAY()?(Number(saved.todayCount)||0):0,current:null,revealed:false,started:false,deck:[],index:0};
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({settings:state.settings,seen:state.seen,today:state.today,todayCount:state.todayCount}))}catch{/* private mode or storage unavailable */}}
function letterPool(){return [
  ...(state.settings.letterFilter!=='consonant'?VOWELS.filter(v=>state.settings.advancedVowels||!v.advanced):[]),
  ...(state.settings.letterFilter!=='vowel'?CONSONANTS.filter(c=>state.settings.tenseConsonants||!c.advanced):[])
]}
function parts(ch){const code=ch.codePointAt(0);if(code<0xAC00||code>0xD7A3)return null;const n=code-0xAC00;return {l:Math.floor(n/588),v:Math.floor(n%588/28),t:n%28}}
const FINAL_MAP={1:['ㄱ','k'],4:['ㄴ','n'],7:['ㄷ','t'],8:['ㄹ','l'],16:['ㅁ','m'],17:['ㅂ','p'],21:['ㅇ','ng']};
function makeSyllablePool(){
  const initials=CONSONANTS.filter(c=>state.settings.tenseConsonants||!c.advanced);
  const vowels=VOWELS.filter(v=>state.settings.advancedVowels||!v.advanced);
  const initialsAllowed=new Set(initials.map(c=>c.index));
  const vowelsAllowed=new Set(vowels.map(v=>v.index));
  const pool=new Map();
  for(const word of WORDS){
    for(const ch of word.ko){const p=parts(ch);if(!p||!initialsAllowed.has(p.l)||!vowelsAllowed.has(p.v)||(!state.settings.withBatchim&&p.t)||p.t&&!FINAL_MAP[p.t])continue;
      if(!pool.has(ch))pool.set(ch,{ko:ch,l:p.l,v:p.v,t:p.t,word,mode:'syllables'});
    }
  }
  // Even if a syllable is not part of the vocabulary corpus, keep the core example 가 visible.
  return [...pool.values()];
}
function wordPool(){return WORDS.filter(w=>state.settings.wordTheme==='all'||w.cat===state.settings.wordTheme).map(w=>({...w,mode:'words'}))}
function pool(){if(state.mode==='letters')return letterPool().map(l=>({...l,mode:'letters'}));if(state.mode==='syllables')return makeSyllablePool();return wordPool()}
function key(q){return state.mode+':'+q.ko}
function shuffle(array){for(let i=array.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]]}return array}
function resetDeck(){const all=pool();state.deck=state.settings.random?shuffle(all):all;state.index=0}
function takeQuestion(exact){if(!state.deck.length||state.index>=state.deck.length)resetDeck();if(exact){const candidate=pool().find(x=>x.ko===exact);if(candidate)return candidate}if(!state.deck.length)return null;const next=state.deck[state.index++];if(state.current&&state.deck.length>1&&next.ko===state.current.ko){const replacement=state.deck[state.index%state.deck.length];if(replacement&&replacement.ko!==next.ko)return replacement}return next}
function startQuestion(exact){state.current=takeQuestion(exact);state.started=!!state.current;state.revealed=false;render()}
function nextQuestion(){if(state.started)startQuestion()}
function reveal(){if(!state.current||state.revealed)return;state.revealed=true;if(state.today!==TODAY()){state.today=TODAY();state.todayCount=0}state.todayCount++;state.seen[key(state.current)]=true;persist();render();if(state.settings.autoplay)playAudio()}
function action(){if(!state.started)startQuestion();else if(!state.revealed)reveal();else nextQuestion()}
function changeMode(mode, exact){
  if(!['letters','syllables','words'].includes(mode))return;
  const shouldBegin=state.started||Boolean(exact);
  state.mode=mode;
  resetDeck();
  if(shouldBegin)startQuestion(exact);
  else {state.current=null;state.revealed=false;render()}
}
function changeSettings(){
  for(const id of Object.keys(defaults)){
    state.settings[id]=['letterFilter','wordTheme'].includes(id)?$(id).value:$(id).checked;
  }
  persist();
  resetDeck();
  if(state.started)startQuestion();
  else render();
}
function findWordForLetter(letter){const match=(w)=>[...w.ko].some(ch=>{const p=parts(ch);return p&&(letter.type==='vowel'?p.v===letter.index:p.l===letter.index)});const candidates=WORDS.filter(match);return candidates.sort((a,b)=>a.ko.replace(/\s/g,'').length-b.ko.replace(/\s/g,'').length)[0]||WORDS[0]}
const SIMPLE_ONSET=['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
function syllableRoman(q){const v=VOWELS.find(x=>x.index===q.v);return SIMPLE_ONSET[q.l]+(v?.rr||'')+(FINAL_MAP[q.t]?.[1]||'')}
function currentPresentation(){const q=state.current; if(!q)return null;
  if(state.mode==='letters'){
    const word=findWordForLetter(q);
    return {ko:q.ko,roman:q.rr,pronunciation:q.note,word,composition:null,note:q.type==='vowel'?'母音需要和子音排成一個音節：例如 ㅇ + '+q.ko+'。當 ㅇ 放在開頭時不發音。':'子音不能單獨組成正常音節，練習時可以搭配母音 ㅏ。',speech:q.type==='vowel'?String.fromCharCode(0xAC00+(11*21+q.index)*28):q.say||q.ko};
  }
  if(state.mode==='syllables'){
    const c=CONSONANTS.find(x=>x.index===q.l);const v=VOWELS.find(x=>x.index===q.v);const f=FINAL_MAP[q.t];
    const combination=(c?.ko||'')+' + '+(v?.ko||'')+(f?' + '+f[0]:'')+' = '+q.ko;
    return {ko:q.ko,roman:syllableRoman(q),pronunciation:f?'最後的 '+f[0]+' 是받침（收尾子音）。':'將兩個字母排在一個音節方塊中。',word:q.word,composition:combination,note:'這是單一音節的入門參考讀法；放進完整單字後，可能發生連音或音變。',speech:q.ko};
  }
  const same=WORDS.filter(w=>w.cat===q.cat&&w.ko!==q.ko);const word=same.length?same[WORDS.indexOf(WORDS.find(w=>w.ko===q.ko))%same.length]:q;
  return {ko:q.ko,roman:q.rr,pronunciation:q.zh,word,composition:null,speech:q.ko};
}
function render(){
  document.querySelectorAll('.tab').forEach(b=>{
    const active=b.dataset.mode===state.mode;
    b.classList.toggle('active',active);
    b.setAttribute('aria-selected',String(active));
  });
  $('question').hidden=state.started&&state.revealed;
  $('answer').hidden=!state.started||!state.revealed;
  $('mainBtn').innerHTML=(state.started?(state.revealed?'下一題':'揭曉答案'):'開始練習')+' <span>→</span>';
  $('cardCount').textContent=state.started?String(Math.max(1,state.index)).padStart(2,'0')+' / '+state.deck.length:'尚未開始';
  $('skipBtn').hidden=!state.started;
  $('shortcuts').hidden=!state.started;
  $('question').classList.toggle('is-welcome',!state.started);
  $('question').classList.toggle('word-question',state.started&&state.mode==='words');
  $('answer').classList.toggle('word-answer',state.mode==='words');
  if(!state.started){
    $('glyph').textContent='?';
    $('questionPrompt').textContent='準備好了嗎？';
    $('hint').hidden=true;
  }
  if(state.current){
    $('glyph').textContent=state.current.ko;
    $('questionPrompt').textContent=state.mode==='letters'?'這個字母怎麼念？':state.mode==='syllables'?'試著念出這個音節':'先念出來，再猜意思。';
    $('hint').hidden=state.settings.blind;
    $('hint').textContent=state.mode==='letters'?(state.current.type==='vowel'?'母音':'子音'):state.mode==='syllables'?'1 個音節':'單字';
    if(state.revealed){
      const p=currentPresentation();
      $('answerGlyph').textContent=p.ko;
      $('roman').textContent=p.roman;
      $('pronunciation').textContent=p.pronunciation;
      $('composition').hidden=!p.composition;
      $('compositionText').textContent=p.composition||'';
      $('vocabHeading').textContent=state.mode==='words'?'延伸':'例字';
      $('vocabKo').textContent=p.word.ko;
      $('vocabRoman').textContent=p.word.rr;
      $('vocabZh').textContent=p.word.zh;
      $('vocabAudioBtn').setAttribute('aria-label','播放「'+p.word.ko+'」的韓文發音');
    }
  }
  const items=pool(),seen=items.filter(x=>state.seen[key(x)]).length,total=items.length;
  $('todayCount').textContent=state.today===TODAY()?state.todayCount:'0';
  $('seenCount').textContent=seen;
  $('totalCount').textContent='/'+total;
  const progress=total?Math.min(100,Math.round(seen/total*100)):0;
  $('progressBar').style.width=progress+'%';
  $('progressTrack').setAttribute('aria-valuenow',String(progress));
  updateChart();
}
function updateChart(){
  const body=$('chartBody');
  body.replaceChildren();
  const arr=letterPool();
  for(const [title,letterType] of [['母音','vowel'],['子音','consonant']]){
    const selected=arr.filter(x=>x.type===letterType);
    if(!selected.length)continue;
    const section=document.createElement('section');
    section.className='chart-section';
    const h=document.createElement('h3');
    h.textContent=title;
    section.append(h);
    const grid=document.createElement('div');
    grid.className='chart-grid';
    for(const x of selected){
      const btn=document.createElement('button');
      btn.type='button';
      const glyph=document.createElement('span');glyph.textContent=x.ko;
      const roman=document.createElement('small');roman.textContent=x.rr;
      btn.append(glyph,roman);
      btn.title='練習 '+x.ko;
      btn.classList.toggle('seen',!!state.seen['letters:'+x.ko]);
      btn.classList.toggle('current',state.mode==='letters'&&state.current?.ko===x.ko);
      btn.addEventListener('click',()=>{
        $('chartDialog').close();
        changeMode('letters',x.ko);
        $('card').scrollIntoView({behavior:'smooth',block:'nearest'});
      });
      grid.append(btn);
    }
    section.append(grid);body.append(section);
  }
}
function speakKorean(text){
  if(!text||!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))return;
  try{
    speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang='ko-KR';
    utterance.rate=.75;
    const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('ko'));
    if(voice)utterance.voice=voice;
    speechSynthesis.speak(utterance);
  }catch(e){console.warn('Speech synthesis unavailable:',e)}
}
function playAudio(){const p=currentPresentation();if(p)speakKorean(p.speech)}
function playWordAudio(){if(!state.revealed)return;const p=currentPresentation();if(p?.word?.ko)speakKorean(p.word.ko)}
function setSettings(){for(const id of Object.keys(defaults)){if(['letterFilter','wordTheme'].includes(id))$(id).value=state.settings[id];else $(id).checked=!!state.settings[id]}}
function closeSettings(){$('settings').hidden=true;$('settingBtn').setAttribute('aria-expanded','false')}
function showSettings(){const target=$('settings').hidden;$('settings').hidden=!target;$('settingBtn').setAttribute('aria-expanded',String(target))}
function showHelp(){if(typeof $('helpDialog').showModal==='function')$('helpDialog').showModal();else $('helpDialog').setAttribute('open','')}
function closeHelp(){$('helpDialog').close?.();$('helpDialog').removeAttribute('open')}
function initialize(){
  setSettings();resetDeck();render();
  $('mainBtn').addEventListener('click',action);
  $('skipBtn').addEventListener('click',nextQuestion);
  $('audioBtn').addEventListener('click',playAudio);
  $('vocabAudioBtn').addEventListener('click',playWordAudio);
  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>changeMode(btn.dataset.mode)));
  for(const id of Object.keys(defaults))$(id).addEventListener('change',changeSettings);
  $('settingBtn').addEventListener('click',showSettings);
  $('closeSettings').addEventListener('click',closeSettings);
  document.addEventListener('pointerdown',ev=>{if(!$('settingWrap').contains(ev.target))closeSettings()});
  $('chartOpen').addEventListener('click',()=>{closeSettings();$('chartDialog').showModal()});
  $('chartClose').addEventListener('click',()=>$('chartDialog').close());
  $('chartDialog').addEventListener('click',ev=>{if(ev.target===$('chartDialog'))$('chartDialog').close()});
  $('helpBtn').addEventListener('click',showHelp);
  $('closeHelp').addEventListener('click',closeHelp);
  $('helpStart').addEventListener('click',()=>{closeHelp();changeMode('letters');startQuestion()});
  $('helpDialog').addEventListener('click',ev=>{if(ev.target===$('helpDialog'))closeHelp()});
  const unavailable=!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window);
  $('audioBtn').disabled=unavailable;
  $('vocabAudioBtn').disabled=unavailable;
  document.addEventListener('keydown',ev=>{
    if(ev.key==='Escape'){closeSettings();return}
    if(ev.altKey||ev.ctrlKey||ev.metaKey||ev.repeat||$('helpDialog').open||$('chartDialog').open||!$('settings').hidden)return;
    if(ev.target.closest?.('button,select,input,textarea,[contenteditable="true"]'))return;
    if(ev.code==='Space'||ev.key==='Enter'){ev.preventDefault();action()}
    else if(ev.key==='ArrowRight'){ev.preventDefault();nextQuestion()}
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize);else initialize();