'use strict';
const KEY='empireCityV3Save';
const types=[{name:'Lemonade Stand',icon:'🍋',cost:0,rate:2,upgrade:25,color:'#f5cf68',kind:0},{name:'Coffee Shop',icon:'☕',cost:125,rate:8,upgrade:100,color:'#bd8768',kind:1},{name:'Car Wash',icon:'🚗',cost:650,rate:28,upgrade:400,color:'#65c4e8',kind:2},{name:'Burger Shop',icon:'🍔',cost:3000,rate:110,upgrade:1500,color:'#e79c59',kind:3},{name:'Arcade',icon:'🎮',cost:13000,rate:390,upgrade:6500,color:'#ba89f2',kind:4},{name:'Hotel',icon:'🏨',cost:55000,rate:1500,upgrade:28000,color:'#eb9c9e',kind:5},{name:'Mall',icon:'🛍️',cost:240000,rate:6100,upgrade:125000,color:'#7fdbbc',kind:6},{name:'Skyscraper',icon:'🏙️',cost:1000000,rate:27000,upgrade:550000,color:'#85b4ef',kind:7},{name:'Factory',icon:'🏭',cost:5000000,rate:110000,upgrade:2400000,color:'#a7abb8',kind:8},{name:'Tech Campus',icon:'💻',cost:22000000,rate:500000,upgrade:11000000,color:'#92d8dc',kind:9},{name:'Space Company',icon:'🚀',cost:100000000,rate:2400000,upgrade:55000000,color:'#bca4f2',kind:10},{name:'Global HQ',icon:'🌐',cost:500000000,rate:12000000,upgrade:250000000,color:'#ffd07e',kind:11}];
const initial=()=>({cash:35,earned:0,plots:Array.from({length:12},(_,i)=>i===0?{level:1,manager:false}:null),selected:0,boostUntil:0,last:Date.now(),log:['Welcome to Empire City! Your lemonade stand is open.']});
let state;try{state=JSON.parse(localStorage.getItem(KEY))||initial();if(!Array.isArray(state.plots)||state.plots.length!==12)throw Error('bad save')}catch{state=initial()}
const $=id=>document.getElementById(id),canvas=$('cityCanvas'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const money=n=>n>=1e12?'$'+(n/1e12).toFixed(2)+'T':n>=1e9?'$'+(n/1e9).toFixed(2)+'B':n>=1e6?'$'+(n/1e6).toFixed(2)+'M':n>=1000?'$'+(n/1000).toFixed(1)+'K':'$'+Math.floor(n).toLocaleString();
const factor=()=>Date.now()<state.boostUntil?2:1;
const rate=i=>state.plots[i]?types[i].rate*Math.pow(1.7,state.plots[i].level-1)*(state.plots[i].manager?1.2:1):0;
const income=()=>types.reduce((s,_,i)=>s+rate(i),0);
const upgradeCost=i=>Math.ceil(types[i].upgrade*Math.pow(2,state.plots[i].level-1));
const managerCost=i=>Math.ceil(types[i].cost*2+100);
const empireLevel=()=>Math.max(1,1+Math.floor(Math.log10(Math.max(1,state.earned/100+1))));
const milestones=[100,1000,10000,100000,1000000,10000000,100000000,1000000000];
function news(message){state.log.unshift(message);state.log=state.log.slice(0,16)}
function save(){state.last=Date.now();try{localStorage.setItem(KEY,JSON.stringify(state));$('saveStatus').textContent='✓ Saved'}catch{$('saveStatus').textContent='Save unavailable'}}
function buy(i){if(state.plots[i]||state.cash<types[i].cost)return;state.cash-=types[i].cost;state.plots[i]={level:1,manager:false};news('Opened '+types[i].name+'!');render();save()}
function upgrade(i){if(!state.plots[i])return;const c=upgradeCost(i);if(state.cash<c)return;state.cash-=c;state.plots[i].level++;news(types[i].name+' upgraded to level '+state.plots[i].level);render();save()}
function manager(i){if(!state.plots[i]||state.plots[i].manager)return;const c=managerCost(i);if(state.cash<c)return;state.cash-=c;state.plots[i].manager=true;news('Hired a manager at '+types[i].name+'!');render();save()}
function campaign(){const cost=Math.max(100,Math.ceil(income()*15));if(factor()>1||state.cash<cost)return;state.cash-=cost;state.boostUntil=Date.now()+30000;news('Marketing launched: double income for 30 seconds!');render();save()}
function select(i){state.selected=i;render()}
function render(){const f=factor();$('cash').textContent=money(state.cash);$('income').textContent=money(income()*f);$('earned').textContent=money(state.earned);$('empireLevel').textContent=empireLevel();const i=state.selected,t=types[i],p=state.plots[i];$('detailTitle').textContent=t.name.toUpperCase();$('lotIndex').textContent='LOT '+String(i+1).padStart(2,'0')+' / 12';$('detail').innerHTML=`<div class="detailHero"><div class="lotIcon">${t.icon}</div><div><strong>${p?'Level '+p.level+' business':'Available property'}</strong><small>${p?'Operating and earning income':'Build your next business here'}</small></div></div><p class="detailSub">${p?'Upgrade your building to increase profits and watch it grow taller. Hire a manager for +20% income.':'Purchase this property to expand your city. A new illustrated building will appear on the map.'}</p>${p?`<div class="numbers"><div>Income<b>${money(rate(i)*f)}/sec</b></div><div>Manager<b>${p.manager?'Hired ✓':'Not hired'}</b></div></div><div class="actions"><button data-upgrade="${i}" ${state.cash<upgradeCost(i)?'disabled':''}>⬆ Upgrade ${money(upgradeCost(i))}</button><button class="secondary" data-manager="${i}" ${p.manager||state.cash<managerCost(i)?'disabled':''}>${p.manager?'✓ Manager hired':'👔 Hire manager '+money(managerCost(i))}</button></div>`:`<div class="actions"><button data-buy="${i}" ${state.cash<t.cost?'disabled':''}>🏗️ Build for ${money(t.cost)}</button></div>`}`;
const target=milestones.find(m=>state.earned<m),prev=target?target/10:milestones[milestones.length-1];$('missionTitle').textContent=target?'Next milestone: '+money(target):'🏆 Billionaire achieved!';$('missionDescription').textContent=target?'Earn '+money(target)+' in total revenue to advance.':'You have completed every revenue milestone.';$('missionBar').style.width=(target?Math.min(100,Math.max(0,(state.earned-prev)/(target-prev)*100)):100)+'%';const c=Math.max(100,Math.ceil(income()*15));$('bonusBtn').disabled=state.cash<c||f>1;$('bonusBtn').textContent=f>1?'⚡ 2× income — '+Math.ceil((state.boostUntil-Date.now())/1000)+'s':'📣 2× for 30s — '+money(c);$('achievements').innerHTML=[['First business',1,'owned'],['First $1K',1000,'earned'],['City investor',100000,'earned'],['Millionaire',1000000,'earned'],['Billionaire',1000000000,'earned']].map(([name,req,kind])=>{const yes=kind==='owned'?state.plots.some(Boolean):state.earned>=req;return `<div class="${yes?'unlocked':''}">${yes?'🏆':'🔒'} ${name}</div>`}).join('');$('log').innerHTML=state.log.map(x=>'<p>• '+x+'</p>').join('')}
// Original canvas-rendered isometric pixel-art city: no external images or libraries.
const W=960,H=650,TW=174,TH=94,DX=105,DY=67;
const centers=Array.from({length:12},(_,i)=>{let r=Math.floor(i/4),c=i%4;return {x:470+(c-r)*DX,y:148+(c+r)*DY,r,c}});
function poly(points,color,stroke){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let j=1;j<points.length;j++)ctx.lineTo(points[j][0],points[j][1]);ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke()}}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function line(x,y,x2,y2,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()}
function diamond(x,y,w,h,color,stroke){poly([[x,y-h/2],[x+w/2,y],[x,y+h/2],[x-w/2,y]],color,stroke)}
function tree(x,y,s=1){rect(x-3*s,y-5*s,6*s,17*s,'#76513a');rect(x-14*s,y-23*s,28*s,19*s,'#215d42');rect(x-10*s,y-32*s,20*s,15*s,'#37915a');rect(x-6*s,y-36*s,10*s,6*s,'#70c17b')}
function building(x,y,i,level){const t=types[i],height=22+Math.min(level,8)*10+(i>=5?18:0)+(i>=7?25:0),bw=65+(i%3)*6,depth=34,roofY=y-18-height;const a=[x-bw/2,y-18],b=[x,y-18-depth],c=[x+bw/2,y-18],d=[x,y-18+depth];
// shadow and extruded building faces
poly([[x-52,y+23],[x+5,y+48],[x+72,y+16],[x+17,y-12]],'#315e50');
poly([[a[0],roofY],[x,roofY-depth],[x,y-18-depth],[a[0],y-18]],shade(t.color,-32),'#233b4c');
poly([[x,roofY-depth],[c[0],roofY],[c[0],y-18],[x,y-18-depth]],shade(t.color,-12),'#233b4c');
poly([[a[0],roofY],[x,roofY+depth],[x,y-18+depth],[a[0],y-18]],shade(t.color,-18),'#263d4c');
poly([[x,roofY+depth],[c[0],roofY],[c[0],y-18],[x,y-18+depth]],t.color,'#263d4c');
poly([[x,roofY-depth-7],[c[0]+5,roofY-2],[x,roofY+depth+5],[a[0]-5,roofY-2]],shade(t.color,22),'#263e50');
// roof sign, vent, and distinct roof silhouettes
if(i===8){for(let z=0;z<3;z++){rect(x-25+z*17,roofY-24-z*5,11,25,'#7e8c9c');rect(x-24+z*17,roofY-27-z*5,9,5,'#d6dce1')}}
else if(i===10){poly([[x,roofY-37],[x+13,roofY-5],[x,roofY+4],[x-13,roofY-5]],'#eae9fa','#6b7a9b');rect(x-4,roofY-12,8,10,'#67baf5')}
else if(i===7||i===11){rect(x-5,roofY-22,10,18,'#d4e4ee');rect(x-2,roofY-35,4,14,'#d4e4ee')}
else {rect(x-7,roofY-11,14,8,'#51697d');rect(x-3,roofY-14,6,4,'#8ca5b3')}
// repeated pixel windows on front face
const rows=Math.max(1,Math.floor((height-10)/16));for(let k=0;k<rows;k++){const wy=roofY+depth+11+k*15;if(wy>y-9)break;for(let j=0;j<2;j++){rect(x+6+j*14,wy-j*6,9,9,i===4?'#fae67b':'#9ee5e8');rect(x+6+j*14,wy-j*6,9,2,'#f8f1b8')}}
// awning and entrance
if(i<=4){poly([[x+2,y+4],[x+38,y-15],[x+38,y-7],[x+2,y+13]],i===0?'#fff1a2':'#fff0d4');rect(x+13,y-2,11,13,'#314960')}
if(level>=3){rect(x-8,roofY-8,16,5,'#f8dc78')}
if(level>=5){rect(x-1,roofY-47,3,15,'#f0f2ff')}
}
function shade(hex,n){const v=parseInt(hex.slice(1),16),r=Math.max(0,Math.min(255,(v>>16)+n)),g=Math.max(0,Math.min(255,((v>>8)&255)+n)),b=Math.max(0,Math.min(255,(v&255)+n));return `rgb(${r},${g},${b})`}
function drawCity(t){rect(0,0,W,H,'#326c58');for(let x=0;x<W;x+=36)for(let y=0;y<H;y+=36)if((x*3+y)%7<3)rect(x+5,y+9,4,4,'#38775f');
// diagonal paved streets connect all plots
for(let r=-2;r<=5;r++){const a={x:470+(-2-r)*DX,y:148+(-2+r)*DY},b={x:470+(6-r)*DX,y:148+(6+r)*DY};line(a.x,a.y,b.x,b.y,'#384a59',37);line(a.x,a.y,b.x,b.y,'#71838c',2)}
for(let c=-2;c<=6;c++){const a={x:470+(c+2)*DX,y:148+(c-2)*DY},b={x:470+(c-5)*DX,y:148+(c+5)*DY};line(a.x,a.y,b.x,b.y,'#384a59',37);line(a.x,a.y,b.x,b.y,'#71838c',2)}
// perimeter landscaping
for(let k=0;k<8;k++){tree(95+k*99,67+(k%2)*9,.75);tree(100+k*98,580+(k%2)*12,.8)}
// draw in painter order (back-to-front)
for(let i=0;i<12;i++){const {x,y}=centers[i],owned=state.plots[i];diamond(x,y,TW,TH,owned?'#70a78a':'#82b18a',state.selected===i?'#ffe58a':'#365c56');diamond(x,y+4,TW-13,TH-12,owned?'#7db795':'#a0c69b');if(owned){building(x,y,i,owned.level)}else{diamond(x,y+5,95,50,'#a18d69');diamond(x,y+2,87,43,'#c1a983');rect(x-3,y-14,6,15,'#8b7254');rect(x+4,y-21,14,10,'#e3c981');tree(x-43,y-2,.55)}if(state.selected===i){ctx.strokeStyle='#fff2a0';ctx.lineWidth=5;ctx.setLineDash([10,7]);ctx.beginPath();ctx.moveTo(x,y-TH/2-7);ctx.lineTo(x+TW/2+8,y);ctx.lineTo(x,y+TH/2+8);ctx.lineTo(x-TW/2-8,y);ctx.closePath();ctx.stroke();ctx.setLineDash([])}
// labels on tiles
ctx.textAlign='center';ctx.font='bold 13px monospace';ctx.fillStyle='#102d32';ctx.fillText(String(i+1).padStart(2,'0'),x,y+37)}
// animated cars on two streets, screen-space and independent of game economy
const cars=[{phase:0,color:'#f6b759',y:492},{phase:.47,color:'#ed7d83',y:510},{phase:.2,color:'#a3d5f1',y:532}];for(const car of cars){let x=((t*.065+car.phase*1100)%1200)-120,y=car.y-(x-480)*.12;rect(x-16,y-6,32,14,'#263749');rect(x-12,y-12,23,13,car.color);rect(x-5,y-10,10,6,'#c7eafa');rect(x-10,y+7,7,4,'#192a3b');rect(x+8,y+7,7,4,'#192a3b')}
// foreground foliage and legend
for(let k=0;k<5;k++)tree(40+k*120,610-(k%2)*5,.65);
rect(15,14,195,37,'#142d3c');ctx.font='bold 17px monospace';ctx.textAlign='left';ctx.fillStyle='#d4f7dd';ctx.fillText('CITY DISTRICT 01',29,39);
}
let start=performance.now();function frame(t){drawCity(t-start);requestAnimationFrame(frame)}requestAnimationFrame(frame);
canvas.addEventListener('click',e=>{const bounds=canvas.getBoundingClientRect(),x=(e.clientX-bounds.left)*W/bounds.width,y=(e.clientY-bounds.top)*H/bounds.height;let best=-1,score=Infinity;centers.forEach((p,i)=>{const d=Math.abs(x-p.x)/(TW/2)+Math.abs(y-p.y)/(TH/2);if(d<score){score=d;best=i}});if(score<1.35)select(best)});
function tick(){const now=Date.now(),seconds=Math.max(0,Math.min(8*3600,(now-state.last)/1000)),base=income();let gain=base*seconds;if(state.boostUntil>state.last){const boostedSeconds=Math.max(0,Math.min(now,state.boostUntil)-state.last)/1000;gain+=base*boostedSeconds}state.cash+=gain;state.earned+=gain;state.last=now;render()}
$('detail').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.buy!==undefined)buy(Number(b.dataset.buy));if(b.dataset.upgrade!==undefined)upgrade(Number(b.dataset.upgrade));if(b.dataset.manager!==undefined)manager(Number(b.dataset.manager))});$('bonusBtn').addEventListener('click',campaign);$('saveBtn').addEventListener('click',save);$('resetBtn').addEventListener('click',()=>{if(confirm('Erase this city and start a new game?')){state=initial();save();render()}});document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});window.addEventListener('beforeunload',save);tick();setInterval(tick,1000);setInterval(save,10000);
