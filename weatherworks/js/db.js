/* ==========================================================================
   db.js — localStorage 기반 데이터 계층
   모든 데이터는 브라우저(localStorage)에 저장됩니다. 서버가 없으므로
   기기 간 동기화는 되지 않으며, data.html 에서 JSON/CSV로 내보내고
   불러올 수 있습니다.
   ========================================================================== */

const DB_KEY = 'ww_db_v1';
const CUR_PROJECT_KEY = 'ww_current_project';

function uid(prefix){
  return (prefix||'id') + '-' + Math.random().toString(36).slice(2,9);
}

function loadDB(){
  let db;
  const raw = localStorage.getItem(DB_KEY);
  if(raw){
    try{ db = JSON.parse(raw); }catch(e){ console.warn('DB parse fail, reseeding'); }
  }
  if(!db){
    db = window.seedDB ? window.seedDB() : emptyDB();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }
  // sync in any reference catalogs (e.g. sw-catalog.js) that may add new work types
  if(window.ensureSwWorkTypes && window.ensureSwWorkTypes(db)){
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }
  return db;
}

function saveDB(db){
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function emptyDB(){
  return {
    projects: [],
    workTypes: [],
    criteria: [],       // { workTypeId, rainMaxMm, windMaxMs, snowMaxCm, tempMinC, tempMaxC, note }
    stations: [],
    weatherRecords: [], // { stationId, date, rainMm, windMs, snowCm, tempMaxC, tempMinC }
    holidays: [],        // { date, name }
    scheduleImports: [], // { id, projectId, fileName, importedAt, rows:[{workTypeName, plannedStart, plannedEnd}] }
    predictions: [],      // { projectId, date, predictedWorkable, actualWorkable } for accuracy page
    quantities: [],        // { id, projectId, workTypeId, quantity, unit, dailyOutput }
    qcLog: []               // { id, date, stationId, field, oldValue, newValue, editedAt, note } quality-control edit history
  };
}

function resetDB(){
  localStorage.removeItem(DB_KEY);
  return loadDB();
}

function getCurrentProjectId(db){
  let id = localStorage.getItem(CUR_PROJECT_KEY);
  if(!id || !db.projects.find(p=>p.id===id)){
    id = db.projects[0] ? db.projects[0].id : null;
    if(id) localStorage.setItem(CUR_PROJECT_KEY, id);
  }
  return id;
}

function setCurrentProjectId(id){
  localStorage.setItem(CUR_PROJECT_KEY, id);
}
