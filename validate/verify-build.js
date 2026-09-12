/* verify-build.js — sanity checks on the built single-file HTML */
'use strict';
const fs = require('fs');
const s = fs.readFileSync('English-Grammar-Lab.html', 'utf8');

let dd = 0, p = 0;
while ((p = s.indexOf('$$', p)) > -1) { dd++; p += 2; }
console.log('double-dollar count in build:', dd);

const checks = [
  ['helpers var $$ defined', 'var $$ = function (sel, root)'],
  ['ui-ai module binds $$', '$$ = U.$$'],
  ['EGL.u exports $$', '$$: $$'],
  ['genLog still present', 'id="genLog"'],
  ['授权弹窗入口已内联', 'data-egl-ok'],
  ['品牌署名样式已内联', 'learn-head::after'],
  ['品牌 / 版权模块已内联', 'E.brand = {'],
  ['署名印章与展开署名已内联', 'egl-seal-panel'],
  ['页脚版本号已内联', 'egl-foot-ver'],
  ['顶栏品牌文字可收起（竖屏/窄屏只留图标）', '.topbar .brand .brand-text'],
  ['底部白边修复：固定背景层 + 画布底色', 'body::before {'],
  ['题干空位只有一条虚线（无下划线字符）', '<span class="blank"></span>'],
  ['编号空位只有一条虚线（无下划线字符）', '<i class="pb-u"></i>'],
  ['同路由导航不再整页重绘（首页点图标不抽搐）', 'function go(route, force)'],
];
let failed = 0;
for (const [name, needle] of checks) {
  const ok = s.indexOf(needle) > -1;
  if (!ok) failed++;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name);
}
// 精确否定检查：绝不能有模块把 $$ 绑成单元素选择器（源码/build 损坏的历史特征）。
// 注意 (?!\$) 排除掉正常的 "$$ = U.$$"。
const badBind = /\$\$\s*=\s*U\.\$(?!\$)/.test(s);
if (badBind) failed++;
console.log((badBind ? 'FAIL' : 'PASS') + '  no module binds $$ to single-selector ($$ = U.$)');

// 已移除的 AI 调试面板不应再出现（防止回退）
const badDbg = /eglDbgPanel|data-egl-dbg|EGL_AI_DBG_LOG/.test(s);
if (badDbg) failed++;
console.log((badDbg ? 'FAIL' : 'PASS') + '  no AI debug panel in build');

// 版本号占位符必须被替换掉（否则页脚会显示 __EGL_VER__）
const badVer = /__EGL_VER__/.test(s);
if (badVer) failed++;
console.log((badVer ? 'FAIL' : 'PASS') + '  version placeholder replaced');

// 题干空格的“小框”已去掉，只保留虚线（回归：勿把 glow 阴影加回来）
const blankGlow = /\.qtext \.blank\s*\{[^}]*box-shadow/.test(s);
if (blankGlow) failed++;
console.log((blankGlow ? 'FAIL' : 'PASS') + '  no box-shadow on .qtext .blank');

if (failed) process.exitCode = 1;
