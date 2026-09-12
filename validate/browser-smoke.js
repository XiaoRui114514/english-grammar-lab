#!/usr/bin/env node
/* ============================================================
 * validate/browser-smoke.js — 真实浏览器(Chrome headless)冒烟测试
 * 用法：node validate/browser-smoke.js
 * 依赖：本机装有 Chrome（自动探测路径）
 * 流程：打开 English-Grammar-Lab.html → 依次执行动作，读取页面状态
 * ============================================================ */
'use strict';
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'English-Grammar-Lab.html');

const chromeCands = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean);

const CHROME = chromeCands.find(p => fs.existsSync(p));
if (!CHROME) { console.log('SKIP: 未找到 Chrome/Edge，跳过浏览器冒烟测试'); process.exit(0); }

// 通过 chrome --headless --dump-dom + --virtual-time-budget 执行 JS
function run(url, waitMs) {
  return new Promise((resolve) => {
    const args = [
      '--headless=new', '--disable-gpu', '--no-sandbox',
      '--allow-file-access-from-files',
      '--virtual-time-budget=' + (waitMs || 3000),
      '--dump-dom', url
    ];
    const child = spawn(CHROME, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('close', () => resolve({ out, err }));
  });
}

async function main() {
  const url = 'file:///' + HTML.replace(/\\/g, '/');
  const res = await run(url, 3500);

  const dom = res.out;
  const problems = [];
  if (!dom) { console.log('FAIL: 无 DOM 输出'); process.exit(1); }

  const hasHome = /上海初高语法填空|选择专题|继续学习/.test(dom);
  problems.push(['首页渲染', hasHome]);

  // 检查是否有明显 JS 错误痕迹（chrome 会输出到 stderr 或页面保持空）
  const errSample = (res.err || '').slice(0, 1200);
  problems.push(['无致命JS错误', !/Uncaught|SyntaxError|ReferenceError|TypeError/.test(res.err || '')]);

  // 常见视图入口的文本都应出现
  problems.push(['含 01 一般现在时', /01<\/span><span class="tt">一般现在时/.test(dom) || /一般现在时/.test(dom)]);

  let fails = problems.filter(p => !p[1]);
  console.log('— 浏览器冒烟结果 —');
  problems.forEach(p => console.log((p[1] ? '  ✓ ' : '  ✗ ') + p[0]));
  if (fails.length) {
    console.log('stderr 片段:', errSample);
    process.exit(1);
  }
  console.log('OK');
}
main();
