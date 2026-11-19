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

var SHEET_APPS = '신청내역';
var SHEET_SUMMARY = '수업별현황';
var TZ = 'Asia/Seoul';
var STATUS = ['입금대기', '입금확인', '확정', '대기', '취소', '환불'];
var INACTIVE = ['취소', '환불'];
var RATE_LIMIT_PER_10MIN = 6;

/** [키, 헤더, 열 너비] - 순서를 바꾸면 기존 시트와 어긋나므로 뒤에만 추가하세요 */
var COLS = [
  ['id', '접수번호', 120],
  ['receivedAt', '접수일시', 150],
  ['status', '상태', 90],
  ['adminMemo', '관리자메모', 180],
  ['startDate', '수강시작일', 100],
  ['day', '요일', 50],
  ['time', '시간', 100],
  ['instructor', '강사', 100],
  ['classTitle', '수업명', 180],
  ['ticketLabel', '권종', 70],
  ['amount', '금액', 90],
  ['name', '이름', 90],
  ['phone', '연락처', 120],
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
  var headers = COLS.map(function (c) { return c[1]; });
  if (sh.getMaxColumns() < headers.length) sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
  sh.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setBackground('#1d3b2a').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  sh.setFrozenColumns(3);
  COLS.forEach(function (c, i) { sh.setColumnWidth(i + 1, c[2]); });

  var rows = sh.getMaxRows() - 1;
  var statusCol = col_('status');
  var statusRange = sh.getRange(2, statusCol, rows, 1);
  statusRange.setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).setAllowInvalid(false).build()
  );
  sh.getRange(2, col_('receivedAt'), rows, 1).setNumberFormat('yyyy-mm-dd hh:mm');
  sh.getRange(2, col_('amount'), rows, 1).setNumberFormat('#,##0');

  var colors = { '입금대기': '#fff4c2', '입금확인': '#d6ecff', '확정': '#d4f5df', '대기': '#ece3ff', '취소': '#eeeeee', '환불': '#ffd9d6' };
  var rules = Object.keys(colors).map(function (s) {
    return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(s).setBackground(colors[s]).setRanges([statusRange]).build();
  });
  sh.setConditionalFormatRules(rules);
  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), headers.length).createFilter();

  // 수업별 현황 (취소·환불 제외)
  var sm = ss.getSheetByName(SHEET_SUMMARY) || ss.insertSheet(SHEET_SUMMARY, 1);
  sm.clear();
  var L = function (k) { return letter_(col_(k)); };
  var src = "'" + SHEET_APPS + "'!A1:" + letter_(COLS.length);
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
  return json_({ ok: true, service: 'mvls-apply' });
}

function doPost(e) {
  var out;
  try {
    var body = e && e.postData && e.postData.contents;
    if (!body || body.length > 20000) return json_({ ok: false, code: 'INVALID' });
    out = handleApply_(JSON.parse(body));
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

  var digits = a.phone.replace(/\D/g, '');
  var rlKey = 'rl_' + digits;
  var count = Number(cache.get(rlKey) || 0);
  if (count >= RATE_LIMIT_PER_10MIN) return { ok: false, code: 'RATE_LIMIT' };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return { ok: false, code: 'SERVER' };
  var result;
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_APPS);
    if (!sh) throw new Error('신청내역 시트가 없습니다. setup 을 먼저 실행하세요.');

    if (isDuplicate_(sh, a)) {
      result = { ok: false, code: 'DUPLICATE' };
    } else {
      a.id = nextId_();
      a.receivedAt = new Date();
      a.status = '입금대기';
      sh.appendRow(COLS.map(function (c) { return cell_(a[c[0]]); }));
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

  var name = str_(p.name, 30);
  var phone = normPhone_(p.phone);
  var classId = str_(p.classId, 40);
  var startDate = str_(p.startDate, 10);
  var ticketType = str_(p.ticketType, 4);
  var amount = Number(p.amount);
  var isMinor = p.isMinor === true;
  var consents = p.consents || {};

  if (!name) return bad('name');
  if (!phone) return bad('phone');
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

/** 같은 연락처 + 같은 수업 + 같은 시작일 (취소·환불 제외) */
function isDuplicate_(sh, a) {
  var last = sh.getLastRow();
  if (last < 2) return false;
  var values = sh.getRange(2, 1, last - 1, COLS.length).getValues();
  var iP = col_('phone') - 1, iC = col_('classId') - 1, iD = col_('startDate') - 1, iS = col_('status') - 1;
  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    if (String(row[iP]) === a.phone && String(row[iC]) === a.classId && dateStr_(row[iD]) === a.startDate &&
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
        '신청자: ' + a.name + ' / ' + a.phone + (a.isMinor ? ' (14세 미만, 보호자 ' + a.guardianName + ' ' + a.guardianPhone + ')' : ''),
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

function col_(key) {
  for (var i = 0; i < COLS.length; i++) if (COLS[i][0] === key) return i + 1;
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
