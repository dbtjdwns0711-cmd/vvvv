/* ==========================================================================
   calc.js — 비작업일수 산정 엔진
   기준: 주말 / 공휴일 / 공종별 기상 기준(강우·강설·풍속·기온) + 체감온도 폭염
   출력: 일자별 판정 결과 + 사유 + 월별/사유별 집계
   ========================================================================== */

/**
 * 기상청 여름철 습구체감온도(Tw) 및 일 최고 체감온도 계산 함수
 * @param {number} ta - 기온(℃)
 * @param {number} rh - 상대습도(%)
 * @returns {number} 체감온도(℃)
 */
function calculateApparentTemp(ta, rh) {
  if (ta === undefined || ta === null) return null;
  const humidity = rh !== undefined && rh !== null ? rh : 50; // 습도 누락 시 기본 50%
  const tw = ta * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) 
             + Math.atan(ta + humidity) 
             - Math.atan(humidity - 1.676331) 
             + 0.00391838 * Math.pow(humidity, 1.5) * Math.atan(0.023101 * humidity) 
             - 4.686035;

  const apparentTemp = -0.2442 
                       + 0.55399 * tw 
                       + 0.45535 * ta 
                       - 0.0022 * Math.pow(tw, 2) 
                       + 0.00278 * tw * ta 
                       + 3.0;
  return Number(apparentTemp.toFixed(1));
}

/**
 * 비작업 손실 시간(Hour)을 비작업일수(Day)로 환산 (8시간 = 1일)
 */
function convertLossHoursToDays(lossHours) {
  return Number((lossHours / 8.0).toFixed(1));
}

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
      // 1. 체감온도 계산 (데이터에 습도가 없으면 기본 55% 가정)
      const apparentTemp = calculateApparentTemp(w.tempMaxC, w.humidity || 55);

      workTypes.forEach(wt=>{
        const c = criteriaByType[wt.id];
        if(!c) return;
        const fails = [];

        // 기본 기상 기준 검사
        if(w.rainMm > c.rainMaxMm) fails.push(`강우 ${w.rainMm}mm>${c.rainMaxMm}mm`);
        if(w.windMs > c.windMaxMs) fails.push(`풍속 ${w.windMs}m/s>${c.windMaxMs}m/s`);
        if(w.snowCm > c.snowMaxCm) fails.push(`강설 ${w.snowCm}cm>${c.snowMaxCm}cm`);
        if(w.tempMinC < c.tempMinC) fails.push(`저온 ${w.tempMinC}℃<${c.tempMinC}℃`);
        if(w.tempMaxC > c.tempMaxC) fails.push(`고온 ${w.tempMaxC}℃>${c.tempMaxC}℃`);

        // 코랩 분석 모델: 폭염 체감온도 35도 이상 판정 추가
        if(apparentTemp !== null && apparentTemp >= 35.0) {
          fails.push(`체감온도 폭염 ${apparentTemp}℃>=35.0℃`);
        }

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
 * 소요기간을 산출합니다.
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