'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const fromDrama=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const syllableSource=()=>fs.readFileSync(path.join(__dirname,'../travel/syllables.js'),'utf8');

function environment(speaking=false){
  const window={};
  vm.runInNewContext(syllableSource(),{window});
  vm.runInNewContext(fromDrama('lines.js'),{window});
  const elements=new Map();
  class Element{
    constructor(tag='div'){
      this.tag=tag;this.children=[];this.events={};this.attrs={};this.dataset={};
      this.hidden=false;this.value='';this.textContent='';this.disabled=false;
      this.classList={add(){},toggle(){}};
    }
    append(...children){this.children.push(...children)}
    replaceChildren(...children){this.children=children}
    setAttribute(k,v){this.attrs[k]=String(v)}
    addEventListener(k,fn){this.events[k]=fn}
    scrollIntoView(){}
  }
  const filters=['all','verified','original'].map(kind=>{
    const b=new Element('button');b.dataset.kind=kind;return b;
  });
  const document={
    createElement:tag=>new Element(tag),
    getElementById:id=>{
      if(!elements.has(id))elements.set(id,new Element(id));
      return elements.get(id);
    },
    querySelectorAll(selector){
      if(selector==='#sourceFilters button')return filters;
      return [];
    }
  };
  const memory=new Map();
  const localStorage={
    getItem:key=>memory.get(key)||null,
    setItem:(key,val)=>memory.set(key,val)
  };
  const audio=[];
  const speechSynthesis={
    getVoices:()=>[{lang:'ko-KR',name:'Sora'}],
    cancel:()=>{},
    speak:utterance=>audio.push(utterance.text),
    addEventListener(){}
  };
  const SpeechSynthesisUtterance=class {
    constructor(text){this.text=text}
  };
  if(speaking){window.speechSynthesis=speechSynthesis;window.SpeechSynthesisUtterance=SpeechSynthesisUtterance}
  const context={
    window,document,localStorage,navigator:{clipboard:{writeText:async()=>{}}},
    console
  };
  if(speaking){context.SpeechSynthesisUtterance=SpeechSynthesisUtterance;}
  vm.runInNewContext(fromDrama('drama.js'),context);
  return {window,document,elements,filters,memory,audio};
}
function countCards(node){
  if(!node)return 0;
  return (node.tag==='article'?1:0)+(node.children||[]).reduce((sum,child)=>sum+countCards(child),0);
}

test('Sources identify genuine snippets and original lines separately',()=>{
  const {window}=environment();
  const all=window.DRAMA_SCENES.flatMap(section=>section.items);
  assert.equal(window.DRAMA_SCENES.length,7);
  assert.equal(all.length,54);
  assert.equal(all.filter(line=>line.verified).length,12);
  assert.equal(all.filter(line=>!line.verified).length,42);
  assert.equal(new Set(all.map(line=>line.ko)).size,54);
  for(const line of all){
    assert.ok(line.ko.length>2&&line.zh.length>1&&line.rr.length>2);
    assert.equal(Boolean(line.source),line.verified);
    if(line.verified)assert.match(line.source,/^https:\/\//);
    else assert.match(line.drama,/原創/);
  }
});

test('All lines map every Hangul syllable to the supplied romanization',()=>{
  const {window}=environment();
  for(const section of window.DRAMA_SCENES)for(const line of section.items){
    const ko=line.ko.split(/\s+/),rr=line.rr.split(/\s+/);
    assert.equal(ko.length,rr.length,'word mismatch: '+line.ko);
    ko.forEach((word,index)=>{
      const letters=word.replace(/[.!?,~。！？]+$/g,'');
      const roman=rr[index].replace(/[.!?,~。！？]+$/g,'');
      const alignment=window.TRAVEL_SYLLABLES.align(letters,roman);
      assert.equal(alignment.map(a=>a.ko).join(''),letters);
      assert.equal(alignment.map(a=>a.rr).join(''),roman);
      assert.equal(alignment.length,Array.from(letters).length);
    });
  }
});

test('Desktop/mobile independent document structure renders and filters',()=>{
  const env=environment();
  const {elements,filters}=env;
  assert.equal(elements.get('categoryNav').children.length,9);
  assert.equal(elements.get('sections').children.length,7);
  assert.equal(countCards(elements.get('sections')),54);
  assert.equal(elements.get('resultCount').textContent,'54 句');
  filters[1].events.click();
  assert.equal(elements.get('resultCount').textContent,'12 句');
  assert.equal(countCards(elements.get('sections')),12);
  filters[2].events.click();
  assert.equal(countCards(elements.get('sections')),42);
});

test('Search, favorite and random quote remain interactive',()=>{
  const {elements,memory}=environment();
  const search=elements.get('searchInput');
  search.events.input({target:{value:'鬼怪'}});
  assert.equal(countCards(elements.get('sections')),1);
  search.events.input({target:{value:''}});
  const firstCard=elements.get('sections').children[0].children[1].children[0];
  firstCard.children[0].children[1].events.click();
  assert.ok(memory.has('hangul-haru-drama-favorites-v1'));
  elements.get('categoryNav').children[1].events.click();
  assert.equal(countCards(elements.get('sections')),1);
  elements.get('randomBtn').events.click();
  assert.equal(elements.get('featured').hidden,false);
  assert.equal(countCards(elements.get('featured')),1);
});

test('Audio buttons speak single syllable, entire word, and sentence independently',()=>{
  const {elements,audio}=environment(true);
  const card=elements.get('sections').children[0].children[1].children[0];
  const firstWord=card.children[2].children[0];
  const firstSyllable=firstWord.children[0].children[0];
  firstSyllable.events.click();
  assert.equal(audio[0],'너');
  firstWord.children[1].events.click();
  assert.equal(audio[1],'너와');
  card.children[4].children[0].events.click();
  assert.equal(audio[2],'너와 함께한 시간 모두 눈부셨다');
});
