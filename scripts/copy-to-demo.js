#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  const srcDir = path.join(__dirname, "../dist");
  const destDir = path.join(__dirname, "../demo/dist");

  if (fs.existsSync(srcDir)) {
    // 기존 demo/dist 폴더 삭제
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true });
    }

    // dist 폴더를 demo로 복사
    copyDir(srcDir, destDir);
    console.log("✅ dist 폴더가 demo/dist로 복사되었습니다");
  } else {
    console.log("❌ dist 폴더를 찾을 수 없습니다. 먼저 빌드를 실행하세요.");
  }
} catch (error) {
  console.error("❌ 복사 중 오류 발생:", error.message);
}
