# Dean Video Player - 보안 가이드

## 보안 기능

### 1. 입력 검증
- 비디오 소스 URL 검증 (HTTP/HTTPS 프로토콜만 허용)
- 컨테이너 요소 존재 및 DOM 연결 확인
- 옵션 매개변수 유효성 검사

### 2. XSS 방지
- HTML 콘텐츠 자동 이스케이프 처리
- 인라인 스타일 최소화 (CSP 준수)
- 사용자 입력 데이터 검증

### 3. CORS 정책
- 미리보기 비디오에 `crossOrigin="anonymous"` 설정
- 외부 리소스 로드 시 적절한 CORS 헤더 요구

## 배포 시 권장 보안 설정

### Content Security Policy (CSP)
웹 서버에서 다음 CSP 헤더를 설정하는 것을 권장합니다:

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  media-src 'self' https:;
  connect-src 'self' https:;
  font-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
```

### HTTPS 사용
- 프로덕션 환경에서는 반드시 HTTPS 사용
- 비디오 소스도 HTTPS URL 사용 권장

### 추가 보안 헤더
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## 보안 모범 사례

### 1. 비디오 소스 관리
```javascript
// 안전한 비디오 소스 설정
const player = new VideoPlayer({
  container: '#player',
  src: 'https://trusted-domain.com/video.mp4', // HTTPS 사용
  events: {
    error: (error) => {
      console.error('플레이어 오류:', error.message);
      // 상세한 오류 정보는 로그에만 기록
    }
  }
});
```

### 2. 에러 처리
```javascript
// 보안을 고려한 에러 처리
player.events.error = (error) => {
  // 사용자에게는 일반적인 메시지만 표시
  showUserMessage('비디오를 로드할 수 없습니다.');
  
  // 상세한 오류는 개발자 도구에만 기록
  console.error('Video Player Error:', error);
};
```

### 3. 동적 콘텐츠 처리
```javascript
// 사용자 입력 데이터 검증
function setVideoTitle(title) {
  // HTML 이스케이프 처리
  const safeTitle = title.replace(/[<>&"']/g, (char) => {
    const escapeMap = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    return escapeMap[char];
  });
  
  document.getElementById('video-title').textContent = safeTitle;
}
```

## 취약점 보고

보안 취약점을 발견하신 경우, 다음 방법으로 보고해 주세요:
- 이메일: security@example.com
- 이슈 트래커: GitHub Issues (민감하지 않은 경우)

## 업데이트 정책

- 보안 패치는 최우선으로 배포됩니다
- 정기적인 의존성 업데이트를 권장합니다
- 보안 공지사항은 릴리스 노트에서 확인할 수 있습니다
