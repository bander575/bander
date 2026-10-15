(()=>{
const $=id=>document.getElementById(id),field=$('field');
const asset=k=>ASSETS[k];
document.querySelectorAll('[data-sprite]').forEach(img=>img.src=asset(img.dataset.sprite));
const types={worker:{label:'نملة عاملة',desc:'تحمل الحلوى العادية',speed:1,bag:1,cost:50},fast:{label:'نملة سريعة',desc:'توصل أسرع من العاملة',speed:1.55,bag:1,cost:75},strong:{label:'نملة قوية',desc:'تحمل سكرًا أكثر',speed:.78,bag:1.85,cost:105},guard:{label:'نملة حارسة',desc:'تطرد الحشرات وتحمي العش',speed:1.22,bag:1.05,cost:125}};
const rooms=[
{name:'المطبخ',icon:'🍳',goal:0,desc:'بداية اللعبة بين الرفوف والحلوى',bonus:'عودة أسرع للعش +10%',treats:['cupcake','cookie','pinkcandy','bluecandy','chocolate','lollipop']},
{name:'غرفة المعيشة',icon:'🛋️',goal:120,desc:'كنبة وسجادة وطاولة قهوة وفتات سناكات',bonus:'مكافأة فتات إضافية عند التسليم',treats:['cookie','chocolate','cupcake','pinkcandy','bluecandy','lollipop']},
{name:'الحديقة',icon:'🌱',goal:450,desc:'عشب وزهور وفراولة وممر حجري',bonus:'قيمة الحلوى أعلى +15%',treats:['pinkcandy','bluecandy','lollipop','cupcake','cookie','chocolate']},
{name:'المخزن',icon:'🫙',goal:1000,desc:'صناديق وجرار وأكياس سكر ورفوف',bonus:'فرصة هدية إضافية بعد بعض التسليمات',treats:['chocolate','cookie','bluecandy','pinkcandy','lollipop','cupcake']},
{name:'السطح',icon:'🌤️',goal:1900,desc:'جو مفتوح وأصص ونباتات وطاولة صيفية',bonus:'سرعة النمل أعلى +12%',treats:['lollipop','cupcake','pinkcandy','cookie','chocolate','bluecandy']},
{name:'غرفة السفرة',icon:'🍽️',goal:3200,desc:'طاولة أكل وكيك وفواكه وتمر',bonus:'الحلوى الأسطورية تعطي مكافأة أقوى',treats:['cupcake','chocolate','cookie','lollipop','pinkcandy','bluecandy']}
];
const positions=[[58,46],[78,46],[67,67],[37,68],[85,76],[43,85]],candyKeys=['cupcake','cookie','pinkcandy','bluecandy','chocolate','lollipop'];
const fresh=()=>({sugar:0,total:0,trips:0,speed:0,bag:0,rewardBoost:0,legendLuck:0,pathing:0,teamwork:0,alert:0,area:0,unlocked:0,ants:3,counts:{worker:3,fast:0,strong:0,guard:0},legendaryCollected:0,enemiesDefeated:0,nextLegendary:4,nextEnemy:6,nest:{queen:1,storage:1,nursery:1,guard:1},nextHatch:null,areaMissionClaimed:{},discoveries:0});
let state=fresh();
try{const prev=JSON.parse(localStorage.getItem('ant-kingdom-big-v1')||'null') || JSON.parse(localStorage.getItem('ant-kingdom-art-plus-v4')||'null') || JSON.parse(localStorage.getItem('ant-kingdom-art-plus-v3')||'null');if(prev){state=Object.assign(fresh(),prev);state.counts=Object.assign(fresh().counts,prev.counts||{});state.nest=Object.assign(fresh().nest,prev.nest||{})}else{const old=JSON.parse(localStorage.getItem('ant-kingdom-art-v1')||'null');if(old){state=Object.assign(fresh(),{sugar:old.sugar||0,total:old.total||0,trips:old.trips||0,speed:old.speed||0,bag:old.bag||0,area:old.area||0,unlocked:old.unlocked||0,ants:old.ants||3,counts:{worker:Math.max(3,old.ants||3),fast:0,strong:0,guard:0}})}}}catch(e){}
state.counts.worker=Math.max(3,Math.min(20,Number(state.counts.worker)||3));for(const k of ['fast','strong','guard'])state.counts[k]=Math.max(0,Math.min(20,Number(state.counts[k])||0));
state.unlocked=Math.max(0,Math.min(rooms.length-1,Number(state.unlocked)||0));state.area=Math.max(0,Math.min(state.unlocked,Number(state.area)||0));
state.nest=Object.assign(fresh().nest,state.nest||{});state.areaMissionClaimed=(state.areaMissionClaimed&&typeof state.areaMissionClaimed==='object')?state.areaMissionClaimed:{};state.discoveries=Number(state.discoveries)||0;
for(const id of ['queen','storage','nursery','guard'])state.nest[id]=Math.max(1,Math.min(10,Math.floor(Number(state.nest[id])||1)));
if(state.nextHatch==null||!Number.isFinite(Number(state.nextHatch)))state.nextHatch=Number(state.trips||0)+hatchTrips();

const ants=[],candies=[];let legendary=null,enemy=null,last=0,lastSave=0,toastTimer=null;
function save(){try{localStorage.setItem('ant-kingdom-big-v1',JSON.stringify(state))}catch(e){}}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),1750)}
const fmt=n=>Math.floor(n).toLocaleString('en-US');
const nestDefs={
 queen:{name:'غرفة الملكة',base:125,growth:1.61},
 storage:{name:'مخزن السكر',base:95,growth:1.60},
 nursery:{name:'الحضانة',base:115,growth:1.59},
 guard:{name:'غرفة الحراسة',base:100,growth:1.60}
};
function nestCost(id){const level=state.nest[id];return level>=10?0:Math.round(nestDefs[id].base*Math.pow(nestDefs[id].growth,level-1))}
function maxAnts(){return 20+2*(state.nest.queen-1)}
function queenBonus(){return 1+0.05*(state.nest.queen-1)}
function sugarCapacity(){return 1200+900*(state.nest.storage-1)}
function hatchTrips(){return Math.max(6,20-2*(state.nest.nursery-1))}
function hireDiscount(){return 1-Math.min(.27,.03*(state.nest.nursery-1))}
function guardDefense(){return Math.min(.9,.10*state.nest.guard)}
function rewardBonus(){return 1+state.rewardBoost*.14}
function legendInterval(){return Math.max(4,8-state.legendLuck)}
function pathBonus(){return 1+state.pathing*.08}
function legendaryNeed(){return state.teamwork>=2?2:3}
function enemySlow(){return Math.max(.55,1-state.alert*.08)}
function roomData(){return rooms[state.area]}
function areaRewardMultiplier(){return state.area===2?1.15:1}
function areaSpeedMultiplier(){return state.area===0?1.10:state.area===4?1.12:1}
function areaLegendMultiplier(){return state.area===5?1.6:1}
function areaMissionGoal(){return [120,180,260,380,540,760][state.area]}
function areaMissionReward(){return [40,65,95,140,190,260][state.area]}
function currentMissionKey(){return 'area'+state.area+'_'+Math.floor((state.areaMissionClaimed['cycle'+state.area]||0))}
function missionCollected(){return state.areaMissionClaimed[currentMissionKey()]||0}
function addMissionProgress(v){const k=currentMissionKey();state.areaMissionClaimed[k]=(state.areaMissionClaimed[k]||0)+v}
function canClaimMission(){return missionCollected()>=areaMissionGoal()&&!state.areaMissionClaimed[currentMissionKey()+'_done']}
function markMissionClaimed(){state.areaMissionClaimed[currentMissionKey()+'_done']=1;state.areaMissionClaimed['cycle'+state.area]=(state.areaMissionClaimed['cycle'+state.area]||0)+1;state.areaMissionClaimed[currentMissionKey()]=0}
function discoveryChance(){return .08+state.legendLuck*.01+(state.area===3?.06:0)}
function depositSugar(amount){const add=Math.max(0,Math.min(Math.round(amount),Math.max(0,sugarCapacity()-state.sugar)));state.sugar+=add;if(add<amount)toast('📦 مخزن السكر ممتلئ — طوّر المخزن');return add}
function checkHatch(){if(state.trips<state.nextHatch)return;state.nextHatch=state.trips+hatchTrips();if(ants.length>=maxAnts()){toast('🥚 وصلت الحضانة للحد الأقصى — طوّر الملكة');return}state.counts.worker++;syncAnts();toast('🥚 فقست نملة جديدة من الحضانة!')}
function drawNest(){
 const lines={
  queen:{value:`الحد الأعلى ${maxAnts()} نملة`,effect:`مكافأة السكر +${Math.round((queenBonus()-1)*100)}%`},
  storage:{value:`${fmt(state.sugar)} / ${fmt(sugarCapacity())} سكر`,effect:`سعة المخزن ${fmt(sugarCapacity())}`},
  nursery:{value:`${fmt(ants.length)} نملة • القادم بعد ${fmt(Math.max(0,state.nextHatch-state.trips))} رحلة`,effect:`فقس كل ${hatchTrips()} رحلة • خصم ${Math.round((1-hireDiscount())*100)}%`},
  guard:{value:`${fmt(state.counts.guard)} حراس • ${fmt(state.enemiesDefeated)} أعداء`,effect:`حماية السكر ${Math.round(guardDefense()*100)}%`}
 };
 for(const [id,v] of Object.entries(lines)){
  $(id+'Level').textContent=`المستوى ${state.nest[id]} / 10`;
  $(id+'Meter').innerHTML=Array.from({length:10},(_,i)=>`<i class="${i<state.nest[id]?'on':''}"></i>`).join('');
  $('nest'+id[0].toUpperCase()+id.slice(1)).textContent=v.value;
  $(id+'Effect').textContent=v.effect;
  const b=document.querySelector('[data-nest="'+id+'"]');
  b.disabled=state.nest[id]>=10||state.sugar<nestCost(id);
  b.textContent=state.nest[id]>=10?'🏆 مكتمل':`🍬 تطوير ${fmt(nestCost(id))}`;
 }
}
function makeAnt(t){const node=document.createElement('div');node.className='ant '+t;node.innerHTML='<img class="antbody" src="'+asset('ant')+'"><img class="cargo" src="'+asset('pinkcandy')+'"><span class="typeLabel">'+({worker:'',fast:'⚡',strong:'💪',guard:'🛡'}[t])+'</span>';field.appendChild(node);return {type:t,x:17+Math.random()*4,y:68+Math.random()*6,phase:'idle',target:null,node,speed:types[t].speed,bag:types[t].bag,cargoKey:'pinkcandy'}}
function syncAnts(){const desired=[];for(const [k,n]of Object.entries(state.counts))for(let i=0;i<n;i++)desired.push(k);while(ants.length<desired.length)ants.push(makeAnt(desired[ants.length]));while(ants.length>desired.length)ants.pop().node.remove();state.ants=desired.length;}
function drawAnt(a){a.node.style.left=a.x+'%';a.node.style.top=a.y+'%';a.node.classList.toggle('hasCargo',a.phase==='back'||a.phase==='backLegend');a.node.classList.toggle('turn',a.phase==='back'||a.phase==='backLegend');a.node.classList.toggle('fighting',a.phase==='intercept');a.node.querySelector('.cargo').src=asset(a.cargoKey)}
function makeCandy(i){const node=document.createElement('button');node.type='button';node.className='sweet';node.setAttribute('aria-label','جمع قطعة '+(i+1));node.style.left=positions[i][0]+'%';node.style.top=positions[i][1]+'%';const kind=(roomData().treats||candyKeys)[i%6];node.innerHTML='<img src="'+asset(kind)+'">';field.appendChild(node);const c={x:positions[i][0],y:positions[i][1],kind,node,stock:true,busy:false,respawn:0,base:[12,8,9,11,14,16][i]};node.addEventListener('click',()=>send(c));return c}
function buildCandy(){for(const c of candies)c.node.remove();candies.length=0;for(let i=0;i<positions.length;i++)candies.push(makeCandy(i));if(legendary){legendary.node.remove();legendary=null;}if(enemy){enemy.node.remove();enemy=null;}}
function renderAreaDecor(){const d=$('areaDecor'); if(!d) return; const a=state.area; $('field').dataset.area=String(a); const scenes=[
`<div class="scene-piece kitchen-warmth"></div><div class="scene-piece kitchen-mat"></div><div class="scene-piece kitchen-fruit" style="left:64%;top:22%">🍎</div><div class="scene-piece kitchen-fruit" style="left:72%;top:24%">🍋</div><div class="scene-piece kitchen-cup"></div><div class="scene-piece kitchen-spoon"></div>`,
`<div class="scene-piece scene-rug"></div><div class="scene-piece scene-sofa"></div><div class="scene-piece scene-table"></div><div class="scene-piece scene-remote"></div><div class="scene-piece living-lamp"></div><div class="scene-piece living-tv"></div><div class="scene-piece living-plant"></div><div class="scene-piece living-snack" style="left:48%;top:49%">🍿</div><div class="scene-piece living-snack" style="left:54%;top:53%">🍪</div>`,
`<div class="scene-piece scene-grass"></div><div class="scene-piece scene-bush" style="left:4%;top:48%"></div><div class="scene-piece scene-bush" style="right:7%;top:44%"></div><div class="scene-piece scene-bush" style="left:18%;top:31%"></div><div class="scene-piece scene-stone" style="left:27%;top:66%"></div><div class="scene-piece scene-stone" style="left:40%;top:60%"></div><div class="scene-piece scene-stone" style="left:54%;top:67%"></div><div class="scene-piece scene-stone" style="left:66%;top:61%"></div><div class="scene-piece scene-berry" style="left:71%;top:30%">🍓</div><div class="scene-piece scene-berry" style="left:20%;top:24%">🍓</div><div class="scene-piece garden-flower" style="left:33%;top:35%">🌼</div><div class="scene-piece garden-flower" style="left:80%;top:39%">🌸</div>`,
`<div class="scene-piece pantry-shelf top"></div><div class="scene-piece pantry-shelf mid"></div><div class="scene-piece scene-crate" style="left:58%;top:56%"></div><div class="scene-piece scene-crate" style="left:77%;top:48%"></div><div class="scene-piece scene-sack" style="left:18%;top:50%"></div><div class="scene-piece scene-sack" style="left:32%;top:56%"></div><div class="scene-piece scene-jar" style="left:61%;top:23%"></div><div class="scene-piece scene-jar" style="left:73%;top:24%"></div><div class="scene-piece scene-jar" style="left:85%;top:25%"></div><div class="scene-piece pantry-tag" style="left:21%;top:44%">سكر</div><div class="scene-piece pantry-tag" style="left:80%;top:41%">كوكيز</div>`,
`<div class="scene-piece scene-roof"></div><div class="scene-piece scene-cloud one"></div><div class="scene-piece scene-cloud two"></div><div class="scene-piece scene-rail"></div><div class="scene-piece scene-pot" style="left:18%;top:41%"></div><div class="scene-piece scene-pot" style="left:72%;top:41%"></div><div class="scene-piece scene-table-round" style="left:42%;top:58%"></div><div class="scene-piece rooftop-umbrella"></div><div class="scene-piece scene-cake" style="left:49%;top:52%">🧁</div><div class="scene-piece rooftop-drink" style="left:58%;top:53%">🥤</div>`,
`<div class="scene-piece dining-wall"></div><div class="scene-piece scene-dining"></div><div class="scene-piece scene-chair" style="left:21%;top:43%"></div><div class="scene-piece scene-chair" style="left:71%;top:43%"></div><div class="scene-piece scene-chair" style="left:21%;top:62%"></div><div class="scene-piece scene-chair" style="left:71%;top:62%"></div><div class="scene-piece dining-runner"></div><div class="scene-piece scene-cake" style="left:45%;top:45%">🎂</div><div class="scene-piece scene-cake" style="left:56%;top:46%">🍇</div><div class="scene-piece scene-cake" style="left:50%;top:52%">🥐</div><div class="scene-piece dining-frame left"></div><div class="scene-piece dining-frame right"></div>`
]; d.innerHTML=scenes[a]||''; }
function ripple(x,y){const el=document.createElement('div');el.className='ripple';el.style.left=x+'%';el.style.top=y+'%';field.appendChild(el);setTimeout(()=>el.remove(),700)}
function pop(msg,x,y){const el=document.createElement('div');el.className='float';el.textContent=msg;el.style.left=x+'%';el.style.top=y+'%';field.appendChild(el);setTimeout(()=>el.remove(),900)}
function freeAnts(){return ants.filter(a=>a.phase==='idle')}
function send(c){if(!c.stock||c.busy)return;ripple(c.x,c.y);if(c.legendary){const need=legendaryNeed(),available=freeAnts();if(available.length<need){toast('👑 الحلوى الأسطورية تحتاج '+need+' نملات فاضية');return}c.busy=true;c.node.classList.add('busy');c.assigned=available.slice(0,need);c.returned=0;c.claimed=false;c.assigned.forEach(a=>{a.target=c;a.phase='toLegend';a.cargoKey=c.kind});$('help').textContent='👑 '+need+' نملات رايحات للحلوى الأسطورية!';return;}
const idle=freeAnts().sort((a,b)=>(a.type==='guard')-(b.type==='guard')||b.speed-a.speed);const a=idle[0];if(!a){toast('🐜 كل النمل مشغول الآن');return}c.busy=true;c.node.classList.add('busy');a.target=c;a.phase='to';a.cargoKey=c.kind;$('help').textContent='🐜 نملة رايحة للحلوى اللي اخترتها…'}
function spawnLegend(){if(legendary||state.trips<state.nextLegendary)return;const node=document.createElement('button');node.type='button';node.className='legendary';node.style.left='48%';node.style.top='56%';const lk=roomData().treats[0]||'cupcake';node.innerHTML='<img src="'+asset(lk)+'"><span class="legendLabel">👑 أسطورية ×'+legendaryNeed()+'</span>';field.appendChild(node);legendary={x:48,y:56,kind:roomData().treats[0]||'cupcake',node,stock:true,busy:false,assigned:[],returned:0,claimed:false,legendary:true};node.addEventListener('click',()=>send(legendary));state.nextLegendary=state.trips+legendInterval();toast('✨ ظهرت حلوى أسطورية!')}
function makeEnemySVG(){return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="redbug" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fb8c52"/><stop offset="1" stop-color="#ae2e29"/></linearGradient></defs><path d="M30 60L13 76 M37 65L33 86 M70 61L87 78 M65 70L69 87" stroke="#382a26" stroke-width="6" stroke-linecap="round"/><ellipse cx="51" cy="55" rx="33" ry="28" fill="#482b26"/><ellipse cx="52" cy="48" rx="30" ry="27" fill="url(#redbug)"/><path d="M52 22V73" stroke="#68231f" stroke-width="5"/><circle cx="38" cy="42" r="7" fill="#42251e"/><circle cx="66" cy="51" r="6" fill="#42251e"/><circle cx="37" cy="60" r="5" fill="#42251e"/><circle cx="56" cy="30" r="5" fill="#42251e"/><circle cx="33" cy="21" r="10" fill="#432e26"/><circle cx="30" cy="19" r="3" fill="white"/><path d="M24 14Q18 4 9 5 M39 15Q41 6 46 3" stroke="#382a26" stroke-width="4" fill="none"/></svg>`}
function spawnEnemy(){if(enemy||state.area===0||state.trips<state.nextEnemy)return;const node=document.createElement('div');node.className='enemy';node.innerHTML=makeEnemySVG()+'<span class="enemyTag">🐞 حشرة</span>';field.appendChild(node);enemy={x:94,y:75,node,target:null};node.addEventListener('click',()=>sendGuard());state.nextEnemy=state.trips+8;toast('🐞 في حشرة قريبة من السكر!')}
function sendGuard(){if(!enemy)return;let g=freeAnts().find(a=>a.type==='guard');if(g){g.target=enemy;g.phase='intercept';$('help').textContent='🛡️ الحارس يطرد الحشرة'}else toast('🛡️ وظّف نملة حارسة لحماية المستعمرة')}
function step(a,x,y,dt){let dx=x-a.x,dy=y-a.y,d=Math.hypot(dx,dy),len=(17+state.speed*6)*pathBonus()*areaSpeedMultiplier()*a.speed*(a.type==='guard'&&a.phase==='intercept'?(1+.22*(state.nest.guard-1)):1)*dt;if(d<=len||d===0){a.x=x;a.y=y;return true}a.x+=dx/d*len;a.y+=dy/d*len;return false}
function reward(c,a){let amount=Math.round(c.base*(1+state.bag*.4)*(1+state.area*.4)*(a?.bag||1)*queenBonus()*rewardBonus()*areaRewardMultiplier()); if(state.area===1&&Math.random()<0.18) amount+=8+state.rewardBoost*2; return amount}
function unlock(){while(state.unlocked<rooms.length-1&&state.total>=rooms[state.unlocked+1].goal){state.unlocked++;toast('🎉 فتحت '+rooms[state.unlocked].name)}}
function price(t){return Math.round(types[t].cost*Math.pow(1.36,state.counts[t]-(t==='worker'?3:0))*hireDiscount())}
function cost(id){return Math.round(({speed:75,bag:100,rewardBoost:110,legendLuck:130,pathing:95,teamwork:120,alert:105})[id]*Math.pow(1.59,state[id]))}
function drawUI(){ $('sugar').textContent=fmt(state.sugar);$('ants').textContent=fmt(ants.length);$('trips').textContent=fmt(state.trips);$('legendCount').textContent=fmt(state.legendaryCollected);$('enemyCount').textContent=fmt(state.enemiesDefeated);
const next=rooms[state.unlocked+1];$('progressLabel').textContent=next?fmt(state.total)+' / '+fmt(next.goal):'مكتملة 🏆';$('progress').style.width=next?Math.min(100,100*state.total/next.goal)+'%':'100%'; if($('currentAreaName')){$('currentAreaName').textContent=roomData().icon+' '+roomData().name;$('currentAreaDesc').textContent=roomData().desc;$('currentAreaBonus').textContent='ميزة المنطقة: '+roomData().bonus;$('missionFill').style.width=Math.min(100, missionCollected()/areaMissionGoal()*100)+'%';$('missionText').textContent=fmt(missionCollected())+' / '+fmt(areaMissionGoal());$('missionReward').textContent='المكافأة '+fmt(areaMissionReward())+' 🍬';$('discoveryCount').textContent=fmt(state.discoveries||0);} 
const upgrades=[['speed','سرعة السير','النمل يتحرك أسرع','ant','+'+Math.round(state.speed*6)+'% سرعة أساسية'],['bag','سعة الحمولة','سكر أكثر لكل رحلة','chocolate','+'+Math.round(state.bag*40)+'% حمولة'],['rewardBoost','مهارة الجمع','مكافآت أعلى لكل تسليم','pinkcandy','+'+Math.round((rewardBonus()-1)*100)+'% مكافآت'],['legendLuck','الحلوى النادرة','تظهر الحلوى الأسطورية أسرع','cupcake','كل '+legendInterval()+' رحلات تقريبًا'],['pathing','ذكاء المسارات','النمل يمشي بكفاءة أعلى','bluecandy','+'+Math.round((pathBonus()-1)*100)+'% حركة'],['teamwork','النقل الجماعي','يساعد في حمل الحلوى الكبيرة','cookie',legendaryNeed()+' نملات للحلوى الأسطورية'],['alert','كشف الأعداء','يبطّئ تقدم الحشرات','lollipop',Math.round((1-enemySlow())*100)+'% إبطاء للأعداء']];$('upgrades').innerHTML=upgrades.map(([id,name,desc,icon,info])=>'<div class="up-card"><div class="drawing"><img src="'+asset(icon)+'"></div><div class="name">'+name+'</div><div class="desc">'+desc+'</div><div class="level">'+info+'</div><button class="buy" data-up="'+id+'" '+(state.sugar<cost(id)?'disabled':'')+'>🍬 '+fmt(cost(id))+'</button></div>').join('');
$('kindgrid').innerHTML=Object.keys(types).map(t=>'<div class="type-card '+t+'"><div class="kindpic"><img src="'+asset('ant')+'"></div><div class="kindname">'+types[t].label+'</div><div class="kinddesc">'+types[t].desc+'</div><div class="kindqty">عندك '+fmt(state.counts[t])+'</div><button class="buy" data-hire="'+t+'" '+(state.sugar<price(t)||ants.length>=maxAnts()?'disabled':'')+'>🍬 '+fmt(price(t))+'</button></div>').join('');
$('areas').innerHTML=rooms.map((r,i)=>'<button class="area '+(i===state.area?'selected':'')+' '+(i>state.unlocked?'locked':'')+'" data-area="'+i+'" '+(i>state.unlocked?'disabled':'')+'><div class="thumb">'+(i>state.unlocked?'🔒':r.icon)+'</div><div>'+r.name+'</div><small style="display:block;opacity:.85;font-size:12px;margin-top:4px">'+(i>state.unlocked?('يفتح عند '+fmt(r.goal)+' سكر'):r.desc)+'</small><span class="areaBonus">'+(i>state.unlocked?'—':r.bonus)+'</span></button>').join('');
if($('areaNote')) $('areaNote').textContent='المنطقة الحالية: '+rooms[state.area].name+' — '+rooms[state.area].desc+' • '+rooms[state.area].bonus;
if($('claimMission')){$('claimMission').disabled=!canClaimMission(); $('claimMission').textContent=canClaimMission()?'استلام مكافأة المنطقة':'أكمل مهمة المنطقة';} if($('claimMission')){$('claimMission').disabled=!canClaimMission();$('claimMission').textContent=canClaimMission()?'🎁 استلام مكافأة المنطقة':'أكمل مهمة المنطقة';}if($('qQueen')){$('qQueen').textContent='المستوى '+state.nest.queen;$('qQueenFx').textContent='حد النمل '+maxAnts();$('qStorage').textContent='المستوى '+state.nest.storage;$('qStorageFx').textContent='سعة '+fmt(sugarCapacity())+' سكر';$('qNursery').textContent='المستوى '+state.nest.nursery;$('qNurseryFx').textContent='فقس كل '+hatchTrips()+' رحلة';$('qGuard').textContent='المستوى '+state.nest.guard;$('qGuardFx').textContent='حماية '+Math.round(guardDefense()*100)+'%';}
drawNest();}
$('upgrades').addEventListener('click',e=>{const b=e.target.closest('[data-up]');if(!b)return;const id=b.dataset.up,p=cost(id);if(state.sugar<p)return;state.sugar-=p;state[id]++;toast('✅ تم التطوير');drawUI();save()});
$('kindgrid').addEventListener('click',e=>{const b=e.target.closest('[data-hire]');if(!b)return;const t=b.dataset.hire,p=price(t);if(state.sugar<p||ants.length>=maxAnts())return;state.sugar-=p;state.counts[t]++;syncAnts();toast('🐜 اشتريت '+types[t].label);drawUI();save()});
$('areas').addEventListener('click',e=>{const b=e.target.closest('[data-area]');if(!b)return;const i=Number(b.dataset.area);if(i>state.unlocked||i===state.area)return;state.area=i;for(const c of candies){c.stock=true;c.busy=false;c.respawn=0;c.node.classList.remove('busy','taken');const list=rooms[i].treats||candyKeys;c.kind=list[candies.indexOf(c)%list.length];c.node.querySelector('img').src=asset(c.kind);} 
if(legendary){legendary.node.remove();legendary=null}if(enemy){enemy.node.remove();enemy=null}
for(const a of ants){a.phase='idle';a.target=null;a.x=18+Math.random()*3;a.y=67+Math.random()*7;a.node.classList.remove('turn','hasCargo')}
renderAreaDecor();toast('📍 دخلت '+rooms[i].name);$('help').textContent='ميزة '+rooms[i].name+': '+rooms[i].bonus;drawUI();save()});
if($('claimMission')) $('claimMission').addEventListener('click',()=>{if(!canClaimMission()) return; const reward=depositSugar(areaMissionReward()); state.total+=reward; markMissionClaimed(); toast('🎁 أخذت مكافأة المنطقة'); pop('+'+reward+' 🍬',28,56); drawUI(); save();});
document.querySelectorAll('.m-tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.m-tab').forEach(b=>b.classList.toggle('active',b===btn));document.querySelectorAll('.m-panel').forEach(p=>p.classList.toggle('active',p.id==='panel-'+btn.dataset.tab));}));
const openNest=()=>{$('nestOverlay').classList.add('open');drawUI()};
$('nestOpen').addEventListener('click',openNest); if($('nestOpenInline')) $('nestOpenInline').addEventListener('click',openNest);
document.querySelector('.nestGrid').addEventListener('click',e=>{
 const btn=e.target.closest('[data-nest]');if(!btn)return;
 const id=btn.dataset.nest,oldLvl=state.nest[id],p=nestCost(id);
 if(oldLvl>=10||state.sugar<p)return;
 state.sugar-=p;state.nest[id]++;
 if(id==='nursery')state.nextHatch=Math.min(state.nextHatch,state.trips+hatchTrips());
 drawUI();save();toast('✅ تطورت '+nestDefs[id].name+' للمستوى '+state.nest[id]);
});$('nestClose').addEventListener('click',()=>$('nestOverlay').classList.remove('open'));$('nestOverlay').addEventListener('click',e=>{if(e.target.id==='nestOverlay')$('nestOverlay').classList.remove('open')});
$('reset').addEventListener('click',()=>{if(!confirm('هل تريد بدء مستعمرة جديدة؟'))return;localStorage.removeItem('ant-kingdom-big-v1');location.reload()});
function frame(t){const dt=last?Math.min(.06,(t-last)/1000):0;last=t;lastSave+=dt;
for(const c of candies)if(c.respawn>0){c.respawn-=dt;if(c.respawn<=0){c.stock=true;c.busy=false;c.node.classList.remove('busy','taken')}}
for(const a of ants){if(a.phase==='to'&&a.target){if(step(a,a.target.x,a.target.y,dt)){a.phase='back';a.target.stock=false;a.target.node.classList.add('taken');a.target.respawn=3;}}
else if(a.phase==='back'&&a.target){if(step(a,15,67,dt)){const c=a.target,amount=reward(c,a);const gained=depositSugar(amount);state.total+=gained;state.trips++;addMissionProgress(gained);checkHatch();if(Math.random()<discoveryChance()){state.discoveries=(state.discoveries||0)+1;pop('🔎 اكتشاف!',28,58);toast('وجدت اكتشافًا جديدًا في '+roomData().name)}c.busy=false;a.target=null;a.phase='idle';pop('+'+gained+' 🍬',18,65);if(state.area===3&&Math.random()<.16){const bonus=depositSugar(12+state.rewardBoost*2);state.total+=bonus;addMissionProgress(bonus);pop('+'+bonus+' 🎁',26,60);}unlock();spawnLegend();spawnEnemy();drawUI();save();$('help').textContent='✅ وصلت الحلوى للعش وزاد السكر';}}
else if(a.phase==='toLegend'&&a.target){const c=a.target;if(step(a,c.x,c.y,dt)){a.phase='waitLegend';if(c.assigned.every(v=>v.phase==='waitLegend')){c.stock=false;c.node.classList.add('taken');for(const v of c.assigned)v.phase='backLegend';}}}
else if(a.phase==='backLegend'&&a.target){const c=a.target;if(step(a,15,67,dt)){c.returned++;a.phase='idle';a.target=null;if(c.returned>=legendaryNeed()&&!c.claimed){c.claimed=true;const amount=Math.round(80*(1+state.bag*.35)*(1+state.area*.4)*areaLegendMultiplier());const gained=depositSugar(Math.round(amount*queenBonus()));state.total+=gained;addMissionProgress(gained);state.trips+=legendaryNeed();checkHatch();state.legendaryCollected++;pop('+'+gained+' 👑',19,64);toast('🎉 جمعت الحلوى الأسطورية!');c.node.remove();legendary=null;unlock();drawUI();save();}}}
else if(a.phase==='intercept'&&a.target){if(!enemy||a.target!==enemy){a.phase='idle';a.target=null}else if(step(a,enemy.x,enemy.y,dt)){enemy.node.remove();enemy=null;a.target=null;a.phase='idle';state.enemiesDefeated++;toast('🛡️ الحارس طرد الحشرة!');drawUI();save();}}
drawAnt(a)}
if(enemy){if(state.counts.guard>0&&!ants.some(a=>a.phase==='intercept'))sendGuard();const target=candies.find(c=>c.stock&&!c.busy);if(target){let dx=target.x-enemy.x,dy=target.y-enemy.y,d=Math.hypot(dx,dy),length=(6+state.area)*enemySlow()*dt;if(d<=length){const loss=Math.min(state.sugar,Math.ceil((9+state.area*3)*(1-guardDefense())));state.sugar-=loss;target.stock=false;target.respawn=3;target.node.classList.add('taken');pop('-'+loss+' 🍬',enemy.x,enemy.y);toast('🐞 الحشرة أخذت سكر!');enemy.node.remove();enemy=null;drawUI();save();}else{enemy.x+=dx/d*length;enemy.y+=dy/d*length;enemy.node.style.left=enemy.x+'%';enemy.node.style.top=enemy.y+'%'}}}
if(lastSave>6){lastSave=0;save()}requestAnimationFrame(frame)}
syncAnts();buildCandy();renderAreaDecor();drawUI();requestAnimationFrame(frame);
window.AntGame={state:()=>({...state,visibleAnts:ants.length,legendaryVisible:!!legendary,enemyVisible:!!enemy}),tap:i=>send(candies[i]),tapLegendary:()=>legendary&&send(legendary),grant:n=>{const gain=depositSugar(n);state.total+=gain;unlock();drawUI();save()},spawnLegend:()=>{state.nextLegendary=0;spawnLegend()},spawnEnemy:()=>{state.unlocked=Math.max(state.unlocked,1);state.nextEnemy=0;spawnEnemy()},nestUpgrade:id=>{const b=document.querySelector('[data-nest="'+id+'"]');if(!b)return false;b.click();return state.nest[id]},nestInfo:()=>({levels:{...state.nest},capacity:sugarCapacity(),maxAnts:maxAnts(),hatchTrips:hatchTrips(),discount:hireDiscount(),defense:guardDefense()})};
})();