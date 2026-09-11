/* ============================================================
 * scan-dollar.js — 检测 String.replace 的“替换串”里含 $ 特殊模式
 * 历史坑：build.js 曾把字符串当 replace 的替换值 → `$$` 被当成占位符吞成 `$`，
 * 导致产物里 `$$` 助手全坏。正确写法是用函数替换：replace(re, () => '...')。
 * 本脚本只针对“第二个参数是字符串字面量”的 replace 报警（函数替换安全），
 * 且只查 $$ / $' / $`（刻意不查 $&、$1-$9：它们是“插入匹配/捕获组”的正当惯用法）。
 * 有命中 → 退出码 1（作为构建/提交前的硬门槛）。
 * 用法：node validate/scan-dollar.js
 * ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const HAZARDS = [/\$\$/, /\$'/, /\$`/];

function findReplaceHazards(code) {
  const hits = [];
  const re = /\.replace\s*\(/g;
  let m;
  while ((m = re.exec(code))) {
    let i = m.index + m[0].length;
    let depth = 1;            // 已在 replace( 的括号内
    let commaAt = -1;
    let quote = null, escNext = false;
    for (; i < code.length; i++) {
      const ch = code[i];
      if (quote) {
        if (escNext) escNext = false;
        else if (ch === '\\') escNext = true;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') { depth--; if (depth === 0) break; }
      else if (ch === ',' && depth === 1 && commaAt < 0) commaAt = i;
    }
    if (commaAt < 0) continue;
    let j = commaAt + 1;
    while (j < code.length && /\s/.test(code[j])) j++;
    const q = code[j];
    if (q !== '"' && q !== "'" && q !== '`') continue; // 函数替换 → 安全
    let k = j + 1, esc = false;
    for (; k < code.length; k++) {
      const c = code[k];
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === q) break;
    }
    const lit = code.slice(j, k + 1);
    if (HAZARDS.some((r) => r.test(lit))) {
      hits.push({ lit: lit.replace(/\n/g, ' '), line: code.slice(0, j).split('\n').length });
    }
  }
  return hits;
}

function main() {
  let total = 0;
  function scan(dir, exts, label) {
    const out = [];
    const walk = (d) => {
      for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        const st = fs.statSync(p);
        if (st.isDirectory()) walk(p);
        else if (exts.some((e) => f.endsWith(e))) {
          const s = fs.readFileSync(p, 'utf8');
          for (const h of findReplaceHazards(s)) out.push(f + ':' + h.line + '  ' + h.lit);
        }
      }
    };
    walk(dir);
    console.log('== ' + label + ' ==');
    out.forEach((o) => console.log('  ⚠ ' + o));
    if (!out.length) console.log('  (none)');
    total += out.length;
  }

  const ROOT = path.join(__dirname, '..');
  scan(path.join(ROOT, 'src'), ['.js', '.css'], 'src');
  scan(path.join(ROOT, 'data'), ['.js'], 'data');
  scan(ROOT, ['build.js', 'template.html'], 'root');

  if (total) {
    console.log('\n❌ 发现 ' + total + ' 处 String.replace 替换串含 $ 特殊模式（请改用函数替换 () => ...）');
    process.exitCode = 1;
  } else {
    console.log('\n✅ 未发现 String.replace 替换串 $ 危险');
  }
}

if (require.main === module) main();
module.exports = { findReplaceHazards };
