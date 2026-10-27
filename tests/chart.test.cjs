'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function setup(){
  const dom=new Map();
  class Element{
    constructor(tag='div'){
      this.tag=tag;this.children=[];this.events={};this.attrs={};
      this.hidden=false;this.value='';this.textContent='';this.checked=false;
      this.style={};this.dataset={};this.classList={toggle(){},add(){}};
    }
    append(...children){this.children.push(...children)}
    replaceChildren(...children){this.children=children}
    addEventListener(event,fn){this.events[event]=fn}
    setAttribute(key,value){this.attrs[key]=value}
    close(){this.closed=true}
    scrollIntoView(){}
  }
  const document={
    readyState:'loading',
    createElement:tag=>new Element(tag),
    getElementById:id=>{if(!dom.has(id))dom.set(id,new Element(id));return dom.get(id)},
    querySelectorAll:()=>[],
    addEventListener(){}
  };
  const saved=new Map(),localStorage={getItem:key=>saved.get(key)||null,setItem:(key,v)=>saved.set(key,v)};
  const window={};
  const code=fs.readFileSync(path.resolve(__dirname,'../app.js'),'utf8');
  const ctx={document,localStorage,window,console,Date};
  vm.runInNewContext(code+'\nthis.api={VOWELS,CONSONANTS,state,letterPool,updateChart};',ctx);
  const chart=()=>document.getElementById('chartBody').children.slice(1).map(s=>({
    title:s.children[0].children[0].textContent,
    buttons:s.children[1].children
  }));
  const click=letter=>{
    for(const section of chart()){
      const button=section.buttons.find(b=>b.children[0].textContent===letter);
      if(button){button.events.click();return}
    }
    throw Error('Missing letter '+letter);
  };
  return {api:ctx.api,dom,chart,click,saved};
}

test('reference displays 40 modern Hangul jamo by category',()=>{
  const {api,chart}=setup();
  assert.equal(api.VOWELS.length,21);
  assert.equal(api.CONSONANTS.length,19);
  assert.equal(api.letterPool().length,24,'Default exercises must stay beginner-friendly');
  api.updateChart();
  assert.equal(chart().length,4);
  assert.deepEqual(Array.from(chart(),s=>s.buttons.length),[10,11,14,5]);
  assert.equal(chart().reduce((sum,s)=>sum+s.buttons.length,0),40);
});

test('advanced letters are displayed even when outside practice settings',()=>{
  const {api,chart}=setup();
  api.updateChart();
  const advanced=chart()[1].buttons.find(b=>b.children[0].textContent==='ㅙ');
  assert.ok(advanced);
  assert.equal(advanced.attrs['aria-label'],'加入練習並查看 ㅙ');
});

test('selecting extension vowels or tense consonants enables the selected character',()=>{
  const {api,click}=setup();
  api.updateChart();
  click('ㅙ');
  assert.equal(api.state.settings.advancedVowels,true);
  assert.ok(api.letterPool().some(x=>x.ko==='ㅙ'));
  assert.equal(api.state.current.ko,'ㅙ');
  api.updateChart();
  click('ㄲ');
  assert.equal(api.state.settings.tenseConsonants,true);
  assert.ok(api.letterPool().some(x=>x.ko==='ㄲ'));
  assert.equal(api.state.current.ko,'ㄲ');
});

test('selecting a letter excluded by vowel-only or consonant-only mode is always possible',()=>{
  const {api,click}=setup();
  api.state.settings.letterFilter='consonant';
  api.updateChart();
  click('ㅐ');
  assert.equal(api.state.settings.letterFilter,'all');
  assert.equal(api.state.current.ko,'ㅐ');
  api.state.settings.letterFilter='vowel';
  api.updateChart();
  click('ㅆ');
  assert.equal(api.state.settings.letterFilter,'all');
  assert.equal(api.state.current.ko,'ㅆ');
});

test('all original basic characters remain directly selectable',()=>{
  const {api,chart}=setup();
  api.updateChart();
  const basic=[...api.VOWELS.filter(v=>!v.advanced),...api.CONSONANTS.filter(c=>!c.advanced)];
  const existing=new Set(chart().flatMap(section=>section.buttons.map(b=>b.children[0].textContent)));
  for(const letter of basic)assert.ok(existing.has(letter.ko),letter.ko);
});
