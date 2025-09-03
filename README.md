# 🎬 dean Video Player

자바스크립트에서 import하여 사용할 수 있는 고급 기능을 갖춘 동영상 플레이어 라이브러리입니다.

## ✨ 주요 기능

- 📱 **16:9 반응형 디자인** - 모든 화면 크기에 최적화
- 🖱️ **마우스 오버 컨트롤** - 플레이어에 마우스 오버 시 오버레이 컨트롤 표시
- 🔍 **실시간 프레임 미리보기** - 진행 바에 마우스 오버 시 해당 시간의 프레임을 실시간으로 캡처하여 미리보기 표시
- ⏯️ **재생 컨트롤** - 재생/일시정지, 10초 앞으로/뒤로 이동
- ⚡ **속도 조절** - 0.5x, 1x, 1.5x, 2x 재생 속도 지원
- 🔊 **오디오 컨트롤** - 볼륨 조절 및 음소거 기능
- 🖥️ **전체화면 모드** - 몰입감 있는 시청 경험
- ⏱️ **진행 시간 표시** - 현재 시간 및 총 재생 시간
- 📏 **사용자 정의 크기** - 픽셀 단위 또는 CSS 단위로 크기 조절 가능
- 🎨 **커스터마이징 가능한 테마** - 색상 및 디자인 요소 조정 가능
- ⌨️ **키보드 단축키** - 편리한 키보드 조작 지원
- 📡 **이벤트 시스템** - 다양한 이벤트 콜백 제공
- 📘 **TypeScript 지원** - 완전한 타입 안전성

## 🚀 설치

```bash
npm install dean-video-player
```

## 📖 사용 방법

### 기본 사용법

```javascript
import { VideoPlayer } from "dean-video-player";

const player = new VideoPlayer({
  container: "#video-container", // 또는 HTMLElement
  src: "path/to/your/video.mp4",
  poster: "path/to/poster.jpg",
  width: 800, // 픽셀 단위 또는 CSS 단위 문자열
  height: 450, // 픽셀 단위 또는 CSS 단위 문자열
  aspectRatio: "16:9", // 화면 비율 설정
  autoplay: false,
  muted: false,
});
```

### HTML

```html
<div id="video-container"></div>
```

### 테마 커스터마이징

```javascript
const player = new VideoPlayer({
  container: "#video-container",
  src: "video.mp4",
  theme: {
    primaryColor: "#ff6b6b",
    backgroundColor: "#2c3e50",
    textColor: "#ecf0f1",
    progressColor: "#e74c3c",
    controlsBackground: "rgba(0, 0, 0, 0.8)",
    hoverColor: "#c0392b",
  },
});
```

### 크기 및 비율 설정

```javascript
// 픽셀 단위로 고정 크기 설정
const player = new VideoPlayer({
  container: "#video-container",
  src: "video.mp4",
  width: 800,
  height: 450,
});

// CSS 단위로 크기 설정
const player = new VideoPlayer({
  container: "#video-container",
  src: "video.mp4",
  width: "100%",
  height: "50vh",
});

// 화면 비율만 설정 (반응형)
const player = new VideoPlayer({
  container: "#video-container",
  src: "video.mp4",
  aspectRatio: "21:9", // 와이드 스크린
});
```

### 실시간 프레임 미리보기

```javascript
// 자동 실시간 프레임 캡처 (기본)
const player = new VideoPlayer({
  container: "#video-container",
  src: "video.mp4",
  // previewImages 없이 사용하면 자동으로 실시간 캡처
});

// 정적 이미지와 실시간 캡처 혼합
const player = new VideoPlayer({
  container: "#video-container",
  src: "video.mp4",
  previewImages: [
    { time: 0, url: "custom_intro.jpg" }, // 특정 시간만 커스텀 이미지
    { time: 300, url: "custom_ending.jpg" }, // 나머지는 실시간 캡처
  ],
});

// 동적 이미지 생성 함수 사용
const player = new VideoPlayer({
  container: "#video-container",
  src: "video.mp4",
  generatePreview: (time) => `thumbnails/frame_${Math.floor(time)}.jpg`,
});
```

## 🎮 API 메서드

### 재생 컨트롤

```javascript
player.play(); // 재생
player.pause(); // 일시정지
player.togglePlay(); // 재생/일시정지 토글
player.seek(10); // 10초 앞으로
player.seek(-10); // 10초 뒤로
player.setCurrentTime(60); // 특정 시간으로 이동 (초)
```

### 볼륨 및 속도 조절

```javascript
player.setVolume(0.5); // 볼륨 설정 (0-1)
player.toggleMute(); // 음소거 토글
player.setPlaybackRate(1.5); // 재생 속도 설정 (0.5, 1, 1.5, 2)
```

### 화면 및 UI

```javascript
player.toggleFullscreen(); // 전체화면 토글
player.updateTheme(newTheme); // 테마 업데이트
player.updatePreviewImages(newImages); // 미리보기 이미지 업데이트
player.setPreviewGenerator((time) => `preview_${Math.floor(time)}.jpg`); // 미리보기 생성 함수 설정
player.setSize(800, 450); // 크기 설정 (픽셀)
player.setSize("100%", "50vh"); // 크기 설정 (CSS 단위)
player.setSize(); // 기본 크기로 복원
player.setAspectRatio("21:9"); // 화면 비율 변경
```

### 상태 조회

```javascript
const state = player.getState();
console.log(state.isPlaying); // 재생 중 여부
console.log(state.currentTime); // 현재 시간
console.log(state.duration); // 총 재생 시간
console.log(state.volume); // 현재 볼륨
console.log(state.playbackRate); // 현재 재생 속도
```

## 📡 이벤트 리스너

```javascript
// 재생 이벤트
player.on("play", () => console.log("재생 시작"));
player.on("pause", () => console.log("일시정지"));

// 시간 업데이트
player.on("timeupdate", (currentTime) => {
  console.log("현재 시간:", currentTime);
});

// 볼륨 변경
player.on("volumechange", (volume) => {
  console.log("볼륨:", volume);
});

// 속도 변경
player.on("ratechange", (rate) => {
  console.log("재생 속도:", rate);
});

// 전체화면 변경
player.on("fullscreenchange", (isFullscreen) => {
  console.log("전체화면:", isFullscreen);
});

// 미리보기 호버
player.on("previewhover", (time) => {
  console.log("미리보기 호버:", time + "초");
});

// 이벤트 제거
player.off("play");
```

## ⌨️ 키보드 단축키

| 키      | 기능          |
| ------- | ------------- |
| `Space` | 재생/일시정지 |
| `←`     | 10초 뒤로     |
| `→`     | 10초 앞으로   |
| `↑`     | 볼륨 증가     |
| `↓`     | 볼륨 감소     |
| `M`     | 음소거 토글   |
| `F`     | 전체화면 토글 |

## 🎨 테마 옵션

```typescript
interface VideoPlayerTheme {
  primaryColor?: string; // 주요 색상 (버튼, 진행바 등)
  secondaryColor?: string; // 보조 색상
  backgroundColor?: string; // 배경 색상
  textColor?: string; // 텍스트 색상
  controlsBackground?: string; // 컨트롤 배경 색상
  progressColor?: string; // 진행바 색상
  progressBackgroundColor?: string; // 진행바 배경 색상
  hoverColor?: string; // 호버 시 색상
}
```

## 🔍 미리보기 이미지

```typescript
interface PreviewImage {
  time: number; // 시간 (초)
  url: string; // 이미지 URL
}
```

진행 바에 마우스를 올리면 해당 시간의 미리보기 이미지가 작은 툴팁 형태로 표시됩니다.

## 🛠️ 개발 및 빌드

```bash
# 의존성 설치
npm install

# 개발 모드 (빌드 + 데모 서버)
npm start

# 빌드만
npm run build

# 데모 서버만
npm run serve
```

## 📦 빌드 출력

- `dist/index.js` - CommonJS 모듈
- `dist/index.esm.js` - ES 모듈
- `dist/index.umd.js` - UMD 모듈 (브라우저 직접 사용)
- `dist/index.d.ts` - TypeScript 타입 정의
- `dist/index.css` - CSS 스타일

## 🌐 브라우저 지원

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📄 라이선스

MIT License

## 🤝 기여하기

이슈 리포트나 풀 리퀘스트는 언제나 환영합니다!

---

Made with ❤️ by dean
