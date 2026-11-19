// Reading a JavaScript file's text without its comments and the insides of its strings: shared by the unused-code check
// (scripts/unused.js) and the code audit's measures (tools/dev/audit/), so one reader holds what a comment, a string, a template and a
// regular expression are.  stripComments(src) -> { code, shape }

// Where the string or template literal that opens at src[i] ends (the index of its closing quote): a template's `${ ... }` is
// scanned as code, so a quote or a template inside it does not end the outer one.
function litEnd(src, i) {
  const c = src[i], n = src.length;
  let j = i + 1;
  while (j < n && src[j] !== c) {
    if (c !== '`' && src[j] === '\n') return j - 1;
    if (src[j] === '\\') { j += 2; continue; }
    if (c === '`' && src[j] === '$' && src[j + 1] === '{') {
      let depth = 1; j += 2;
      while (j < n && depth) {
        const d = src[j];
        if (d === '"' || d === "'" || d === '`') j = litEnd(src, j) + 1;
        else { depth += d === '{' ? 1 : d === '}' ? -1 : 0; j++; }
      }
      continue;
    }
    j++;
  }
  return j;
}

// A JS file's text with its comments taken out (strings, template literals and regular expressions kept as they are), and the same
// text with the insides of those blanked (a literal a pair of brackets round blanks), which is what brackets are counted in.
function stripComments(src) {
  let out = '', shape = '', i = 0, prev = '';
  const blank = t => t.replace(/[^\n]/g, ' ');
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; out += ' '; shape += ' '; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const j = litEnd(src, i), lit = src.slice(i, j + 1);
      // in the shape the literal is a pair of brackets round blanks, so a literal spanning lines keeps a declaration open
      out += lit; shape += '(' + blank(lit.slice(1, -1)) + (lit.length > 1 ? ')' : ''); i = j + 1; prev = c; continue;
    }
    if (c === '/' && (prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || /(?<![\w$])(?:return|typeof|case|in|of)$/.test(out.trimEnd().slice(-6)))) {
      let j = i + 1, cls = false;
      while (j < n && src[j] !== '\n' && (src[j] !== '/' || cls)) { if (src[j] === '\\') j++; else if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; j++; }
      out += src.slice(i, j + 1); shape += blank(src.slice(i, j + 1)); i = j + 1; prev = '/'; continue;
    }
    out += c; shape += c; if (!/\s/.test(c)) prev = c; i++;
  }
  return { code: out, shape };
}

module.exports = { litEnd, stripComments };
