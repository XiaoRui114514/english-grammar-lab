#!/usr/bin/env node
/* ============================================================
 * build.js — 把源码 + 题库内联为单文件可双击运行的 HTML
 * 用法：node build.js
 * 产物：English-Grammar-Lab.html（本项目唯一交付物）
 * ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'English-Grammar-Lab.html');

function read(p) { return fs.readFileSync(path.join(SRC, p), 'utf8'); }

function dataFiles() {
  const names = fs.readdirSync(DATA)
    .filter(f => /^bank-.*\.js$/.test(f))
    .sort((a, b) => {
      // tense 数字排序在前，challenge 最后
      const na = a.match(/(\d+)/), nb = b.match(/(\d+)/);
      const ia = na ? parseInt(na[1], 10) : 99;
      const ib = nb ? parseInt(nb[1], 10) : 99;
      if (ia !== ib) return ia - ib;
      return a < b ? -1 : 1;
    });
  const parts = [];
  // 元数据必须先于题库加载：路线图 / 课程体系 / 解题方法课
  ['roadmap.js', 'curriculum.js', 'method-course.js'].forEach(f => {
    const p = path.join(DATA, f);
    if (fs.existsSync(p)) parts.push(fs.readFileSync(p, 'utf8'));
  });
  names.forEach(n => parts.push(fs.readFileSync(path.join(DATA, n), 'utf8')));
  return parts.join('\n');
}

// 防 `</script>` 提前闭合
function safeJs(code) {
  return code.replace(/<\/script/gi, '<\\/script');
}

// ⚠️ 必须把“函数”传给 replace 当替换值：字符串替换会把 $ 序列当占位符
// （$$→$、$&→整段匹配…），导致源码里的 $$、$& 等被吞掉/写坏。
let html = read('template.html');
html = html.replace('/*__STYLES__*/', () => read('styles.css'));
html = html.replace('/*__DATA__*/', () => safeJs(dataFiles()));

// 品牌区块：styles.css 里 __BRAND_CSS_START__ … __BRAND_CSS_END__ 之间的样式
// 原样注入 brand.js，由运行时二次写入并自愈（删掉样式表也去不掉水印）。
const brandCssMatch = read('styles.css').match(/\/\*__BRAND_CSS_START__\*\/([\s\S]*?)\/\*__BRAND_CSS_END__\*\//);
const brandCss = brandCssMatch ? brandCssMatch[1] : '';

// 版本号：单一来源 package.json 的 version，构建时写进品牌区块（页脚显示）
let appVer = 'v0.0.0';
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  if (pkg.version) appVer = 'v' + pkg.version;
} catch (e) { /* package.json 缺失时用兜底版本，不阻断构建 */ }

const appParts = ['brand.js', 'core.js', 'ui-helpers.js', 'ai.js', 'ui-views.js', 'ui-quiz.js', 'ui-ai.js', 'boot.js']
  .map(f => read(f))
  .map(code => code.indexOf('"/*__BRAND_CSS__*/"') < 0
    ? code
    : code.replace('"/*__BRAND_CSS__*/"', () => JSON.stringify(brandCss)))
  .map(code => code.indexOf("'__EGL_VER__'") < 0
    ? code
    : code.replace("'__EGL_VER__'", () => JSON.stringify(appVer)))
  .join('\n\n');
html = html.replace('/*__APP__*/', () => safeJs(appParts));

fs.writeFileSync(OUT, html, 'utf8');
console.log('✅ 已生成 ' + OUT + '  (' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB)');
