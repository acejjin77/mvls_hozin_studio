/**
 * MVLS HOZIN STUDIO - 비회원 수강신청 접수 (Google Apps Script)
 * ------------------------------------------------------------
 * 홈페이지(index.html) → 이 웹앱(doPost) → 구글 시트 '신청내역' 탭에 한 줄씩 저장
 * 직원은 구글 시트에서 신청을 확인하고 '상태' 칸을 바꿔 관리합니다.
 *
 * 설치 순서는 README.md 참고:
 *  1) 새 구글 시트 → 확장 프로그램 → Apps Script → 이 파일 붙여넣기
 *  2) 상단 함수 선택에서 setup 실행 (권한 승인)
 *  3) 배포 → 새 배포 → 웹 앱 (실행: 나, 액세스: 모든 사용자) → URL 을 config.js API_URL 에
 *
 * 스크립트 속성 (프로젝트 설정 → 스크립트 속성)
 *  NOTIFY_EMAIL  새 신청 알림을 받을 메일 (쉼표로 여러 개). 비우면 메일 안 보냄.
 */

var CODE_VERSION = '2026-11-20-insta-lookup'; // 배포 URL 을 브라우저로 열면 보이는 값. 코드 수정 시 함께 변경
var SHEET_APPS = '신청내역';
var SHEET_SUMMARY = '수업별현황';
var TZ = 'Asia/Seoul';
var STATUS = ['입금대기', '입금확인', '확정', '대기', '취소', '환불'];
var INACTIVE = ['취소', '환불'];
var RATE_LIMIT_PER_10MIN = 6;
var LOOKUP_PER_KEY_10MIN = 10; // 같은 연락처/인스타로 10분에 조회 가능 횟수
var LOOKUP_PER_MIN = 40;       // 전체 조회 분당 상한 (무작위 대입 방지)
var LOOKUP_MAX_ITEMS = 20;

/**
 * [키, 헤더, 열 너비]
 * 시트에는 '헤더 이름'으로 찾아서 저장합니다. 시트에서 열 순서를 바꾸거나 열을 옮겨도 됩니다.
 * 단, 헤더 이름(1행 글자)은 바꾸지 마세요. 헤더를 지우면 다음 저장 때 맨 오른쪽에 다시 만들어집니다.
 * 이 배열의 순서는 '새 시트를 처음 만들 때'의 열 순서입니다.
 */
var COLS = [
  ['id', '접수번호', 120],
  ['receivedAt', '접수일시', 150],
  ['status', '상태', 90],
  ['adminMemo', '관리자메모', 180],
  ['name', '이름', 90],
  ['phone', '연락처', 120],
  ['instagram', '인스타그램', 130],
  ['payMethod', '결제방식', 90],
  ['startDate', '수강시작일', 100],
  ['day', '요일', 50],
  ['time', '시간', 100],
  ['instructor', '강사', 100],
  ['classTitle', '수업명', 180],
  ['ticketLabel', '권종', 70],
  ['amount', '금액', 90],
  ['ageGroup', '연령대', 70],
  ['isMinor', '14세미만', 70],
  ['guardianName', '보호자명', 90],
  ['guardianPhone', '보호자연락처', 120],
  ['cashReceipt', '현금영수증', 120],
  ['channel', '신청구분', 80],
  ['source', '신청경로', 110],
  ['interests', '관심분야', 140],
  ['memo', '문의사항', 220],
  ['sessionDates', '수강예정일', 200],
  ['business', '사업자', 80],
  ['classId', '수업코드', 150],
  ['lang', '언어', 50],
  ['consent', '동의내역', 240],
];

/* ───────────────────────── 메뉴 / 초기 설정 ───────────────────────── */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('MVLS')
    .addItem('시트 초기 설정 (처음 1회)', 'setup')
    .addToUi();
}

/** 시트·헤더·상태 드롭다운·색상·현황 탭을 만듭니다. 여러 번 실행해도 안전합니다. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TZ);

  var sh = ss.getSheetByName(SHEET_APPS) || ss.insertSheet(SHEET_APPS, 0);
  var map = headerMap_(sh); // 기존 헤더는 그대로 두고, 없는 헤더만 오른쪽 끝에 추가
  var width = sh.getLastColumn();
  sh.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#1d3b2a').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  COLS.forEach(function (c) { sh.setColumnWidth(map[c[1]], c[2]); });

  var rows = sh.getMaxRows() - 1;
  var statusRange = sh.getRange(2, colOf_(map, 'status'), rows, 1);
  statusRange.setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).setAllowInvalid(false).build()
  );
  sh.getRange(2, colOf_(map, 'receivedAt'), rows, 1).setNumberFormat('yyyy-mm-dd hh:mm');
  sh.getRange(2, colOf_(map, 'amount'), rows, 1).setNumberFormat('#,##0');

  var colors = { '입금대기': '#fff4c2', '입금확인': '#d6ecff', '확정': '#d4f5df', '대기': '#ece3ff', '취소': '#eeeeee', '환불': '#ffd9d6' };
  var rules = Object.keys(colors).map(function (s) {
    return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(s).setBackground(colors[s]).setRanges([statusRange]).build();
  });
  sh.setConditionalFormatRules(rules);
  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), width).createFilter();

  // 수업별 현황 (취소·환불 제외)
  var sm = ss.getSheetByName(SHEET_SUMMARY) || ss.insertSheet(SHEET_SUMMARY, 1);
  sm.clear();
  var L = function (k) { return letter_(colOf_(map, k)); }; // 현재 열 위치 기준으로 수식 생성
  var src = "'" + SHEET_APPS + "'!A1:" + letter_(width);
  sm.getRange('A1').setValue('수업 · 시작일별 신청 (취소·환불 제외)').setFontWeight('bold');
  sm.getRange('A2').setFormula(
    '=QUERY(' + src + ', "select ' + [L('startDate'), L('day'), L('time'), L('instructor'), L('classTitle'), L('ticketLabel')].join(', ') +
    ', count(' + L('id') + '), sum(' + L('amount') + ') where ' + L('id') + " is not null and " + L('status') + " <> '취소' and " + L('status') +
    " <> '환불' group by " + [L('startDate'), L('day'), L('time'), L('instructor'), L('classTitle'), L('ticketLabel')].join(', ') +
    ' order by ' + L('startDate') + ', ' + L('time') + " label count(" + L('id') + ") '신청 건수', sum(" + L('amount') + ") '금액 합계'\", 1)"
  );
  sm.getRange('J1').setValue('상태별 건수').setFontWeight('bold');
  sm.getRange('J2').setFormula(
    '=QUERY(' + src + ', "select ' + L('status') + ', count(' + L('id') + ') where ' + L('id') + ' is not null group by ' + L('status') +
    " label count(" + L('id') + ") '건수'\", 1)"
  );
  sm.setFrozenRows(2);

  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('NOTIFY_EMAIL') === null) props.setProperty('NOTIFY_EMAIL', '');
  SpreadsheetApp.getActive().toast('MVLS 신청 시트 설정 완료', 'MVLS', 5);
}

/* ───────────────────────── 웹앱 엔드포인트 ───────────────────────── */

/** 상태 확인용: 배포 URL 을 브라우저로 열면 {"ok":true} 가 보이면 정상 */
function doGet() {
  return json_({ ok: true, service: 'mvls-apply', version: CODE_VERSION });
}

function doPost(e) {
  var out;
  try {
    var body = e && e.postData && e.postData.contents;
    if (!body || body.length > 20000) return json_({ ok: false, code: 'INVALID' });
    var p = JSON.parse(body);
    out = (p && p.action === 'lookup') ? handleLookup_(p) : handleApply_(p);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    out = { ok: false, code: 'SERVER' };
  }
  return json_(out);
}

/* ───────────────────────── 접수 처리 ───────────────────────── */

function handleApply_(p) {
  if (!p || typeof p !== 'object') return { ok: false, code: 'INVALID' };

  // 스팸 봇: 숨겨진 칸이 채워져 있으면 저장하지 않고 성공처럼 응답
  if (p.website) return { ok: true, id: 'MV000000-000' };

  var cache = CacheService.getScriptCache();
  var reqKey = 'req_' + str_(p.requestId, 60).replace(/[^\w-]/g, '');
  if (reqKey.length > 4) {
    var prev = cache.get(reqKey);
    if (prev) return JSON.parse(prev); // 같은 요청 재전송(네트워크 재시도) → 같은 결과
  }

  var v = validate_(p);
  if (!v.ok) return v;
  var a = v.data;

  var rlKey = 'rl_' + (a.phone ? a.phone.replace(/\D/g, '') : 'ig_' + a.instagram);
  var count = Number(cache.get(rlKey) || 0);
  if (count >= RATE_LIMIT_PER_10MIN) return { ok: false, code: 'RATE_LIMIT' };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return { ok: false, code: 'SERVER' };
  var result;
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_APPS);
    if (!sh) throw new Error('신청내역 시트가 없습니다. setup 을 먼저 실행하세요.');

    if (isDuplicate_(sh, a, headerMap_(sh))) {
      result = { ok: false, code: 'DUPLICATE' };
    } else {
      a.id = nextId_();
      a.receivedAt = new Date();
      a.status = '입금대기';
      var map = headerMap_(sh);
      var row = [];
      for (var i = 0; i < sh.getLastColumn(); i++) row.push('');
      COLS.forEach(function (c) { row[map[c[1]] - 1] = cell_(a[c[0]]); });
      sh.appendRow(row);
      result = { ok: true, id: a.id };
    }
  } finally {
    lock.releaseLock();
  }

  if (result.ok) {
    cache.put(rlKey, String(count + 1), 600);
    if (reqKey.length > 4) cache.put(reqKey, JSON.stringify(result), 21600);
    notify_(a);
  }
  return result;
}

function validate_(p) {
  var bad = function (field) { return { ok: false, code: 'INVALID', field: field }; };
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');

  var isEn = p.lang === 'en';
  var name = str_(p.name, 30);
  var phone = normPhone_(p.phone);
  var instagram = normIg_(p.instagram);
  var classId = str_(p.classId, 40);
  var startDate = str_(p.startDate, 10);
  var ticketType = str_(p.ticketType, 4);
  var amount = Number(p.amount);
  var isMinor = p.isMinor === true;
  var consents = p.consents || {};

  if (!name) return bad('name');
  // 한국어 신청: 연락처 필수 / 영문(외국인) 신청: 인스타그램 아이디 필수 (현장 현금 결제)
  if (isEn) { if (!instagram) return bad('instagram'); }
  else if (!phone) return bad('phone');
  if (!/^[A-Z0-9-]{3,40}$/.test(classId)) return bad('classId');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || startDate < today) return bad('startDate');
  if (['4W', '1T', 'FULL'].indexOf(ticketType) < 0) return bad('ticketType');
  if (!isFinite(amount) || amount < 0 || amount > 3000000 || Math.floor(amount) !== amount) return bad('amount');
  if (consents.refund !== true || consents.privacy !== true) return bad('consent');

  var guardianName = '', guardianPhone = '';
  if (isMinor) {
    guardianName = str_(p.guardianName, 30);
    guardianPhone = normPhone_(p.guardianPhone);
    if (!guardianName || !guardianPhone || consents.guardian !== true) return bad('guardian');
  }

  var sessions = Array.isArray(p.sessionDates) ? p.sessionDates.slice(0, 20).filter(function (d) {
    return /^\d{4}-\d{2}-\d{2}$/.test(d);
  }) : [];
  var interests = Array.isArray(p.interests) ? p.interests.slice(0, 10).map(function (x) { return str_(x, 20); }) : [];

  return {
    ok: true,
    data: {
      business: p.business === 'LAB' ? 'LAB' : '학원',
      classId: classId,
      day: str_(p.day, 3),
      time: str_(p.time, 20),
      instructor: str_(p.instructor, 40),
      classTitle: str_(p.classTitle, 80),
      ticketLabel: str_(p.ticketLabel, 20),
      startDate: startDate,
      sessionDates: sessions.join(', '),
      amount: amount,
      name: name,
      phone: phone,
      instagram: instagram ? '@' + instagram : '',
      payMethod: isEn ? '현장 현금' : '계좌이체',
      ageGroup: str_(p.ageGroup, 10),
      isMinor: isMinor ? 'Y' : '',
      guardianName: guardianName,
      guardianPhone: guardianPhone,
      cashReceipt: str_(p.cashReceipt, 20),
      channel: str_(p.channel, 10) || '사전 신청',
      source: str_(p.source, 20),
      interests: interests.join(', '),
      memo: str_(p.memo, 500),
      lang: p.lang === 'en' ? 'EN' : 'KO',
      consent: '환불규정·개인정보' + (isMinor ? '·보호자' : '') + ' 동의 / ' + str_(p.termsVersion, 20) + ' / ' +
        Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'),
      adminMemo: '',
    },
  };
}

/* ───────────────────────── 신청내역 조회 ─────────────────────────
 * 이름 + 연락처(또는 인스타그램 아이디)가 모두 일치하는 신청만 돌려줍니다.
 * 개인정보 노출을 줄이기 위해 수업·일정·금액·상태만 반환하고
 * 연락처·보호자·현금영수증·문의사항·관리자메모는 반환하지 않습니다.
 */
function handleLookup_(p) {
  var name = normName_(p.name);
  var phone = normPhone_(p.phone);
  var ig = normIg_(p.instagram);
  if (!name || (!phone && !ig)) return { ok: false, code: 'INVALID' };

  var cache = CacheService.getScriptCache();
  var gKey = 'lk_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMddHHmm');
  var g = Number(cache.get(gKey) || 0);
  if (g >= LOOKUP_PER_MIN) return { ok: false, code: 'RATE_LIMIT' };
  cache.put(gKey, String(g + 1), 120);
  var kKey = 'lkk_' + (phone ? phone.replace(/\D/g, '') : 'ig_' + ig);
  var k = Number(cache.get(kKey) || 0);
  if (k >= LOOKUP_PER_KEY_10MIN) return { ok: false, code: 'RATE_LIMIT' };
  cache.put(kKey, String(k + 1), 600);

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_APPS);
  if (!sh || sh.getLastRow() < 2) return { ok: true, items: [] };
  var map = headerMap_(sh);
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  var idx = {};
  COLS.forEach(function (c) { idx[c[0]] = map[c[1]] - 1; });

  var items = values.filter(function (row) {
    if (!row[idx.id] || normName_(row[idx.name]) !== name) return false;
    if (phone) return String(row[idx.phone]) === phone;
    return normIg_(row[idx.instagram]) === ig;
  }).map(function (row) {
    var at = row[idx.receivedAt];
    return {
      id: String(row[idx.id]),
      receivedAt: at instanceof Date ? Utilities.formatDate(at, TZ, 'yyyy-MM-dd HH:mm') : String(at),
      status: String(row[idx.status] || ''),
      day: String(row[idx.day] || ''),
      time: String(row[idx.time] || ''),
      instructor: String(row[idx.instructor] || ''),
      classTitle: String(row[idx.classTitle] || ''),
      ticketLabel: String(row[idx.ticketLabel] || ''),
      startDate: dateStr_(row[idx.startDate]),
      sessionDates: String(row[idx.sessionDates] || ''),
      amount: Number(row[idx.amount]) || 0,
      payMethod: String(row[idx.payMethod] || ''),
    };
  });
  items.sort(function (a, b) { return a.receivedAt < b.receivedAt ? 1 : -1; });
  return { ok: true, items: items.slice(0, LOOKUP_MAX_ITEMS) };
}

/** 같은 연락처(또는 인스타그램) + 같은 수업 + 같은 시작일 (취소·환불 제외) */
function isDuplicate_(sh, a, map) {
  var last = sh.getLastRow();
  if (last < 2) return false;
  var values = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  var iP = colOf_(map, 'phone') - 1, iG = colOf_(map, 'instagram') - 1;
  var iC = colOf_(map, 'classId') - 1, iD = colOf_(map, 'startDate') - 1, iS = colOf_(map, 'status') - 1;
  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    var same = (a.phone && String(row[iP]) === a.phone) ||
               (a.instagram && normIg_(row[iG]) === normIg_(a.instagram));
    if (same && String(row[iC]) === a.classId && dateStr_(row[iD]) === a.startDate &&
        INACTIVE.indexOf(String(row[iS])) < 0) return true;
  }
  return false;
}

/** 접수번호 MVyyMMdd-001 (날짜별 일련번호, 락 안에서 호출) */
function nextId_() {
  var day = Utilities.formatDate(new Date(), TZ, 'yyMMdd');
  var props = PropertiesService.getScriptProperties();
  var key = 'seq_' + day;
  var n = Number(props.getProperty(key) || 0) + 1;
  props.setProperty(key, String(n));
  return 'MV' + day + '-' + ('00' + n).slice(-3);
}

function notify_(a) {
  try {
    var to = PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL');
    if (!to) return;
    var url = SpreadsheetApp.getActiveSpreadsheet().getUrl();
    MailApp.sendEmail({
      to: to,
      subject: '[MVLS 신청] ' + a.name + ' / ' + a.instructor + ' ' + a.classTitle + ' / ' + a.ticketLabel + ' ' + a.startDate,
      body: [
        '접수번호: ' + a.id,
        '수업: ' + a.day + ' ' + a.time + ' ' + a.instructor + ' ' + a.classTitle,
        '권종: ' + a.ticketLabel + ' (' + a.amount.toLocaleString() + '원)',
        '일정: ' + a.sessionDates,
        '신청자: ' + a.name + ' / ' + (a.phone || a.instagram) + ' / 결제: ' + a.payMethod + (a.isMinor ? ' (14세 미만, 보호자 ' + a.guardianName + ' ' + a.guardianPhone + ')' : ''),
        a.memo ? '문의: ' + a.memo : '',
        '',
        '신청내역 시트: ' + url,
      ].join('\n'),
    });
  } catch (err) {
    console.error('메일 발송 실패: ' + err); // 메일 실패는 접수 결과에 영향 없음
  }
}

/* ───────────────────────── 유틸 ───────────────────────── */

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function str_(v, max) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function normPhone_(v) {
  var s = str_(v, 20).replace(/[\s-]/g, '');
  if (/^01[016789]\d{7,8}$/.test(s)) {
    return s.length === 10 ? s.slice(0, 3) + '-' + s.slice(3, 6) + '-' + s.slice(6) : s.slice(0, 3) + '-' + s.slice(3, 7) + '-' + s.slice(7);
  }
  if (/^\+\d{8,15}$/.test(s)) return s;
  return '';
}

/** 인스타그램 아이디 정규화: '@아이디', 'instagram.com/아이디' 모두 허용 → 소문자 아이디 */
function normIg_(v) {
  var s = str_(v, 100).toLowerCase().replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, '').replace(/[/?#].*$/, '').replace(/^@/, '');
  return /^[a-z0-9._]{1,30}$/.test(s) ? s : '';
}

/** 이름 비교용: 공백 제거 + 소문자 */
function normName_(v) {
  return str_(v, 30).replace(/\s+/g, '').toLowerCase();
}

/**
 * 시트에 쓸 값. 문자열은 앞에 ' 를 붙여 항상 '텍스트'로 저장합니다.
 *  - "=..." 같은 수식 주입 방지
 *  - 01012345678 → 1012345678, 2026-11-23 → 날짜 로 자동 변환되는 것 방지
 */
function cell_(v) {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date || typeof v === 'number') return v;
  return "'" + String(v);
}

function dateStr_(v) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v);
}

/**
 * 1행 헤더 이름 → 열 번호(1부터). COLS 에 있는데 시트에 없는 헤더는 오른쪽 끝에 추가합니다.
 * 직원이 시트에서 열 순서를 바꿔도 이름으로 찾기 때문에 엉뚱한 칸에 저장되지 않습니다.
 */
function headerMap_(sh) {
  var lastCol = sh.getLastColumn();
  var head = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  var map = {};
  head.forEach(function (h, i) { h = String(h).trim(); if (h && !map[h]) map[h] = i + 1; });
  var missing = COLS.filter(function (c) { return !map[c[1]]; }).map(function (c) { return c[1]; });
  if (missing.length) {
    var start = lastCol + 1;
    var need = start + missing.length - 1 - sh.getMaxColumns();
    if (need > 0) sh.insertColumnsAfter(sh.getMaxColumns(), need);
    sh.getRange(1, start, 1, missing.length).setValues([missing]);
    missing.forEach(function (h, i) { map[h] = start + i; });
  }
  return map;
}

function colOf_(map, key) {
  for (var i = 0; i < COLS.length; i++) if (COLS[i][0] === key) return map[COLS[i][1]];
  throw new Error('unknown column ' + key);
}

function letter_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/* ───────────────────────── 개발자 테스트 ───────────────────────── */

/** Apps Script 편집기에서 실행해 시트에 테스트 행이 들어가는지 확인 (확인 후 행 삭제) */
function testApply() {
  var tomorrow = Utilities.formatDate(new Date(Date.now() + 86400000), TZ, 'yyyy-MM-dd');
  var res = handleApply_({
    requestId: 'test-' + Date.now(), business: 'ACADEMY', classId: 'TEST-0000-DEV', day: '월', time: '18:20~19:40',
    instructor: 'TEST', classTitle: '테스트 수업', ticketType: '1T', ticketLabel: '1회권', startDate: tomorrow,
    sessionDates: [tomorrow], amount: 40000, name: '테스트', phone: '010-0000-0000',
    consents: { refund: true, privacy: true }, termsVersion: 'test', memo: '=HYPERLINK("x") 수식 주입 테스트',
  });
  Logger.log(JSON.stringify(res));
}
