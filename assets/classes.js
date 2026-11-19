/**
 * MVLS HOZIN STUDIO - 수업(시간표) 데이터
 * ------------------------------------------------------------
 * 2026년 11월 시간표 이미지 + 현행 구글폼(월등록/1회권)의 수업·금액 기준.
 * 매달 시간표가 바뀌면 이 파일만 수정하면 됩니다.
 *
 * 필드 설명
 *  id          영구 식별자 (신청 데이터에 저장됨, 한 번 정하면 바꾸지 않기)
 *  business    'ACADEMY'(학원) | 'LAB'
 *  day         1=월 … 5=금
 *  genre       config.js 의 genres 키
 *  tickets     판매 권종. type: '4W'(n주권) | '1T'(1회권) | 'FULL'(기간 전체권)
 *              weeks: 회차 수 (n주권), price: 원 단위 정수
 *  period      기간제(특강) 수업이면 { from, to } - 기간 안에 회차가 모두 들어가는 시작일만 선택 가능
 *  dates       특정 날짜에만 열리는 수업이면 날짜 배열
 *  startsFrom  첫 수업일 (이 날짜 이전은 선택 불가)
 *  closures    휴강일
 *  subs        대강 { date, by }
 *  open        false 면 시간표에는 보이지만 온라인 신청 불가(상담 안내)
 */
window.MVLS_CLASSES = [
  // ───────── 월요일 ─────────
  {
    id: 'MON-1820-TORCH', business: 'ACADEMY', day: 1, start: '18:20', end: '19:40',
    instructor: 'TORCH', title: 'STEP UP', genre: 'house',
    tickets: [{ type: '4W', weeks: 4, price: 150000 }, { type: '1T', price: 40000 }],
    closures: ['2026-11-30'],
  },
  {
    id: 'MON-1945-DSWAVE', business: 'ACADEMY', day: 1, start: '19:45', end: '21:05',
    instructor: 'D.SWAVE', title: 'FLOW STATE', genre: 'hiphop', badge: 'NEW',
    tickets: [{ type: '4W', weeks: 4, price: 150000 }, { type: '1T', price: 40000 }],
    period: { from: '2026-11-02', to: '2026-12-28' },
  },
  {
    id: 'MON-2110-DEEGUN', business: 'ACADEMY', day: 1, start: '21:10', end: '22:20',
    instructor: 'DEEGUN', title: 'HIPHOP BASIC', genre: 'hiphop',
    tickets: [{ type: '4W', weeks: 4, price: 140000 }, { type: '1T', price: 40000 }],
    subs: [{ date: '2026-11-16', by: 'COCO' }],
  },

  // ───────── 화요일 ─────────
  {
    id: 'TUE-1945-HAN', business: 'ACADEMY', day: 2, start: '19:45', end: '21:05',
    instructor: 'HAN', title: 'SMASH', genre: 'house',
    tickets: [{ type: '4W', weeks: 4, price: 150000 }, { type: '1T', price: 40000 }],
    period: { from: '2026-11-03', to: '2026-12-19' }, // [확인 필요] 시작일 미기재, 종료 ~12/19
  },
  {
    id: 'TUE-2110-SIMMON', business: 'ACADEMY', day: 2, start: '21:10', end: '22:20',
    instructor: 'SIMMON', title: 'LOCKING Starter', titleKo: '락킹 Starter', genre: 'locking',
    tickets: [{ type: '4W', weeks: 4, price: 140000 }, { type: '1T', price: 40000 }],
    closures: ['2026-11-17'],
  },

  // ───────── 수요일 ─────────
  {
    id: 'WED-1830-SKYTUBE', business: 'ACADEMY', day: 3, start: '18:30', end: '19:40',
    instructor: 'SKYTUBE', title: 'POPPING Starter', titleKo: '팝핑 Starter', genre: 'popping',
    tickets: [{ type: '4W', weeks: 4, price: 140000 }, { type: '1T', price: 40000 }],
  },
  {
    id: 'WED-1945-BROTHERBIN', business: 'ACADEMY', day: 3, start: '19:45', end: '21:05',
    instructor: 'BROTHER BIN', title: 'LOCKING TRAINING', genre: 'locking',
    tickets: [],
    open: false, // [확인 필요] 시간표에는 있으나 구글폼 신청 목록에 없음
  },
  {
    id: 'WED-2110-MEERO', business: 'ACADEMY', day: 3, start: '21:10', end: '22:30',
    instructor: 'MEERO', title: 'DANCE Starter', titleKo: '춤 기초', genre: 'all',
    tickets: [{ type: '4W', weeks: 4, price: 120000 }, { type: '1T', price: 40000 }],
  },

  // ───────── 목요일 ─────────
  {
    id: 'THU-1830-BONYU', business: 'ACADEMY', day: 4, start: '18:30', end: '19:40',
    instructor: 'BONYU', title: 'HOUSE Starter', titleKo: '하우스 Starter', genre: 'house',
    tickets: [{ type: '4W', weeks: 4, price: 140000 }, { type: '1T', price: 40000 }],
  },
  {
    id: 'THU-1945-HIDDEN', business: 'ACADEMY', day: 4, start: '19:45', end: '21:05',
    instructor: 'HIDDEN', title: "VIBIN' WAACKING", genre: 'waacking',
    tickets: [
      { type: '4W', weeks: 4, price: 150000 },
      { type: '4W', weeks: 6, price: 220000 },
      { type: '1T', price: 40000 },
    ],
    period: { from: '2026-11-05', to: '2026-12-10' },
  },
  {
    id: 'THU-2110-QUIIIDY', business: 'ACADEMY', day: 4, start: '21:10', end: '22:20',
    instructor: 'QUIIIDY', title: 'WAACKING Starter', titleKo: '왁킹 Starter', genre: 'waacking',
    tickets: [{ type: '4W', weeks: 4, price: 140000 }, { type: '1T', price: 40000 }],
    startsFrom: '2026-11-12',
    subs: [{ date: '2026-11-26', by: 'HIDDEN' }],
  },

  // ───────── 금요일 ─────────
  {
    id: 'FRI-1945-SEONGHEE', business: 'ACADEMY', day: 5, start: '19:45', end: '20:55',
    instructor: 'SEONG HEE', title: 'HIPHOP Starter', titleKo: '힙합 Starter', genre: 'hiphop',
    tickets: [{ type: '4W', weeks: 4, price: 140000 }, { type: '1T', price: 40000 }],
    subs: [{ date: '2026-11-27', by: 'MOBYDIC' }],
  },
  {
    id: 'FRI-2000-5000', business: 'ACADEMY', day: 5, start: '20:00', end: '22:30',
    instructor: '5000', title: 'HARD TRAINING', genre: 'hiphop', badge: 'SPECIAL',
    tickets: [{ type: '1T', price: 70000 }], // [확인 필요] 2회 전체권 금액 → 정해지면 { type:'FULL', price: … } 추가
    dates: ['2026-11-06', '2026-11-20'],
  },
  {
    id: 'FRI-2110-SKYTUBE', business: 'ACADEMY', day: 5, start: '21:10', end: '22:30',
    instructor: 'SKYTUBE', title: 'POPPING BASIC', genre: 'popping',
    tickets: [{ type: '4W', weeks: 4, price: 150000 }, { type: '1T', price: 40000 }],
  },
];
