import fs from 'node:fs';
import path from 'node:path';

const questions = JSON.parse(fs.readFileSync('work/quiz-data.json', 'utf8'));
const data = JSON.stringify(questions).replace(/</g, '\\u003c');
const outDir = 'outputs';
fs.mkdirSync(outDir, { recursive: true });

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0b1220">
<title>CCNA 2 SRWE Study Quiz</title>
<style>
  :root{--bg:#f3f6fb;--ink:#172033;--muted:#667085;--card:#fff;--line:#dce3ee;--navy:#14213d;--blue:#2563eb;--green:#047857;--red:#c2410c;--amber:#9a6700;--shadow:0 12px 35px #14213d14}
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
  header{background:var(--navy);color:#fff;padding:28px max(18px,calc((100vw - 1040px)/2));}h1{font-size:clamp(1.4rem,3vw,2rem);margin:0 0 4px}.sub{margin:0;color:#cbd5e1;font-size:.94rem}.wrap{max-width:1040px;margin:24px auto;padding:0 18px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.stat,.card{background:var(--card);border:1px solid var(--line);box-shadow:var(--shadow);border-radius:14px}.stat{padding:14px 16px}.stat b{display:block;font-size:1.35rem}.stat span{color:var(--muted);font-size:.82rem}.toolbar{display:flex;flex-wrap:wrap;gap:9px;margin:0 0 18px}.toolbar button{background:#fff}.toolbar button.active{color:#fff;background:var(--blue);border-color:var(--blue)}button{border:1px solid #cbd5e1;border-radius:9px;padding:9px 12px;font:inherit;font-weight:650;color:#25334d;cursor:pointer;background:#fff}button:hover{border-color:var(--blue)}button:disabled{opacity:.55;cursor:not-allowed}.card{padding:clamp(18px,4vw,34px)}.meta{display:flex;justify-content:space-between;gap:10px;color:var(--muted);font-size:.9rem;margin-bottom:12px}.pill{background:#e9f0ff;color:#1d4ed8;border-radius:999px;padding:2px 9px;font-weight:700}.question{font-size:clamp(1.08rem,2.4vw,1.34rem);font-weight:700;line-height:1.45;margin:4px 0 20px}.choices{display:grid;gap:10px}.choice{display:flex;align-items:flex-start;gap:12px;text-align:left;width:100%;padding:14px;background:#fff}.choice input{margin:5px 0 0;accent-color:var(--blue)}.choice.selected{border-color:var(--blue);background:#f2f6ff}.choice.correct{border-color:var(--green);background:#ecfdf5}.choice.wrong{border-color:var(--red);background:#fff7ed}.actions,.nav{display:flex;justify-content:space-between;gap:12px;margin-top:22px}.actions{justify-content:flex-start}.primary{background:var(--blue);color:#fff;border-color:var(--blue)}.feedback{margin-top:20px;padding:16px;border-radius:10px;border-left:5px solid var(--line);background:#f8fafc}.feedback.good{border-color:var(--green);background:#ecfdf5}.feedback.bad{border-color:var(--red);background:#fff7ed}.feedback h3{margin:0 0 8px;font-size:1rem}.explanation{color:#344054}.notice{margin:12px 0 0;padding:13px;background:#fffaeb;border:1px solid #fedf89;border-radius:10px;color:#7a4b00}.empty{text-align:center;padding:40px 12px;color:var(--muted)}.source{font-size:.82rem;color:var(--muted);margin:20px 2px 0}.num{font-variant-numeric:tabular-nums}@media(max-width:600px){.stats{grid-template-columns:repeat(2,1fr)}.actions,.nav{flex-wrap:wrap}.nav button{flex:1}.choice{font-size:.95rem}}
  .exhibit{margin:0 0 20px;padding:12px;border:1px solid var(--line);border-radius:11px;background:#f8fafc}.exhibit figcaption{font-weight:700;color:var(--muted);font-size:.85rem;margin-bottom:8px}.exhibit img{display:block;max-width:100%;height:auto;margin:auto;border:1px solid #cbd5e1}
</style>
</head>
<body>
<header><h1>CCNA 2 SRWE Study Quiz</h1><p class="sub">Switching, Routing and Wireless Essentials - portable, offline-ready practice</p></header>
<main class="wrap">
  <section class="stats" aria-label="Progress"><div class="stat"><b id="progress">0/0</b><span>attempted</span></div><div class="stat"><b id="score">0%</b><span>latest-answer score</span></div><div class="stat"><b id="correct">0</b><span>correct</span></div><div class="stat"><b id="missed">0</b><span>revision queue</span></div></section>
  <nav class="toolbar"><button id="allBtn" class="active">All questions</button><button id="revisionBtn">Revise missed</button><button id="resetBtn">Reset this device</button></nav>
  <section class="card" id="quiz" aria-live="polite"></section>
  <p class="source">Built from the supplied CCNA 2 v7.0 Final Exam Answers PDF. Progress is saved only in this browser on this device; copy this single file to another device to use it there.</p>
</main>
<script>
const questions = ${data};
const STORE = 'ccna2-srwe-quiz-v1';
let saved = JSON.parse(localStorage.getItem(STORE) || '{"answers":{},"missed":[]}');
let mode = 'all', index = 0;
const byId = new Map(questions.map(q=>[q.id,q]));
const save=()=>localStorage.setItem(STORE,JSON.stringify(saved));
const list=()=> mode==='revision' ? questions.filter(q=>saved.missed.includes(q.id)) : questions;
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function stats(){const graded=questions.filter(q=>q.options.length&&q.options.some(o=>o.correct));const attempts=Object.values(saved.answers);const right=attempts.filter(a=>a.correct).length;document.querySelector('#progress').textContent=attempts.length+'/'+graded.length;document.querySelector('#score').textContent=attempts.length?Math.round(right/attempts.length*100)+'%':'0%';document.querySelector('#correct').textContent=right;document.querySelector('#missed').textContent=saved.missed.length;}
function render(){stats();document.querySelector('#allBtn').classList.toggle('active',mode==='all');document.querySelector('#revisionBtn').classList.toggle('active',mode==='revision');const items=list();if(index>=items.length)index=Math.max(0,items.length-1);const root=document.querySelector('#quiz');if(!items.length){root.innerHTML='<div class="empty"><h2>Revision queue is clear</h2><p>Questions you answer incorrectly will appear here for another try.</p><button class="primary" id="returnAll">Return to all questions</button></div>';root.querySelector('#returnAll').onclick=()=>setMode('all');return}const q=items[index], record=saved.answers[q.id], correct=q.options.map((o,i)=>o.correct?i:null).filter(i=>i!==null), gradable=q.options.length&&correct.length;const multi=correct.length>1||/Choose (two|three)/i.test(q.question);let choices=q.options.map((o,i)=>'<button class="choice '+(record?(o.correct?'correct':(record.selected||[]).includes(i)?'wrong':''):'')+'" data-i="'+i+'" '+(record?'disabled':'')+'><input type="'+(multi?'checkbox':'radio')+'" '+((record?.selected||[]).includes(i)?'checked':'')+' disabled><span>'+esc(o.text)+'</span></button>').join('');let feedback='';if(record){feedback='<div class="feedback '+(record.correct?'good':'bad')+'"><h3>'+ (record.correct?'Correct - nice work.':'Not quite - added to your revision queue.')+'</h3><div class="explanation">'+esc(q.explanation||'No explanation text was available in the source.')+'</div></div>'}else if(!gradable){feedback='<div class="notice"><strong>Reference-only item.</strong> The PDF did not provide selectable answers in extractable text for this exhibit or matching question. Its source explanation is shown below.</div><div class="feedback"><div class="explanation">'+esc(q.explanation||'No explanation text was available in the source.')+'</div></div>'}root.innerHTML='<div class="meta"><span class="pill">Question '+q.id+'</span><span class="num">'+(index+1)+' of '+items.length+'</span></div><div class="question">'+esc(q.question)+'</div>'+(q.options.length?'<div class="choices">'+choices+'</div>':'')+(gradable&&!record?'<div class="actions"><button class="primary" id="check" disabled>Check answer</button></div>':'')+feedback+'<div class="nav"><button id="prev" '+(index===0?'disabled':'')+'>Previous</button><button id="next" '+(index===items.length-1?'disabled':'')+'>Next</button></div>';if(!record&&gradable){let selected=[];root.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(multi){selected=selected.includes(i)?selected.filter(x=>x!==i):[...selected,i]}else selected=[i];root.querySelectorAll('.choice').forEach(x=>x.classList.toggle('selected',selected.includes(+x.dataset.i)));root.querySelector('#check').disabled=!selected.length});root.querySelector('#check').onclick=()=>grade(q,selected,correct)}root.querySelector('#prev').onclick=()=>{index--;render()};root.querySelector('#next').onclick=()=>{index++;render()}}
function grade(q,selected,correct){const ok=selected.length===correct.length&&selected.every(i=>correct.includes(i));saved.answers[q.id]={selected,correct:ok};if(ok)saved.missed=saved.missed.filter(id=>id!==q.id);else if(!saved.missed.includes(q.id))saved.missed.push(q.id);save();render()}
function setMode(next){mode=next;index=0;render()}window.setMode=setMode;document.querySelector('#allBtn').onclick=()=>setMode('all');document.querySelector('#revisionBtn').onclick=()=>setMode('revision');document.querySelector('#resetBtn').onclick=()=>{if(confirm('Clear all saved answers and the revision queue on this device?')){saved={answers:{},missed:[]};save();setMode('all')}};render();
</script>
</body></html>`;
const enrichedHtml = html
  .replace("const multi=correct.length", "const exhibit=q.diagram?'<figure class=\"exhibit\"><figcaption>Source exhibit</figcaption><img src=\"'+q.diagram+'\" alt=\"Source diagram for question '+q.id+'\"></figure>':'';const multi=correct.length")
  .replace("+'</div>'+(q.options.length?", "+'</div>'+exhibit+(q.options.length?");
fs.writeFileSync(path.join(outDir, 'ccna2-srwe-study-quiz.html'), enrichedHtml, 'utf8');
console.log(`Created ${questions.length} source-numbered items.`);
