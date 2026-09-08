/* ==========================================================================
   nav.js — 전 페이지 공통 사이드바 / 상단바 렌더링
   ========================================================================== */

const NAV_SECTIONS = [
  {group:null, items:[
    {href:'index.html', label:'종합 현황'},
    {href:'projects.html', label:'현장 관리'},
    {href:'analysis.html', label:'현장별 상세 분석'},
    {href:'calendar.html', label:'일별 작업 가능성'},
    {href:'accuracy.html', label:'예측 오차 분석'},
    {href:'weather.html', label:'기상 데이터 조회'},
    {href:'quantity.html', label:'공사 물량·생산성 산정'},
    {href:'stations.html', label:'구간별 관측지점'},
  ]},
  {group:'공사기간 산정', items:[
    {href:'duration.html', label:'총괄·결과·Timeline'},
    {href:'duration-workdays.html', label:'작업일수 산정'},
    {href:'duration-weather.html', label:'비작업일수 산정'},
    {href:'duration-basis.html', label:'산정근거 검토'},
    {href:'duration-report.html', label:'산정 결과 보고서'},
  ]},
  {group:'데이터·공정', items:[
    {href:'quality.html', label:'기상데이터 품질관리'},
    {href:'schedule.html', label:'공정표 Import'},
    {href:'data.html', label:'데이터 관리'},
  ]},
  {group:null, items:[
    {href:'reports.html', label:'분석 보고서'},
    {href:'admin.html', label:'공종·기준·표준작업량'},
  ]},
];

function currentFile(){
  const p = location.pathname.split('/').pop();
  return p === '' ? 'index.html' : p;
}

function renderSidebar(){
  const el = document.getElementById('sidebar');
  if(!el) return;
  const cur = currentFile();
  let html = `
    <div class="brand">
      <div class="mark">WEATHERWORKS</div>
      <h1>WeatherWorks</h1>
      <div class="tagline">건설공사 비작업일수 · 공사기간 산정</div>
    </div>
    <nav>`;
  NAV_SECTIONS.forEach(sec=>{
    if(sec.group) html += `<div class="group-label">${sec.group}</div>`;
    sec.items.forEach(item=>{
      const active = item.href === cur ? ' active' : '';
      html += `<a class="nav-item${active}" href="${item.href}">${item.label}</a>`;
    });
  });
  html += `</nav>
    <div class="sidebar-foot">예상값이며 실제 작업 여부는 현장 상황 및<br>공식 기상정보에 따라 달라질 수 있습니다.</div>`;
  el.innerHTML = html;
}

function renderTopbar(title, opts){
  const el = document.getElementById('topbar');
  if(!el) return;
  opts = opts || {};
  let right = '';
  if(opts.showProjectSelect){
    right += `<select id="project-select" onchange="onProjectSelectChange(this.value)"></select>`;
  }
  el.innerHTML = `
    <div class="crumb"><b>${title}</b></div>
    <div class="topbar-right">${right}</div>`;

  if(opts.showProjectSelect){
    populateProjectSelect();
  }
}

function populateProjectSelect(){
  const db = loadDB();
  const sel = document.getElementById('project-select');
  if(!sel) return;
  const curId = getCurrentProjectId(db);
  sel.innerHTML = db.projects.map(p=>
    `<option value="${p.id}" ${p.id===curId?'selected':''}>${p.name}</option>`
  ).join('') || '<option value="">등록된 현장 없음</option>';
}

function onProjectSelectChange(id){
  setCurrentProjectId(id);
  location.reload();
}

document.addEventListener('DOMContentLoaded', renderSidebar);
