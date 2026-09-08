/* ==========================================================================
   util.js — 날짜 / CSV·Excel 파싱 / 내보내기 유틸
   ========================================================================== */

function pad2(n){ return String(n).padStart(2,'0'); }

function fmtDate(d){
  if(typeof d === 'string') return d;
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

function parseDate(s){
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d);
}

function addDays(dateStr, n){
  const d = parseDate(dateStr);
  d.setDate(d.getDate()+n);
  return fmtDate(d);
}

function dateRange(startStr, endStr){
  const out = [];
  let cur = parseDate(startStr);
  const end = parseDate(endStr);
  while(cur <= end){
    out.push(fmtDate(cur));
    cur.setDate(cur.getDate()+1);
  }
  return out;
}

function isWeekend(dateStr){
  const day = parseDate(dateStr).getDay();
  return day === 0 || day === 6;
}

function monthLabel(dateStr){
  const d = parseDate(dateStr);
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
}

function daysBetween(a,b){
  return Math.round((parseDate(b) - parseDate(a)) / 86400000) + 1;
}

function fmtNum(n, digits){
  if(n===null || n===undefined || isNaN(n)) return '-';
  return Number(n).toLocaleString('ko-KR', {maximumFractionDigits: digits===undefined?1:digits});
}

/* ---------------- CSV parsing (light) ---------------- */
function parseCSV(text){
  const lines = text.replace(/\r/g,'').split('\n').filter(l=>l.trim().length>0);
  if(!lines.length) return {headers:[], rows:[]};
  const headers = lines[0].split(',').map(h=>h.trim());
  const rows = lines.slice(1).map(line=>{
    const cells = line.split(',').map(c=>c.trim());
    const obj = {};
    headers.forEach((h,i)=> obj[h] = cells[i] !== undefined ? cells[i] : '');
    return obj;
  });
  return {headers, rows};
}

function toCSV(headers, rows){
  const esc = v => {
    v = (v===undefined||v===null) ? '' : String(v);
    return /[",\n]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v;
  };
  const lines = [headers.join(',')];
  rows.forEach(r=> lines.push(headers.map(h=>esc(r[h])).join(',')));
  return lines.join('\n');
}

function downloadText(filename, text, mime){
  const blob = new Blob([text], {type: mime || 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* ---------- Excel (.xlsx) via SheetJS, falls back gracefully ---------- */
function readSpreadsheetFile(file){
  return new Promise((resolve, reject)=>{
    const name = file.name.toLowerCase();
    const reader = new FileReader();
    if(name.endsWith('.csv')){
      reader.onload = () => resolve(parseCSV(reader.result));
      reader.onerror = reject;
      reader.readAsText(file, 'utf-8');
    } else {
      reader.onload = () => {
        try{
          const data = new Uint8Array(reader.result);
          const wb = XLSX.read(data, {type:'array', cellDates:true});
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, {defval:''});
          const headers = json.length ? Object.keys(json[0]) : [];
          const rows = json.map(r=>{
            const o = {};
            headers.forEach(h=>{
              let v = r[h];
              if(v instanceof Date) v = fmtDate(v);
              o[h] = v;
            });
            return o;
          });
          resolve({headers, rows});
        }catch(err){ reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    }
  });
}

function qs(name){
  return new URLSearchParams(location.search).get(name);
}
