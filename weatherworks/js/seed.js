/* ==========================================================================
   seed.js — 최초 접속 시 채워지는 예시 데이터
   실제 사용 시에는 Admin(공종/기준), 데이터 관리(기상 엑셀 업로드) 화면에서
   현장에 맞는 값으로 교체하십시오. 아래 작업가능 기준 수치는 계산 로직을
   보여주기 위한 예시값이며, 별도 공인된 기준을 따르지 않습니다.
   ========================================================================== */

function koreanHolidays2026(){
  return [
    {date:'2026-01-01', name:'신정'},
    {date:'2026-02-16', name:'설날 연휴'},
    {date:'2026-02-17', name:'설날'},
    {date:'2026-02-18', name:'설날 연휴'},
    {date:'2026-03-01', name:'삼일절'},
    {date:'2026-03-02', name:'대체공휴일'},
    {date:'2026-05-05', name:'어린이날'},
    {date:'2026-05-24', name:'부처님오신날'},
    {date:'2026-05-25', name:'대체공휴일'},
    {date:'2026-06-06', name:'현충일'},
    {date:'2026-08-15', name:'광복절'},
    {date:'2026-08-17', name:'대체공휴일'},
    {date:'2026-09-24', name:'추석 연휴'},
    {date:'2026-09-25', name:'추석'},
    {date:'2026-09-26', name:'추석 연휴'},
    {date:'2026-10-03', name:'개천절'},
    {date:'2026-10-05', name:'대체공휴일'},
    {date:'2026-10-09', name:'한글날'},
    {date:'2026-12-25', name:'크리스마스'},
  ];
}

function seedDB(){
  const workTypes = [
    {id:'wt-earth',  name:'토공사',   category:'토목'},
    {id:'wt-conc',   name:'콘크리트공사', category:'구조'},
    {id:'wt-steel',  name:'철골공사', category:'구조'},
    {id:'wt-finish', name:'마감공사(실내)', category:'건축'},
    {id:'wt-scape',  name:'조경공사', category:'조경'},
  ];

  const criteria = [
    {workTypeId:'wt-earth',  rainMaxMm:5,  windMaxMs:10, snowMaxCm:1,  tempMinC:-5,  tempMaxC:35, note:'강우/강설 시 토질 함수비 초과 우려'},
    {workTypeId:'wt-conc',   rainMaxMm:3,  windMaxMs:8,  snowMaxCm:0,  tempMinC:4,   tempMaxC:35, note:'저온 타설 제한 및 강우 시 양생 품질 저하'},
    {workTypeId:'wt-steel',  rainMaxMm:5,  windMaxMs:10, snowMaxCm:1,  tempMinC:-10, tempMaxC:35, note:'고소·양중 작업 풍속 제한'},
    {workTypeId:'wt-finish', rainMaxMm:999,windMaxMs:999,snowMaxCm:999,tempMinC:-99, tempMaxC:99, note:'실내 작업으로 기상 영향 거의 없음'},
    {workTypeId:'wt-scape',  rainMaxMm:5,  windMaxMs:12, snowMaxCm:2,  tempMinC:0,   tempMaxC:35, note:'식재/식생 작업 저온 제한'},
  ];

  const stations = [
    {id:'st-1', name:'현장 인근 관측소 A', code:'108', region:'서울'},
    {id:'st-2', name:'현장 인근 관측소 B', code:'159', region:'부산'},
  ];

  const projects = [
    {
      id:'p-1', name:'○○지구 공동주택 신축공사', location:'경기도 ○○시', stationId:'st-1',
      startDate:'2026-01-05', endDate:'2026-12-18',
      workTypeIds:['wt-earth','wt-conc','wt-steel','wt-finish'],
      excludeWeekends:true, excludeHolidays:true,
      contractDays: 348,
    },
    {
      id:'p-2', name:'△△ 도로 확장공사 2공구', location:'강원도 △△군', stationId:'st-2',
      startDate:'2026-03-02', endDate:'2026-11-30',
      workTypeIds:['wt-earth','wt-scape'],
      excludeWeekends:false, excludeHolidays:true,
      contractDays: 275,
    }
  ];

  // synthetic weather so the app has data to show out of the box
  const weatherRecords = [];
  projects.forEach(p=>{
    const days = dateRange(p.startDate, p.endDate);
    let seed = p.id.length;
    days.forEach((d, i)=>{
      seed = (seed*9301 + 49297) % 233280;
      const rnd = seed/233280;
      const month = Number(d.slice(5,7));
      const isWinter = month<=2 || month===12;
      const rain = rnd>0.78 ? Math.round(rnd*30) : (rnd>0.6 ? Math.round(rnd*6) : 0);
      const wind = Math.round(2 + rnd*9);
      const snow = isWinter && rnd>0.85 ? Math.round(rnd*4) : 0;
      const tempBase = isWinter ? -3 : (month>=6 && month<=8 ? 27 : 15);
      weatherRecords.push({
        stationId: p.stationId, date: d,
        rainMm: rain, windMs: wind, snowCm: snow,
        tempMaxC: tempBase + Math.round(rnd*6),
        tempMinC: tempBase - Math.round(rnd*5),
      });
    });
  });

  const quantities = [
    {id:'q-1', projectId:'p-1', workTypeId:'wt-earth', quantity:42000, unit:'㎥', dailyOutput:180},
    {id:'q-2', projectId:'p-1', workTypeId:'wt-conc',  quantity:15800, unit:'㎥', dailyOutput:45},
    {id:'q-3', projectId:'p-1', workTypeId:'wt-steel', quantity:2600,  unit:'ton', dailyOutput:12},
    {id:'q-4', projectId:'p-1', workTypeId:'wt-finish',quantity:38000, unit:'㎡', dailyOutput:220},
    {id:'q-5', projectId:'p-2', workTypeId:'wt-earth', quantity:96000, unit:'㎥', dailyOutput:260},
    {id:'q-6', projectId:'p-2', workTypeId:'wt-scape', quantity:8200,  unit:'㎡', dailyOutput:140},
  ];

  return {
    projects, workTypes, criteria, stations, weatherRecords,
    holidays: koreanHolidays2026(),
    scheduleImports: [],
    predictions: [],
    quantities,
    qcLog: [],
  };
}
