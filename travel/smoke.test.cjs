'use strict';
// Dependency-free smoke tests: run with \`node --test travel/smoke.test.cjs\`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = name => fs.readFileSync(path.join(__dirname, name), 'utf8');

function setup(){
  const win = {};
  vm.runInNewContext(source('phrases.js'), {window:win});
  class Element {
    constructor(tag='div'){
      this.tag=tag;this.children=[];this.attrs={};this.events={};
      this.hidden=false;this.value='';
      this.classList={toggle(){},add(){}};
    }
    append(...items){this.children.push(...items)}
    replaceChildren(...items){this.children=items}
    setAttribute(k,v){this.attrs[k]=v}
    addEventListener(k,callback){this.events[k]=callback}
  }
  const elements = new Map();
  const document={
    getElementById(id){if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id)},
    createElement(tag){return new Element(tag)}
  };
  document.getElementById('numberInput').value='12000';
  const storage=new Map();
  const localStorage={
    getItem(k){return storage.get(k)??null},
    setItem(k,v){storage.set(k,v)}
  };
  const sandbox={window:win,document,localStorage,console};
  vm.runInNewContext(source('travel.js')+'\nthis.testApi={sinoNumber,nativeNumber,state,render};',sandbox);
  return {api:sandbox.testApi,window:win,document,storage,elements};
}

test('Korean phrase corpus has aligned tokens and meaningful categories',()=>{
  const {window}=setup();
  const categories=window.TRAVEL_CATEGORIES;
  assert.equal(categories.length,11);
  assert.equal(categories.reduce((sum,c)=>sum+c.phrases.length,0),124);
  for(const cat of categories){
    assert.ok(cat.label && cat.sub && cat.phrases.length>=8);
    const keys=new Set();
    for(const phrase of cat.phrases){
      assert.equal(phrase.length,3);
      assert.ok(phrase.every(v=>typeof v==='string' && v.trim().length>0));
      const [ko,rr]=phrase;
      assert.equal(ko.trim().split(/\s+/).length,rr.trim().split(/\s+/).length,ko);
      assert.ok(!keys.has(ko),'Duplicate in category: '+ko);
      keys.add(ko);
    }
  }
});

test('Sino-Korean number conversion handles money-sized values',()=>{
  const {api}=setup();
  assert.equal(api.sinoNumber(0).ko,'영');
  assert.equal(api.sinoNumber(10).ko,'십');
  assert.equal(api.sinoNumber(100).ko,'백');
  assert.equal(api.sinoNumber(10000).ko,'만');
  assert.equal(api.sinoNumber(12000).ko,'만 이천');
  assert.equal(api.sinoNumber(2045).ko,'이천사십오');
  assert.equal(api.sinoNumber(99999999).ko,'구천구백구십구만 구천구백구십구');
});

test('Native Korean uses shortened forms before counters',()=>{
  const {api}=setup();
  assert.equal(api.nativeNumber(1,'명').ko,'한 명');
  assert.equal(api.nativeNumber(2,'개').ko,'두 개');
  assert.equal(api.nativeNumber(3,'시').ko,'세 시');
  assert.equal(api.nativeNumber(4,'잔').ko,'네 잔');
  assert.equal(api.nativeNumber(20,'살').ko,'스무 살');
  assert.equal(api.nativeNumber(21,'명').ko,'스물한 명');
  assert.equal(api.nativeNumber(31,'').ko,'서른하나');
});

test('Travel page renders categories, supports search and saves favorites',()=>{
  const {api,document,storage}=setup();
  assert.equal(document.getElementById('categoryNav').children.length,14);
  assert.equal(document.getElementById('phrasesView').children.length,11);
  const section=document.getElementById('phrasesView').children[0];
  const firstCard=section.children[1].children[0];
  const favorite=firstCard.children[0].children[1];
  favorite.events.click();
  assert.equal(api.state.favorites.size,1);
  assert.ok(storage.has('hangul-haru-travel-favorites-v1'));
  api.state.category='favorites';api.render();
  assert.equal(document.getElementById('phrasesView').children.length,1);
  api.state.category='all';
  api.state.query='機場';
  api.render();
  assert.match(document.getElementById('resultsSummary').textContent,/找到 1 句/);
  api.state.category='numbers';api.render();
  assert.equal(document.getElementById('numberGrid').children.length,17);
  assert.equal(document.getElementById('numberResult').children[1].textContent,'만 이천');
});
