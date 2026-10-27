'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const SECTIONS = window.DRAMA_SCENES || [];
  const SYLLABLES = window.TRAVEL_SYLLABLES;
  const KEY = 'hangul-haru-drama-favorites-v1';
  const VOICE_READY = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const state={category:'all',kind:'all',query:'',spotlight:null,favorites:new Set()};
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||'[]');
    if(Array.isArray(saved))state.favorites=new Set(saved.filter(x=>typeof x==='string'));
  }catch{/* Private mode is supported */}
  const all=SECTIONS.flatMap(section=>section.items.map(item=>({...item,section:section.id,sectionName:section.title})));
  const text=(tag,cls,value)=>{
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(value!==undefined)el.textContent=value;
    return el;
  };
  const idOf=item=>item.section+'|'+item.ko;
  function save(){try{localStorage.setItem(KEY,JSON.stringify([...state.favorites]))}catch{/* Optional */}}
  function notice(message){
    const box=$('toast');box.textContent=message;box.hidden=false;
    // No timer required: the next user action can replace the message.
  }
  let chosenVoice=null;
  function selectVoice(){
    if(!VOICE_READY)return;
    const voices=window.speechSynthesis.getVoices().filter(v=>/^ko(?:-|_)/i.test(v.lang));
    chosenVoice=voices.find(v=>/female|sora|sunhi|yuna|heami|ji.?young|서연|유나|소라/i.test(v.name))||voices[0]||null;
  }
  function say(korean){
    if(!VOICE_READY){notice('此裝置不支援韓語語音，請在裝有韓語語音的瀏覽器中開啟。');return;}
    try{
      window.speechSynthesis.cancel();
      const utterance=new SpeechSynthesisUtterance(korean.replace(/[.!?,~。！？]/g,'').trim());
      utterance.lang='ko-KR';utterance.rate=.79;
      if(chosenVoice)utterance.voice=chosenVoice;
      window.speechSynthesis.speak(utterance);
    }catch{notice('無法播放韓語，請檢查瀏覽器語音設定。');}
  }
  const nativeWords=phrase=>phrase.ko.trim().split(/\s+/);
  const latinWords=phrase=>phrase.rr.trim().split(/\s+/);
  function createAudioLabel(korean){
    const b=text('button','word-audio','♫');
    b.type='button';
    b.title='播放整個詞語';
    b.setAttribute('aria-label','播放詞語：'+korean);
    b.disabled=!VOICE_READY;
    b.addEventListener('click',()=>say(korean));
    return b;
  }
  function pairedWords(item){
    const line=text('div','speech-line');
    line.lang='ko';
    const words=nativeWords(item),readings=latinWords(item);
    words.forEach((word,i)=>{
      const stripped=word.replace(/[.!?,~。！？]+$/g,'');
      const punctuation=word.slice(stripped.length);
      const group=text('div','word-group');
      const units=text('div','syllable-row');
      const phonetic=SYLLABLES.align(stripped,(readings[i]||'').replace(/[.!?,~。！？]+$/g,''));
      phonetic.forEach(({ko,rr},j)=>{
        const button=text('button','syllable-button');
        button.type='button';
        button.disabled=!VOICE_READY;
        button.title='聽字塊：'+ko;
        button.setAttribute('aria-label','播放韓文字塊 '+ko+'，羅馬拼音 '+rr);
        const glyph=text('span','hangul',ko+(j===phonetic.length-1?punctuation:''));
        const latin=text('span','latin',rr);
        button.append(glyph,latin);
        button.addEventListener('click',()=>say(ko));
        units.append(button);
      });
      group.append(units,createAudioLabel(stripped));
      line.append(group);
    });
    return line;
  }
  function renderCard(item,spotlight=false){
    const card=text('article','quote-card');
    if(spotlight)card.classList.add('spotlight-card');
    const head=text('div','quote-head');
    const type=text('span','quote-source',item.verified?'劇中原句':'原創韓劇風');
    type.classList.add(item.verified?'verified':'original');
    const fav=text('button','favorite',state.favorites.has(idOf(item))?'★':'☆');
    fav.type='button';
    fav.classList.toggle('active',state.favorites.has(idOf(item)));
    fav.setAttribute('aria-pressed',String(state.favorites.has(idOf(item))));
    fav.setAttribute('aria-label',state.favorites.has(idOf(item))?'取消收藏':'收藏句子');
    fav.addEventListener('click',()=>{
      const id=idOf(item);
      if(state.favorites.has(id))state.favorites.delete(id);else state.favorites.add(id);
      save();render();
    });
    head.append(type,fav);
    card.append(head);
    const zh=text('p','chinese',item.zh);
    card.append(zh,pairedWords(item));
    const foot=text('div','quote-foot');
    const attribution=text('span','attribution',item.drama);
    foot.append(attribution);
    if(item.verified&&item.source){
      const link=text('a','source-link','出處 ↗');
      link.href=item.source;
      link.target='_blank';
      link.rel='noopener noreferrer';
      link.setAttribute('aria-label','查看《'+item.drama+'》台詞參考來源');
      foot.append(link);
    }
    card.append(foot);
    const controls=text('div','quote-controls');
    const play=text('button','play-button','♫　整句播放');
    play.type='button';play.disabled=!VOICE_READY;
    play.setAttribute('aria-label','播放完整台詞：'+item.ko);
    play.addEventListener('click',()=>say(item.ko));
    const copy=text('button','copy-button','複製韓文');
    copy.type='button';
    copy.addEventListener('click',()=>{
      if(!navigator.clipboard?.writeText){notice('請長按台詞來複製。');return;}
      navigator.clipboard.writeText(item.ko).then(()=>notice('已複製韓文台詞')).catch(()=>notice('無法複製，請長按台詞。'));
    });
    controls.append(play,copy);
    card.append(controls);
    return card;
  }
  function filtered(){
    return all.filter(item=>{
      if(state.category==='favorites'&&!state.favorites.has(idOf(item)))return false;
      if(state.category!=='favorites'&&state.category!=='all'&&state.category!==item.section)return false;
      if(state.kind==='verified'&&!item.verified)return false;
      if(state.kind==='original'&&item.verified)return false;
      const q=state.query.toLocaleLowerCase();
      return !q||[item.ko,item.rr,item.zh,item.drama,item.sectionName].some(v=>v.toLocaleLowerCase().includes(q));
    });
  }
  function renderNav(){
    const host=$('categoryNav');host.replaceChildren();
    const nav=[{id:'all',title:'全部'},{id:'favorites',title:'☆ 收藏'},...SECTIONS];
    nav.forEach(cat=>{
      const b=text('button','category-chip',cat.title);
      b.type='button';
      b.classList.toggle('active',cat.id===state.category);
      b.setAttribute('aria-pressed',String(cat.id===state.category));
      b.addEventListener('click',()=>{
        state.category=cat.id;state.spotlight=null;
        render();$('sections').scrollIntoView?.({block:'start'});
      });
      host.append(b);
    });
  }
  function render(){
    renderNav();
    document.querySelectorAll('#sourceFilters button').forEach(b=>{
      const active=state.kind===b.dataset.kind;
      b.setAttribute('aria-pressed',String(active));
      b.classList.toggle('active',active);
    });
    const matches=filtered();
    $('resultCount').textContent=matches.length+' 句';
    const host=$('sections');host.replaceChildren();
    for(const section of SECTIONS){
      const entries=matches.filter(item=>item.section===section.id);
      if(!entries.length)continue;
      const panel=text('section','scene-section');
      const heading=text('div','section-heading');
      const headingText=text('div','heading-text');
      headingText.append(text('h2','',section.title),text('p','',section.subtitle));
      heading.append(headingText,text('span','section-count',entries.length+' 句'));
      panel.append(heading);
      const grid=text('div','quote-grid');
      entries.forEach(item=>grid.append(renderCard(item)));
      panel.append(grid);host.append(panel);
    }
    if(!matches.length){
      const empty=text('div','empty');
      empty.append(text('h2','','沒有符合的對白'),text('p','','試試切換分類，或輸入「想你」、「鬼怪」、「사랑」。'));
      const back=text('button','reset-button','顯示全部');
      back.type='button';
      back.addEventListener('click',()=>{
        state.category='all';state.kind='all';state.query='';state.spotlight=null;
        $('searchInput').value='';render();
      });
      empty.append(back);host.append(empty);
    }
    const feature=$('featured');feature.replaceChildren();
    const featuredItem=matches.find(item=>idOf(item)===state.spotlight);
    feature.hidden=!featuredItem;
    if(featuredItem){
      const top=text('div','feature-heading');
      top.append(text('strong','','今天的一句 · '+featuredItem.sectionName),text('span','','✦'));
      feature.append(top,renderCard(featuredItem,true));
    }
  }
  $('searchInput').addEventListener('input',ev=>{
    state.query=ev.target.value.trim();state.spotlight=null;render();
  });
  document.querySelectorAll('#sourceFilters button').forEach(b=>b.addEventListener('click',()=>{
    state.kind=b.dataset.kind;state.spotlight=null;render();
  }));
  $('randomBtn').addEventListener('click',()=>{
    const pool=filtered();
    if(!pool.length){notice('目前沒有符合條件的台詞。');return;}
    const chosen=pool[Math.floor(Math.random()*pool.length)];
    state.spotlight=idOf(chosen);render();
    $('featured').scrollIntoView?.({block:'start',behavior:'smooth'});
  });
  if(VOICE_READY){
    selectVoice();
    window.speechSynthesis.addEventListener?.('voiceschanged',selectVoice);
  }
  render();
})();
