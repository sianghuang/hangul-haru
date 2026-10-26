'use strict';
// Render one Korean syllable block directly above its matching romanization.
// The original word-level romanization is kept intact: we find its syllable
// boundaries instead of independently converting each letter (which loses
// Korean liaison/assimilation in words such as 실이 and 합니다).
(function(){
  const ONSET = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
  const VOWEL = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
  const CODA = ['', 'k','k','ks','n','nj','nh','t','l','lk','lm','lb','ls','lt','lp','lh','m','p','ps','t','t','ng','t','t','k','t','p','t'];

  // Explicit phonetic boundaries for frequently-used Korean sound changes.
  // Joining every entry still gives exactly the existing phrase romanization.
  const OVERRIDES = {
    '감사합니다':['gam','sa','ham','ni','da'],
    '죄송합니다':['joe','song','ham','ni','da'],
    '괜찮아요':['gwaen','cha','na','yo'],
    '화장실이':['hwa','jang','si','ri'],
    '한국어':['han','gu','geo'],
    '한국어를':['han','gu','geo','reul'],
    '있어요':['i','sseo','yo'],
    '맛있어요':['ma','si','sseo','yo'],
    '알레르기가':['al','le','reu','gi','ga'],
    '있나요':['in','na','yo'],
    '좋네요':['jon','ne','yo'],
    '맞아요':['ma','ja','yo'],
    '앉아도':['an','ja','do'],
    '잃었어요':['i','reo','sseo','yo'],
    '잃어버렸어요':['i','reo','beo','ryeo','sseo','yo'],
    '했어요':['hae','sseo','yo'],
    '예약했어요':['ye','ya','kae','sseo','yo'],
    '예약해야':['ye','ya','kae','ya'],
    '걸어서':['geo','reo','seo'],
    '길을':['gi','reul'],
    '물':['mul'],
    '물이':['mu','ri'],
    '몸이':['mo','mi'],
    '열이':['yeo','ri'],
    '줄은':['ju','reun'],
    '들어갈':['deu','reo','gal'],
    '입어':['i','beo'],
    '찍어':['jji','geo'],
    '찍어도':['jji','geo','do'],
    '먹어요':['meo','geo','yo'],
    '먹을게요':['meo','geul','ge','yo'],
    '신어':['si','neo'],
    '닫아요':['da','da','yo'],
    '처음이에요':['cheo','eu','mi','e','yo'],
    '지하철역이':['ji','ha','cheol','yeo','gi'],
    '체크아웃은':['che','keu','a','u','teun'],
    '체크아웃할':['che','keu','a','ut','hal'],
    '재미있어요':['jae','mi','i','sseo','yo'],
    '왔어요':['wa','sseo','yo'],
    '정말':['jeong','mal'],
    '말씀해':['mal','sseum','hae'],
    '오늘':['o','neul']
  };

  function syllableGuess(character){
    const code=character.codePointAt(0)-0xAC00;
    if(code<0 || code>11171) return character.toLowerCase();
    const start=Math.floor(code/588);
    const vowel=Math.floor((code%588)/28);
    const final=code%28;
    return ONSET[start]+VOWEL[vowel]+CODA[final];
  }
  function distance(a,b){
    const previous=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){
      let prev=previous[0];
      previous[0]=i;
      for(let j=1;j<=b.length;j++){
        const old=previous[j];
        previous[j]=Math.min(previous[j]+1,previous[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));
        prev=old;
      }
    }
    return previous[b.length];
  }

  // Dynamic programming only decides where to put spaces in the *given*
  // romanization. Even when pronunciation changes, no Latin letters vanish.
  function align(word, roman){
    const characters=Array.from(word);
    const letters=roman.toLowerCase().replace(/[^a-z]/g,'');
    if(!characters.length || !letters) return [];
    const manual=OVERRIDES[word];
    if(manual && manual.length===characters.length && manual.join('')===letters){
      return characters.map((ko,i)=>({ko,rr:manual[i]}));
    }
    const n=characters.length,m=letters.length;
    if(n>m) return characters.map(ko=>({ko,rr:syllableGuess(ko)}));
    const guesses=characters.map(syllableGuess);
    const best=Array.from({length:n+1},()=>Array(m+1).fill(Infinity));
    const from=Array.from({length:n+1},()=>Array(m+1).fill(-1));
    best[0][0]=0;
    for(let i=1;i<=n;i++){
      for(let end=i;end<=m-(n-i);end++){
        for(let start=i-1;start<end;start++){
          if(!Number.isFinite(best[i-1][start])) continue;
          const candidate=letters.slice(start,end);
          const guess=guesses[i-1];
          const cost=best[i-1][start] +
            distance(guess,candidate)*2 +
            Math.abs(candidate.length-guess.length)*.17;
          if(cost<best[i][end]){
            best[i][end]=cost;
            from[i][end]=start;
          }
        }
      }
    }
    if(!Number.isFinite(best[n][m]))return characters.map(ko=>({ko,rr:syllableGuess(ko)}));
    const result=new Array(n);
    let end=m;
    for(let i=n;i>0;i--){
      const start=from[i][end];
      result[i-1]={ko:characters[i-1],rr:letters.slice(start,end)};
      end=start;
    }
    return result;
  }

  window.TRAVEL_SYLLABLES = {align};
})();
