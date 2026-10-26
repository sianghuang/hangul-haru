'use strict';

const $ = id => document.getElementById(id);
const CATEGORIES = window.TRAVEL_CATEGORIES || [];
const FAVORITES_KEY = 'hangul-haru-travel-favorites-v1';
const SPEECH_OK = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const state = {category:'all', query:'', favorites:new Set(), numberMode:'sino'};
try {
  const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  if (Array.isArray(stored)) state.favorites = new Set(stored.filter(x => typeof x === 'string'));
} catch { /* Browsers may block storage. The page still works. */ }
const categories = [
  {id:'all', label:'全部'}, {id:'favorites', label:'收藏'},
  ...CATEGORIES.map(({id,label})=>({id,label})),
  {id:'numbers', label:'數字 0–99'}
];
const ALL_COUNT = CATEGORIES.reduce((n,c)=>n+c.phrases.length,0);
const REFERENCE = {
  sino: [
    ['0','영','yeong'],['0（電話）','공','gong'],
    ['1','일','il'],['2','이','i'],['3','삼','sam'],['4','사','sa'],
    ['5','오','o'],['6','육','yuk'],['7','칠','chil'],['8','팔','pal'],
    ['9','구','gu'],['10','십','sip'],['11','십일','sibil'],['20','이십','isip'],
    ['100','백','baek'],['1,000','천','cheon'],['10,000','만','man']
  ],
  native: [
    ['1','하나','hana'],['2','둘','dul'],['3','셋','set'],
    ['4','넷','net'],['5','다섯','daseot'],['6','여섯','yeoseot'],
    ['7','일곱','ilgop'],['8','여덟','yeodeol'],['9','아홉','ahop'],
    ['10','열','yeol'],['11','열하나','yeolhana'],['12','열둘','yeoldul'],
    ['20','스물','seumul'],['30','서른','seoreun'],['40','마흔','maheun'],
    ['50','쉰','swin'],['60','예순','yesun'],['70','일흔','ilheun'],
    ['80','여든','yeodeun'],['90','아흔','aheun']
  ]
};
const EXAMPLES = {
  sino: [
    ['만 이천 원','man icheon won','12,000 韓元'],
    ['팔천 원','palcheon won','8,000 韓元'],
    ['삼십 분','samsip bun','30 分鐘'],
    ['이십육 일','isibyuk il','26 號（日期）'],
    ['공일공','gongilgong','010（手機號碼開頭，逐個數字讀）']
  ],
  native: [
    ['한 명','han myeong','1 個人'],
    ['두 개','du gae','2 個'],
    ['세 시','se si','3 點鐘'],
    ['네 잔','ne jan','4 杯'],
    ['스무 살','seumu sal','20 歲']
  ]
};
const SINO_ONES = [
  ['',''], ['일','il'],['이','i'],['삼','sam'],['사','sa'],
  ['오','o'],['육','yuk'],['칠','chil'],['팔','pal'],['구','gu']
];
const SINO_UNITS = [['천','cheon'],['백','baek'],['십','sip'],['','']];
const NATIVE_ONES = [
  null, ['하나','hana'],['둘','dul'],['셋','set'],['넷','net'],
  ['다섯','daseot'],['여섯','yeoseot'],['일곱','ilgop'],
  ['여덟','yeodeol'],['아홉','ahop']
];
const NATIVE_SHORT = {1:['한','han'],2:['두','du'],3:['세','se'],4:['네','ne']};
const NATIVE_TENS = {
  10:['열','yeol'],20:['스물','seumul'],30:['서른','seoreun'],
  40:['마흔','maheun'],50:['쉰','swin'],60:['예순','yesun'],
  70:['일흔','ilheun'],80:['여든','yeodeun'],90:['아흔','aheun']
};
const textNode = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = text;
  return el;
};
const phraseId = (cat,ko) => cat + ':' + ko;
function persistFavorites(){
  try {localStorage.setItem(FAVORITES_KEY,JSON.stringify([...state.favorites]));} catch { /* optional */ }
}
let koreanVoice = null;
function pickVoice(){
  if(!SPEECH_OK) return;
  const voices = window.speechSynthesis.getVoices().filter(v => /^ko(?:-|_)/i.test(v.lang));
  koreanVoice = voices.find(v=>/female|sora|sunhi|sun-hi|yuna|heami|ji.?young|서연|유나|소라/i.test(v.name)) || voices[0] || null;
}
function speak(text) {
  if(!SPEECH_OK || !text) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[.!?,~。！？]/g,'').trim());
    utterance.lang = 'ko-KR';
    utterance.rate = .82;
    if (koreanVoice) utterance.voice = koreanVoice;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Korean voice unavailable', err);
    $('audioNotice').hidden = false;
  }
}
function renderNav(){
  const nav=$('categoryNav');
  nav.replaceChildren();
  for(const cat of categories){
    const b=textNode('button','category-chip',cat.label);
    b.type='button';
    const selected=cat.id===state.category;
    b.classList.toggle('active',selected);
    b.setAttribute('aria-pressed',String(selected));
    if(cat.id==='favorites' && state.favorites.size){
      b.append(textNode('span','chip-count',String(state.favorites.size)));
    }
    b.addEventListener('click',()=>{
      state.category=cat.id;
      state.query='';
      $('phraseSearch').value='';
      render();
    });
    nav.append(b);
  }
}
function createPhrase(entry, catId){
  const [ko,roman,zh] = entry;
  const card=document.createElement('article');
  card.className='phrase-card';
  const top=textNode('div','phrase-top','');
  top.append(textNode('p','phrase-zh',zh));
  const id=phraseId(catId,ko);
  const fav=textNode('button','favorite-btn',state.favorites.has(id)?'★':'☆');
  fav.type='button';
  fav.classList.toggle('selected',state.favorites.has(id));
  fav.setAttribute('aria-pressed',String(state.favorites.has(id)));
  fav.setAttribute('aria-label',state.favorites.has(id)?'取消收藏 '+zh:'收藏 '+zh);
  fav.title=state.favorites.has(id)?'取消收藏':'收藏這句';
  fav.addEventListener('click',()=>{
    if(state.favorites.has(id))state.favorites.delete(id);else state.favorites.add(id);
    persistFavorites(); render();
  });
  top.append(fav);
  card.append(top);
  const line=textNode('div','word-line','');
  line.setAttribute('lang','ko');
  const words=ko.trim().split(/\s+/), romans=roman.trim().split(/\s+/);
  words.forEach((word,i)=>{
    const b=textNode('button','word-token','');
    b.type='button';
    const cleaned=word.replace(/[.!?,~。！？]/g,'');
    b.disabled=!SPEECH_OK;
    b.setAttribute('aria-label','播放單詞 '+cleaned);
    b.title='點按播放：'+cleaned;
    b.append(textNode('span','word-ko',word));
    if(romans[i])b.append(textNode('span','word-roman',romans[i]));
    b.addEventListener('click',()=>speak(cleaned));
    line.append(b);
  });
  card.append(line);
  const actions=textNode('div','phrase-actions','');
  const play=textNode('button','sentence-play','♫　整句播放');
  play.type='button';
  play.disabled=!SPEECH_OK;
  play.setAttribute('aria-label','播放整句：'+ko);
  play.addEventListener('click',()=>speak(ko));
  actions.append(play);
  card.append(actions);
  return card;
}
function emptyMessage(title,body,label,action){
  const box=textNode('div','empty-state','');
  box.append(textNode('h2','',title),textNode('p','',body));
  const btn=textNode('button','empty-link',label);
  btn.type='button';
  btn.addEventListener('click',action);
  box.append(btn);
  return box;
}
function renderPhrases(){
  const host=$('phrasesView');
  host.replaceChildren();
  let total=0;
  for(const cat of CATEGORIES){
    if(state.category!=='all' && state.category!=='favorites' && state.category!==cat.id)continue;
    const items=cat.phrases.filter(([ko,rr,zh])=>{
      if(state.category==='favorites' && !state.favorites.has(phraseId(cat.id,ko)))return false;
      const q=state.query.toLocaleLowerCase();
      return !q || [ko,rr,zh].some(s=>s.toLocaleLowerCase().includes(q));
    });
    if(!items.length)continue;
    total+=items.length;
    const section=textNode('section','phrase-section','');
    section.setAttribute('aria-label',cat.label);
    const heading=textNode('div','section-heading','');
    const titles=textNode('div','section-titles','');
    titles.append(textNode('h2','',cat.label),textNode('p','',cat.sub));
    heading.append(titles,textNode('span','section-count',items.length+' 句'));
    section.append(heading);
    const grid=textNode('div','phrase-grid','');
    for(const item of items)grid.append(createPhrase(item,cat.id));
    section.append(grid);
    host.append(section);
  }
  if(total===0){
    const isFav=state.category==='favorites' && !state.query;
    host.append(emptyMessage(isFav?'還沒有收藏的句子':'沒有符合的句子',
      isFav?'按句子右上方的 ☆，常用句就會集中到這裡。':'試試搜尋「咖啡」、「廁所」、「謝謝」或其他詞。',
      '看全部句子',()=>{state.category='all';state.query='';$('phraseSearch').value='';render()}));
  }
  $('resultsSummary').textContent=state.query
    ? '搜尋「'+state.query+'」：找到 '+total+' 句'
    : state.category==='favorites' ? '我的收藏 · '+total+' 句'
    : state.category==='all' ? '依情境整理 · 共 '+ALL_COUNT+' 句'
    : (CATEGORIES.find(c=>c.id===state.category)?.label || '')+' · '+total+' 句';
}
function sinoUnder10000(n){
  let ko='', rr='';
  const places=[1000,100,10,1];
  places.forEach((place,i)=>{
    const digit=Math.floor(n/place)%10;
    if(!digit)return;
    if(digit!==1 || place===1){ko+=SINO_ONES[digit][0];rr+=SINO_ONES[digit][1];}
    ko+=SINO_UNITS[i][0];rr+=SINO_UNITS[i][1];
  });
  return {ko,rr};
}
function sinoNumber(n){
  if(n===0)return {ko:'영',rr:'yeong'};
  const high=Math.floor(n/10000),low=n%10000;
  const h=high===1?{ko:'',rr:''}:sinoUnder10000(high);
  const l=sinoUnder10000(low);
  if(high&&low)return {ko:h.ko+'만 '+l.ko,rr:h.rr+'man '+l.rr};
  if(high)return {ko:h.ko+'만',rr:h.rr+'man'};
  return l;
}
function nativeNumber(n, counter){
  const tens=Math.floor(n/10)*10, ones=n%10, hasCounter=!!counter;
  let ko='',rr='';
  if(tens){
    const ten=(tens===20 && hasCounter && ones===0)?['스무','seumu']:NATIVE_TENS[tens];
    ko+=ten[0];rr+=ten[1];
  }
  if(ones){
    const unit=hasCounter&&NATIVE_SHORT[ones]?NATIVE_SHORT[ones]:NATIVE_ONES[ones];
    ko+=unit[0];rr+=unit[1];
  }
  if(hasCounter)return {ko:ko+' '+counter,rr:rr+' '+({명:'myeong',개:'gae',시:'si',살:'sal',잔:'jan'}[counter]||counter)};
  return {ko,rr};
}
function renderNumberResult(){
  const host=$('numberResult');
  host.replaceChildren();
  const raw=$('numberInput').value.trim().replace(/,/g,'');
  const native=state.numberMode==='native';
  const max=native?99:99999999;
  if(!/^\d+$/.test(raw) || Number(raw)>max || (native && Number(raw)===0)){
    host.append(textNode('p','number-error',native?'請輸入 1–99。固有數字沒有一般的「零」用法。':'請輸入 0–99,999,999 的整數。'));
    return;
  }
  const n=Number(raw);
  const value=native?nativeNumber(n,$('counterSelect').value):sinoNumber(n);
  const ko=textNode('strong','converted-ko',value.ko);
  ko.lang='ko';
  host.append(textNode('span','number-label',native?'固有數字':'漢字數字'),ko,textNode('span','converted-rr',value.rr));
  const play=textNode('button','sentence-play','♫　聽數字');
  play.type='button';play.disabled=!SPEECH_OK;
  play.setAttribute('aria-label','播放韓文數字 '+value.ko);
  play.addEventListener('click',()=>speak(value.ko));
  host.append(play);
}
function renderNumberReference(){
  const native=state.numberMode==='native';
  $('sinoMode').classList.toggle('is-current',!native);
  $('nativeMode').classList.toggle('is-current',native);
  $('sinoMode').setAttribute('aria-pressed',String(!native));
  $('nativeMode').setAttribute('aria-pressed',String(native));
  $('numberRange').textContent=native?'1–99':'0–99,999,999';
  $('counterWrap').hidden=!native;
  $('numberReferenceTitle').textContent=native?'固有數字速查':'漢字數字速查';
  const input=$('numberInput');
  if(native && (!/^\d+$/.test(input.value) || +input.value>99 || +input.value<1))input.value='3';
  else if(!native && (!/^\d+$/.test(input.value) || +input.value>99999999))input.value='12000';
  const grid=$('numberGrid');grid.replaceChildren();
  for(const [number,ko,rr] of REFERENCE[state.numberMode]){
    const btn=textNode('button','number-chip','');
    btn.type='button';btn.disabled=!SPEECH_OK;
    btn.append(textNode('span','number-value',number));
    const label=textNode('strong','number-ko',ko);label.lang='ko';btn.append(label);
    btn.append(textNode('small','number-rr',rr));
    btn.setAttribute('aria-label','播放 '+number+'，'+ko);
    btn.addEventListener('click',()=>speak(ko));
    grid.append(btn);
  }
  const examples=$('numberExamples');examples.replaceChildren();
  for(const entry of EXAMPLES[state.numberMode])examples.append(createPhrase(entry,'numbers'));
  renderNumberResult();
}
function render(){
  renderNav();
  const numbers=state.category==='numbers';
  $('phrasesView').hidden=numbers;
  $('numbersView').hidden=!numbers;
  $('resultsSummary').hidden=numbers;
  $('phraseSearch').disabled=numbers;
  $('phraseSearch').placeholder=numbers?'切換分類以搜尋句子':'搜尋中文、韓文、羅馬拼音';
  if(numbers)renderNumberReference();
  else renderPhrases();
}
$('phraseSearch').addEventListener('input',ev=>{
  state.query=ev.target.value.trim();
  if(state.query && state.category==='numbers')state.category='all';
  render();
});
$('sinoMode').addEventListener('click',()=>{state.numberMode='sino';renderNumberReference()});
$('nativeMode').addEventListener('click',()=>{state.numberMode='native';renderNumberReference()});
$('numberInput').addEventListener('input',renderNumberResult);
$('counterSelect').addEventListener('change',renderNumberResult);
if(SPEECH_OK){
  pickVoice();
  if('addEventListener' in window.speechSynthesis)window.speechSynthesis.addEventListener('voiceschanged',pickVoice);
} else $('audioNotice').hidden=false;
render();
