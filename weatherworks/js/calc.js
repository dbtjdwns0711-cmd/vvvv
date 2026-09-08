/* ==========================================================================
   calc.js — 비작업일수 산정 엔진
   기준: 주말 / 공휴일 / 공종별 기상 기준(강우·강설·풍속·기온) 초과 여부
   출력: 일자별 판정 결과 + 사유 + 월별/사유별 집계
   ========================================================================== */

/**
 * 프로젝트 기간에 대해 일자별 작업가능 여부를 계산합니다.
 * @param {object} project
 * @param {object} db
 * @returns {Array} days: [{date, workable, reasons:[{type,label}], weekend, holiday, weather}]
 */
function computeDailyStatus(project, db){
  if(!project) return [];
  const holidaysMap = {};
  db.holidays.forEach(h=> holidaysMap[h.date] = h.name);

  const weatherByDate = {};
  db.weatherRecords.forEach(w=>{
    if(w.stationId === project.stationId) weatherByDate[w.date] = w;
  });

  const criteriaByType = {};
  db.criteria.forEach(c=> criteriaByType[c.workTypeId] = c);

  const workTypes = db.workTypes.filter(wt => (project.workTypeIds||[]).includes(wt.id));

  const days = dateRange(project.startDate, project.endDate);

  return days.map(date=>{
    const reasons = [];
    const weekend = isWeekend(date);
    const holidayName = holidaysMap[date];

    if(weekend && project.excludeWeekends){
      reasons.push({type:'weekend', label:'주말'});
    }
    if(holidayName && project.excludeHolidays){
      reasons.push({type:'holiday', label:'공휴일 · '+holidayName});
    }

    const w = weatherByDate[date];
    const weatherFails = [];
    if(w){
      workTypes.forEach(wt=>{
        const c = criteriaByType[wt.id];
        if(!c) return;
        const fails = [];
        if(w.rainMm > c.rainMaxMm) fails.push(`강우 ${w.rainMm}mm>${c.rainMaxMm}mm`);
        if(w.windMs > c.windMaxMs) fails.push(`풍속 ${w.windMs}m/s>${c.windMaxMs}m/s`);
        if(w.snowCm > c.snowMaxCm) fails.push(`강설 ${w.snowCm}cm>${c.snowMaxCm}cm`);
        if(w.tempMinC < c.tempMinC) fails.push(`저온 ${w.tempMinC}℃<${c.tempMinC}℃`);
        if(w.tempMaxC > c.tempMaxC) fails.push(`고온 ${w.tempMaxC}℃>${c.tempMaxC}℃`);
        if(fails.length){
          weatherFails.push({type:'weather', workType: wt.name, label:`${wt.name} 작업불가 (${fails.join(', ')})`});
        }
      });
    }
    reasons.push(...weatherFails);

    return {
      date, weekend, holiday: !!holidayName, holidayName: holidayName||null,
      weather: w || null,
      reasons,
      duplicate: reasons.length > 1,
      workable: reasons.length === 0,
    };
  });
}

/**
 * 일자별 결과를 집계하여 총괄 통계를 만듭니다.
 */
function summarizeStatus(days){
  const total = days.length;
  const nonWorking = days.filter(d=>!d.workable);
  const working = total - nonWorking.length;

  const byReason = {weekend:0, holiday:0, weather:0};
  let duplicateOverlap = 0; // days where >1 reason applied (counted once, but categories overlap)

  nonWorking.forEach(d=>{
    const types = new Set(d.reasons.map(r=>r.type));
    types.forEach(t=> byReason[t] = (byReason[t]||0) + 1);
    if(d.reasons.length > 1) duplicateOverlap++;
  });

  // monthly breakdown
  const monthMap = {};
  days.forEach(d=>{
    const m = monthLabel(d.date);
    if(!monthMap[m]) monthMap[m] = {month:m, total:0, working:0, nonWorking:0};
    monthMap[m].total++;
    if(d.workable) monthMap[m].working++; else monthMap[m].nonWorking++;
  });

  return {
    total, working, nonWorking: nonWorking.length,
    byReason, duplicateOverlap,
    workableRate: total ? working/total : 0,
    monthly: Object.values(monthMap).sort((a,b)=> a.month.localeCompare(b.month)),
  };
}

/**
 * 공사기간 산정: 작업일수(순수 작업량 기반 필요일수) + 비작업일수를 더해
 * 소요기간을 산출합니다. 작업일수 산정은 duration-workdays 페이지의
 * 표준작업량 입력을 사용합니다(없으면 계약공기 - 비작업일수로 역산 표기).
 */
function estimateDuration(project, db, requiredWorkDays){
  const days = computeDailyStatus(project, db);
  const summary = summarizeStatus(days);
  const calendarDays = daysBetween(project.startDate, project.endDate);
  const impliedWorkDays = requiredWorkDays || summary.working;
  return {
    days, summary, calendarDays,
    requiredWorkDays: impliedWorkDays,
    nonWorkingDays: summary.nonWorking,
    estimatedCalendarDays: impliedWorkDays + summary.nonWorking,
  };
}
