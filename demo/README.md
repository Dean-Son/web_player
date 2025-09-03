# 🎬 Dean Video Player v2.0 - Demo

## 🚀 원클릭 실행 - 설치형 라이브러리

**JavaScript 파일 하나만 로드하면 CSS도 자동으로 포함됩니다!**
별도의 CSS 링크 태그가 필요 없는 완전한 설치형 라이브러리입니다.

## 🎯 간단한 사용법

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Video Player</title>
  </head>
  <body>
    <div id="player"></div>

    <!-- JavaScript 파일 하나만 로드! CSS 자동 포함 -->
    <script src="./dist/index.umd.js"></script>
    <script>
      const player = new deanVideoPlayer.VideoPlayer({
        container: "#player",
        src: "video.mp4",
      });
    </script>
  </body>
</html>
```

### 방법 1: 파일 직접 열기

1. `index.html` 또는 `test-simple.html`을 **더블클릭**
2. 브라우저에서 자동으로 열림
3. VideoPlayer가 바로 동작! 🎯

### 방법 2: 파일 탐색기에서 실행

- **Windows**: 우클릭 → "다음으로 열기" → 브라우저 선택
- **Mac**: 우클릭 → "다음으로 열기" → 브라우저 선택
- **Linux**: 우클릭 → "Open with" → 브라우저 선택

## 📁 파일 구조

```
demo/
├── index.html              # 🎨 전체 기능 데모
├── test-simple.html        # 🧪 간단한 테스트
├── dist/                   # 📦 빌드된 라이브러리 파일들
│   ├── index.umd.js        # 메인 라이브러리
│   ├── index.umd.css       # 스타일시트
│   └── ... (기타 파일들)
└── README.md              # 📖 이 문서

```

## 🎯 테스트 방법

### 1. **test-simple.html** - 기본 테스트

- 간단한 VideoPlayer 로드 테스트
- 에러 메시지 표시
- 기본 이벤트 로그

### 2. **index.html** - 전체 기능 데모

- 🎨 모듈화된 아키텍처 데모
- ♿ 접근성 테스트 (색각 이상 모드 등)
- 🎮 6개 테마 옵션
- 🔧 고급 테스트 도구들
- 📊 성능 모니터링
- 🎯 실시간 미리보기

## 🔧 디버깅 방법

1. **F12**로 개발자 도구 열기
2. **Console** 탭에서 로그 확인
3. 에러 발생 시 상세 메시지 확인

### ✅ 성공 시 로그

```
🎬 스크립트 로드 완료
✅ VideoPlayer 클래스 발견
✅ VideoPlayer 생성 성공: VideoPlayer {...}
🔄 비디오 로드 시작
📊 메타데이터 로드 완료
```

### ❌ 실패 시 해결 방법

1. **브라우저 새로고침** (Ctrl+F5 또는 Cmd+Shift+R)
2. **다른 브라우저**에서 시도
3. **개발자 도구**에서 에러 메시지 확인

## 🌟 주요 기능

- 🎯 **실시간 프레임 미리보기**
- ♿ **WCAG AA 수준 접근성**
- 🎨 **6개 테마 + 색각 이상 지원**
- 📱 **완전 반응형 디자인**
- 🎮 **키보드 네비게이션**
- 🔊 **ARIA 라벨 및 스크린 리더 지원**
- ⚡ **RAF 기반 성능 최적화**
- 🧹 **완전한 메모리 관리**

## 📝 개발자용 노트

이 demo는 **단독 HTML 파일**로 설계되어:

- CDN 불필요
- 웹서버 불필요
- 인터넷 연결 불필요 (비디오 제외)
- **어디서든 바로 실행 가능** 🚀

## 🎬 비디오 소스

데모에서 사용하는 비디오:

- **Big Buck Bunny** (오픈소스 테스트 비디오)
- Google Cloud Storage에서 호스팅
- 인터넷 연결 필요 (비디오 스트리밍용)

---

## 🆘 문제가 있나요?

1. **F12 → Console** 에서 에러 확인
2. 브라우저 **캐시 지우기**
3. **다른 브라우저**에서 테스트
4. `dist/` 폴더가 있는지 확인

**Happy Coding!** 🎉
