/**
 * MVLS HOZIN STUDIO - 사이트 설정
 * ------------------------------------------------------------
 * 운영자가 자주 바꾸는 값은 이 파일과 classes.js 두 곳에만 있습니다.
 * [확인 필요] 표시는 실제 값으로 교체하거나 대표자 확인이 필요한 항목입니다.
 */
window.MVLS_CONFIG = {
  /**
   * Google Apps Script 웹앱 URL (배포 후 붙여넣기)
   * 비워두면 "데모 모드"로 동작합니다: 실제 접수 없이 이 브라우저에만 저장됩니다.
   * 예: 'https://script.google.com/macros/s/AKfycb..../exec'
   */
  API_URL: 'https://script.google.com/macros/s/AKfycbwzekCtfuQlyZrw9lLZsWsBlxdmrC4elpsgYOBTATMgpWQNI-fVNYkPtmkf06nlx1dwIQ/exec',

  /** 관리자(직원)용 구글 시트 주소 - 푸터 '관리자' 링크. 시트 공유 권한으로 접근을 통제합니다. */
  ADMIN_SHEET_URL: '',

  /** 시간표 기준 월 (히어로·시간표 제목) */
  scheduleMonth: '2026-11',

  /** 수강 시작일로 선택할 수 있는 기간 (오늘부터 N주) */
  bookingWindowWeeks: 6,

  /**
   * 휴강일이 4주권 기간에 걸릴 때 회차를 1주 뒤로 밀어 표시할지 여부.
   * [확인 필요 - 명세서 20.2 B-5] 실제 운영 정책에 맞춰 true/false 결정.
   */
  extendOnClosure: true,

  /**
   * 스튜디오 전체 휴무일 (모든 수업에 휴강으로 적용). 예: ['2026-12-25', '2027-01-01']
   * [확인 필요] 성탄절·신정 등 공휴일 운영 여부
   */
  holidays: [],

  studio: {
    name: 'MVLS HOZIN STUDIO',
    nameKo: '마블러스호진댄스학원',
    address: '서울시 서초구 방배동 437-23',
    addressEn: '437-23 Bangbae-dong, Seocho-gu, Seoul',
    kakaoUrl: 'http://pf.kakao.com/_mJMPb',
    kakaoHours: '평일 16:00 – 22:00',
    kakaoHoursEn: 'Weekdays 16:00 – 22:00',
    instagramUrl: '', // [확인 필요] 스튜디오 인스타그램 주소
    mapUrl: 'https://map.naver.com/p/search/%EC%84%9C%EC%9A%B8%20%EC%84%9C%EC%B4%88%EA%B5%AC%20%EB%B0%A9%EB%B0%B0%EB%8F%99%20437-23',
  },

  /** 수납 안내 (현재 구글폼 안내문과 동일) */
  payment: {
    bank: '신한은행',
    holder: '마블러스(강유진)',
    account: '110-535-147508',
    notes: [
      '수납까지 완료된 건에 한하여 접수가 확정됩니다.',
      '반드시 신청자명과 송금자명을 동일하게 입금해주세요.',
      '22:00 이후 신청 건은 다음 날 15:30부터 순차적으로 안내드립니다.',
    ],
    notesEn: [
      'Your registration is confirmed only after payment.',
      'Please make the transfer under the same name as the applicant.',
      'Applications after 22:00 are answered from 15:30 the next day.',
    ],
  },

  /**
   * 사업자 정보 (명세서 2장). 푸터와 신청 데이터의 '사업자' 칸에 사용됩니다.
   * [확인 필요] 학원 등록번호·사업자등록번호 등 법정 표시 항목 (명세서 20.1 A-3, A-5)
   */
  businesses: {
    ACADEMY: {
      name: '마블러스호진댄스학원',
      ceo: '강유진',
      bizNo: '[확인 필요]',
      academyRegNo: '[확인 필요]',
    },
    LAB: {
      name: '마블러스호진스튜디오 랩',
      ceo: '강호진',
      bizNo: '[확인 필요]',
    },
  },

  /** 장르 색상 - 현재 시간표 이미지의 색 구분을 그대로 사용 */
  genres: {
    popping: { label: 'POPPING', color: '#4a86f0' },
    locking: { label: 'LOCKING', color: '#3fae72' },
    waacking: { label: 'WAACKING', color: '#a98bf5' },
    house: { label: 'HOUSE', color: '#cf9a6c' },
    hiphop: { label: 'HIPHOP & BREAKING', color: '#f3c234' },
    all: { label: 'FOR ALL DANCERS', color: '#e2615c' },
  },

  /** 워크숍 - 당분간 기존 구글폼으로 연결 (2차에서 같은 신청 흐름으로 통합) */
  workshops: [
    { date: '2026-11-28', title: 'PARIS', url: 'https://forms.gle/tY79tT2qKByACuiT9' },
    { date: '2026-11-28', title: 'CIO', url: 'https://forms.gle/z9zqCHY95jCxDT6P9' },
    { date: '2026-12-05', title: 'YUDAT FAM', url: 'https://forms.gle/BuNczF4pZkizSdvo8' },
  ],

  /** 전체 공지 (수업별 휴강·대강은 classes.js에서 자동으로 공지됩니다) */
  notices: [
    { ko: 'Yujin 강사님 Popping Basic 수업은 11/10부로 종료되었습니다.', en: "Yujin's Popping Basic class ended on 11/10." },
  ],

  /** 동의 문구 버전 - 문구를 바꾸면 버전도 올려주세요 (신청 데이터에 함께 저장) */
  termsVersion: '2026-11-v1',
};
