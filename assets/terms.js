/**
 * 약관 문구 (신청서 동의 · 푸터)
 * ------------------------------------------------------------
 * [확인 필요] 아래는 초안입니다. 현재 구글폼에 이미지로 올라가 있는
 * "수강 안내 및 환불 규정" 원문으로 교체하고, 대표자 확인 후 사용하세요.
 * 문구를 바꾸면 config.js 의 termsVersion 도 올려주세요.
 */
window.MVLS_TERMS = {
  refund: {
    ko: {
      title: '수강 안내 및 환불 규정',
      html: `
        <h3>수강 안내</h3>
        <ul>
          <li>수납(계좌 입금)까지 완료된 건에 한하여 접수가 확정됩니다.</li>
          <li>4주권은 선택한 시작일부터 주 1회, 4회 수강합니다. 기간이 표기된 특강 수업은 기간 안에서만 수강할 수 있으며 휴식권이 적용되지 않습니다.</li>
          <li>기간이 표기되지 않은 정규 수업은 상시 신청할 수 있으며 휴식권이 적용됩니다.</li>
          <li>1회권은 선택한 날짜의 수업 1회에 한해 유효합니다.</li>
          <li>휴강 · 대강 등 수업 일정은 스튜디오 사정에 따라 변경될 수 있으며, 변경 시 개별 안내드립니다.</li>
        </ul>
        <h3>환불 규정</h3>
        <p>학원의 설립 · 운영 및 과외교습에 관한 법률 시행령 [별표 4] 교습비 등 반환 기준에 따릅니다.</p>
        <table>
          <thead><tr><th>반환 사유 발생 시점</th><th>반환 금액</th></tr></thead>
          <tbody>
            <tr><td>수업 시작 전</td><td>이미 낸 수강료 전액</td></tr>
            <tr><td>총 수업 시간의 1/3 경과 전</td><td>수강료의 2/3</td></tr>
            <tr><td>총 수업 시간의 1/3 이후 ~ 1/2 경과 전</td><td>수강료의 1/2</td></tr>
            <tr><td>총 수업 시간의 1/2 경과 후</td><td>반환하지 않음</td></tr>
          </tbody>
        </table>
        <p class="muted">환불은 반환 사유가 발생한 날부터 5일 이내에 처리합니다. 1회권 · 휴식권 적용 시의 세부 기준은 스튜디오로 문의해주세요.</p>
      `,
    },
    en: {
      title: 'Class Policy & Refunds',
      html: `
        <h3>Class policy</h3>
        <ul>
          <li>Your registration is confirmed only after payment (bank transfer).</li>
          <li>A 4-week pass covers 4 weekly classes from the start date you choose. Special classes with a set period can only be taken within that period, and rest passes do not apply.</li>
          <li>Regular classes (no set period) can be joined any week, and rest passes apply.</li>
          <li>A 1-time pass is valid for the one class on the date you choose.</li>
          <li>Schedules may change (cancellations, substitute instructors). We will let you know individually.</li>
        </ul>
        <h3>Refunds</h3>
        <p>Refunds follow the statutory refund table for private academies in Korea.</p>
        <table>
          <thead><tr><th>When you cancel</th><th>Refund</th></tr></thead>
          <tbody>
            <tr><td>Before the first class</td><td>Full amount</td></tr>
            <tr><td>Before 1/3 of total class time</td><td>2/3 of the fee</td></tr>
            <tr><td>From 1/3 to before 1/2</td><td>1/2 of the fee</td></tr>
            <tr><td>After 1/2</td><td>No refund</td></tr>
          </tbody>
        </table>
        <p class="muted">Refunds are processed within 5 days. Please contact us for details on 1-time passes and rest passes.</p>
      `,
    },
  },
  privacy: {
    ko: {
      title: '개인정보 수집 · 이용 동의',
      html: `
        <table>
          <tbody>
            <tr><th>수집 항목</th><td>(필수) 이름, 연락처, 신청 수업 · 수강권 · 수강일<br />(만 14세 미만) 보호자 이름, 보호자 연락처<br />(선택) 연령대, 현금영수증 발급 번호, 신청 경로, 관심 분야, 문의 사항</td></tr>
            <tr><th>수집 목적</th><td>수강 신청 접수, 수납 확인, 수강 안내 및 일정 변경 연락, 현금영수증 발급</td></tr>
            <tr><th>보유 기간</th><td>수강 종료 후 1년. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다. <span class="muted">[확인 필요]</span></td></tr>
            <tr><th>처리 위탁 · 국외 이전</th><td>신청 정보는 Google LLC의 클라우드 서비스(Google Sheets)에 저장되며, 데이터는 국외(미국 등) 서버에 보관될 수 있습니다. 이전 시점: 신청서 제출 시 / 이전 방법: 네트워크 전송</td></tr>
          </tbody>
        </table>
        <p>개인정보 수집 · 이용에 동의하지 않을 수 있습니다. 다만 필수 항목에 동의하지 않으면 수강 신청이 어렵습니다.</p>
        <p>만 14세 미만 아동의 개인정보는 법정대리인(보호자)의 동의를 받아 처리합니다.</p>
        <p class="muted">개인정보 열람 · 정정 · 삭제 요청은 카카오 채널로 문의해주세요.</p>
      `,
    },
    en: {
      title: 'Consent to Personal Information',
      html: `
        <table>
          <tbody>
            <tr><th>What we collect</th><td>(Required) Name, phone number, selected class · pass · date<br />(Under 14) Guardian's name and phone number<br />(Optional) Age group, cash-receipt number, how you found us, interests, questions</td></tr>
            <tr><th>Purpose</th><td>Processing your registration, confirming payment, class notices and schedule changes, issuing cash receipts</td></tr>
            <tr><th>Retention</th><td>1 year after your classes end, or longer where the law requires.</td></tr>
            <tr><th>Storage</th><td>Your information is stored in Google Sheets (Google LLC), and may be kept on servers outside Korea (e.g. the US).</td></tr>
          </tbody>
        </table>
        <p>You may decline, but we cannot process your registration without the required items.</p>
        <p>For children under 14, we process personal information with a guardian's consent.</p>
        <p class="muted">To view, correct or delete your information, contact us on our Kakao channel.</p>
      `,
    },
  },
};
