'use strict';
// Short, independently sourced drama excerpts are marked "verified" and link
// to an external reference. All other lines are new, original Korean-drama-style
// writing, not quotations from existing television scripts.
const DRAMA_SCENES = [
  {id:'iconic',title:'經典名場面',subtitle:'真正出現在韓劇裡的短句',items:[
    ['너와 함께한 시간 모두 눈부셨다.','neowa hamkkehan sigan modu nunbusyeotda.','與你一起的時光，全都耀眼。','鬼怪 · 도깨비','https://v.daum.net/v/20250605171034042'],
    ['사과할까요? 고백할까요?','sagwahalkkayo? gobaekhalkkayo?','我要道歉，還是告白？','太陽的後裔 · 태양의 후예','https://www.newspim.com/news/view/20151231000473'],
    ['나는 네 옆에 있을게.','naneun ne yeope isseulge.','我會留在你身邊。','淚之女王 · 눈물의 여왕','https://sports.donga.com/ent/article/all/20240507/124815808/1'],
    ['좋아해. 내가 너 좋아한다고.','joahae. naega neo joahandago.','喜歡你，我說我喜歡你。','背著善宰跑 · 선재 업고 튀어','https://littlefunthings.netlify.app/koreanstudy/0077/'],
    ['날 추앙해요.','nal chuanghaeyo.','請崇拜我。','我的出走日記 · 나의 해방일지','https://www.hankyung.com/article/202204116665H'],
    ['나 너 좋아하냐?','na neo joahanya?','我是不是喜歡你？','繼承者們 · 상속자들','https://www.insight.co.kr/newsRead.php?ArtNo=104061'],
    ['길라임 씨는 몇 살 때부터 그렇게 예뻤나?','gillaim ssineun myeot sal ttaebuteo geureoke yeppeonna?','吉羅琳小姐，妳從幾歲開始這麼漂亮？','秘密花園 · 시크릿 가든','https://www.insight.co.kr/newsRead.php?ArtNo=104061'],
    ['여름의 한가운데에 우리가 있었다.','yeoreumui hangaundee uriga isseotda.','盛夏的正中央，有我們。','二十五，二十一 · 스물다섯 스물하나','https://www.namu.moe/w/스물다섯%20스물하나/명대사'],
    ['합시다, 러브. 나랑 같이.','hapsida, reobeu. narang gachi.','來談戀愛吧，跟我一起。','陽光先生 · 미스터 션샤인','https://www.yeongnam.com/web/view.php?key=20210113010001590'],
    ['나 버리지 마.','na beoriji ma.','不要丟下我。','那年，我們的夏天 · 그 해 우리는','https://m.namu.moe/w/그%20해%20우리는/명대사'],
    ['좋아, 아주 내 맘에 쏙 들어.','joa, aju nae mame ssok deureo.','好啊，我真的非常中意。','德魯納酒店 · 호텔 델루나','https://namu.moe/w/호텔%20델루나/명대사']
  ].map(([ko,rr,zh,drama,source])=>({ko,rr,zh,drama,source,verified:true}))},
  {id:'confession',title:'深情告白',subtitle:'喜歡上你之後，連沉默都有了心跳',items:[
    ['너를 만나고 나서야 사랑이 뭔지 알았어.','neoreul mannago naseoya sarangi mwonji arasseo.','遇見你以後，我才知道什麼是愛。'],
    ['내 하루는 언제나 너로 시작해.','nae haruneun eonjena neoro sijakae.','我的每一天，總是從你開始。'],
    ['좋아한다는 말로는 내 마음을 다 전할 수 없어.','joahandaneun malloneun nae maeumeul da jeonhal su eopseo.','只說喜歡，根本說不完我的心意。'],
    ['네가 웃으면 나도 이유 없이 행복해져.','nega useumyeon nado iyu eopsi haengbokaejyeo.','只要你笑，我就莫名地幸福。'],
    ['그냥 너라서 좋은 거야.','geunyang neoraseo joeun geoya.','沒有別的理由，因為是你才喜歡。'],
    ['오늘은 꼭 말하고 싶었어. 사랑해.','oneureun kkok malhago sipeosseo. saranghae.','今天無論如何都想告訴你：我愛你。'],
    ['세상에 사람이 이렇게 많은데 난 너만 보여.','sesange sarami ireoke maneunde nan neoman boyeo.','世界上明明有這麼多人，我眼裡卻只有你。']
  ]},
  {id:'longing',title:'想念與距離',subtitle:'說不出口的想念，最適合下雨天',items:[
    ['보고 싶어. 오늘은 유난히 더.','bogo sipeo. oneureun yunanhi deo.','好想你，今天尤其想。'],
    ['멀리 있어도 내 마음은 항상 네 곁에 있어.','meolli isseodo nae maeumeun hangsang ne gyeote isseo.','就算距離很遠，我的心也一直在你身旁。'],
    ['너 없는 밤은 왜 이렇게 길까?','neo eomneun bameun wae ireoke gilkk a?','沒有你的夜晚，怎麼這麼漫長？'],
    ['하루 종일 네 목소리가 생각났어.','haru jongil ne moksoriga saenggangnasseo.','一整天都想著你的聲音。'],
    ['전화기 너머로라도 네 웃음이 듣고 싶어.','jeonhwagi neomeororado ne useumi deutgo sipeo.','即使隔著電話，也想聽見你的笑聲。'],
    ['같은 하늘 아래 있다는 게 위로가 돼.','gateun haneul arae itdaneun ge wiroga dwae.','想到我們還在同一片天空下，就覺得安慰。'],
    ['너를 기다리는 시간도 내겐 소중해.','neoreul gidarineun sigando naegen sojunghae.','連等待你的時間，對我都很珍貴。']
  ]},
  {id:'fate',title:'命運與心動',subtitle:'有些相遇，像命運早就寫好的答案',items:[
    ['그날 너를 만난 건 우연이 아니었나 봐.','geunal neoreul mannan geon uyeoni anieonna bwa.','那天遇見你，大概不是偶然。'],
    ['시간을 돌려도 난 다시 너에게 갈 거야.','siganeul dollyeodo nan dasi neoege gal geoya.','就算時光倒流，我還是會走向你。'],
    ['우리가 만난 그 순간을 아직도 기억해.','uriga mannan geu sunganeul ajikdo gieokae.','我們相遇的那瞬間，我到現在都記得。'],
    ['네 이름을 부르면 마음이 먼저 대답해.','ne ireumeul bureumyeon maeumi meonjeo daedapae.','只要喊你的名字，心就先有了回應。'],
    ['수많은 사람 속에서 널 알아본 건 기적이야.','sumaneun saram sogeseo neol arabon geon gijeogiya.','在人海裡認出你，就是奇蹟。'],
    ['첫눈이 오던 날 네가 떠올랐어.','cheonnuni odeon nal nega tteoollasseo.','初雪落下那天，我想起了你。'],
    ['이 마음은 처음부터 너를 향하고 있었어.','i maeumeun cheoeumbuteo neoreul hyanghago isseosseo.','這顆心從一開始，就朝著你。']
  ]},
  {id:'promise',title:'守護與承諾',subtitle:'不只是說愛你，還想陪你走下去',items:[
    ['힘든 날엔 내 어깨에 기대도 돼.','himdeun naren nae eokkaee gidaedo dwae.','辛苦的日子，可以靠在我肩上。'],
    ['네가 어디에 있든 내가 찾아갈게.','nega eodie itdeun naega chajagalge.','不論你在哪裡，我都會去找你。'],
    ['세상이 널 외면해도 난 네 편이야.','sesangi neol oemyeonhaedo nan ne pyeoniya.','就算全世界背對你，我也會站在你這邊。'],
    ['우리 천천히 오래 사랑하자.','uri cheoncheonhi orae saranghaja.','我們慢慢地、久久地相愛吧。'],
    ['아무 말 안 해도 괜찮아. 그냥 곁에 있을게.','amu mal an haedo gwaenchana. geunyang gyeote isseulge.','什麼都不說也沒關係，我會陪著你。'],
    ['네 눈물이 마를 때까지 여기 있을게.','ne nunmuri mareul ttaekkaji yeogi isseulge.','在你眼淚流乾之前，我都會在這裡。'],
    ['내일도 모레도 너와 함께하고 싶어.','naeildo moredo neowa hamkkehago sipeo.','明天、後天，也想和你在一起。']
  ]},
  {id:'heartbreak',title:'心碎與離別',subtitle:'最捨不得的，往往是沒說完的話',items:[
    ['사랑하는데 왜 우리는 자꾸 멀어질까?','saranghaneunde wae urineun jakku meoreojilkka?','明明相愛，為什麼我們卻越來越遠？'],
    ['잊으려고 할수록 더 선명해져.','ijeuryeogo halsurok deo seonmyeonghaejyeo.','越想忘記，反而越清晰。'],
    ['괜찮다고 말했지만 사실 하나도 안 괜찮아.','gwaenchantago malhaetjiman sasil hanado an gwaenchana.','雖然說了沒事，其實一點也不好。'],
    ['우리가 사랑했던 건 거짓말이 아니잖아.','uriga saranghaetdeon geon geojinmari anijana.','我們曾經相愛，並不是謊言啊。'],
    ['돌아오지 않을 걸 알면서도 기다렸어.','doraoji aneul geol almyeonseodo gidaryeosseo.','明知道你不會回來，我還是等了。'],
    ['안녕이라는 말이 이렇게 어려울 줄 몰랐어.','annyeongiraneun mari ireoke eoryeoul jul mollasseo.','沒想到一句再見，竟然這麼難。'],
    ['널 놓아주는 것도 사랑일까?','neol noajuneun geotdo sarangilkka?','放你走，也算是一種愛嗎？']
  ]},
  {id:'reunion',title:'重逢與餘生',subtitle:'好久不見，這次不想再錯過',items:[
    ['다시 만나면 꼭 안아 주고 싶었어.','dasi mannamyeon kkok ana jugo sipeosseo.','如果再見面，一定要好好抱著你。'],
    ['이제 다시는 널 놓치고 싶지 않아.','ije dasineun neol nochigo sipji ana.','這一次，我再也不想錯過你。'],
    ['기다려 줘서 고마워.','gidaryeo jwoseo gomawo.','謝謝你一直等我。'],
    ['오랜 시간이 지나도 마음은 그대로였어.','oraen sigani jinado maeumeun geudaeroyeosseo.','即使過了好久，我的心還是沒有變。'],
    ['우리 다시 시작해 볼래?','uri dasi sijakae bollae?','我們要不要重新開始？'],
    ['마지막 사랑이 너였으면 좋겠어.','majimak sarangi neoyeosseumyeon jokesseo.','希望我的最後一段愛情，是你。'],
    ['남은 계절도 너와 같이 걷고 싶어.','nameun gyejeoldo neowa gachi geotgo sipeo.','往後的每個季節，我都想和你一起走。']
  ]}
];
for(const category of DRAMA_SCENES){
  category.items=category.items.map(item=>Array.isArray(item)?{ko:item[0],rr:item[1],zh:item[2],drama:'原創 · 韓劇風對白',verified:false}:item);
}
window.DRAMA_SCENES=DRAMA_SCENES;
