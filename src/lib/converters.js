import { json2csv, csv2json } from 'json-2-csv';
import YAML from 'yaml';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { stringify as tomlStringify, parse as tomlParse } from 'smol-toml';
import JsonToTS from 'json-to-ts';
import ExcelJS from 'exceljs';
import jmespath from 'jmespath';
import microdiff from 'microdiff';
import toJsonSchema from 'to-json-schema';

// ─── CSV ────────────────────────────────────────────────────────────────────

function flattenObj(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenObj(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function unwindRow(item, prefix = '') {
  const flat = flattenObj(item, prefix);
  // Find the first key whose value is an array of objects
  const arrayKey = Object.keys(flat).find(k => {
    const v = flat[k];
    return Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null;
  });
  if (!arrayKey) return [flat];
  const children = flat[arrayKey];
  const rest = Object.fromEntries(Object.entries(flat).filter(([k]) => k !== arrayKey));
  return children.flatMap(child => {
    const childFlat = flattenObj(child, arrayKey);
    return unwindRow({ ...rest, ...childFlat });
  });
}

export async function csvToJson(input) {
  return csv2json(input, { excelBOM: false, trimHeaderFields: true, trimFieldValues: true });
}

export async function jsonToCsv(input) {
  const data = Array.isArray(input) ? input : [input];
  const rows = data.flatMap(item => unwindRow(item));
  const csv = await json2csv(rows, {
    excelBOM: false,
    expandArrayObjects: false,
    trimHeaderFields: true,
    trimFieldValues: true,
  });
  // json-2-csv escapes dots in keys — unescape the header line only
  const lines = csv.split('\n');
  lines[0] = lines[0].replace(/\\./g, '.');
  return lines.join('\n');
}

// ─── YAML ───────────────────────────────────────────────────────────────────

export function yamlToJson(input) {
  return YAML.parse(input, { prettyErrors: true });
}

export function jsonToYaml(input) {
  return YAML.stringify(input, null, { indent: 4 });
}

// ─── XML ────────────────────────────────────────────────────────────────────

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseTagValue: true,
  trimValues: true,
  ignoreDeclaration: true,
});

const xmlBuilder = new XMLBuilder({
  format: true,
  indentBy: '  ',
  suppressEmptyNode: false,
  processEntities: true,
});

export function xmlToJson(input) {
  const parsed = xmlParser.parse(input);
  return parsed;
}

function escapeXmlValue(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function buildXmlNode(tag, value, indent) {
  const pad = '  '.repeat(indent);
  if (value === null || value === undefined) return `${pad}<${tag}/>`;
  if (Array.isArray(value)) {
    return value.map(item => buildXmlNode(tag, item, indent)).join('\n');
  }
  if (typeof value === 'object') {
    const children = Object.entries(value)
      .map(([k, v]) => buildXmlNode(k, v, indent + 1))
      .join('\n');
    return `${pad}<${tag}>\n${children}\n${pad}</${tag}>`;
  }
  return `${pad}<${tag}>${escapeXmlValue(value)}</${tag}>`;
}

export function jsonToXml(input) {
  if (typeof input !== 'object' || input === null) {
    throw new Error('JSON must be an object or array.');
  }
  const body = Array.isArray(input)
    ? input.map(item => buildXmlNode('item', item, 1)).join('\n')
    : Object.entries(input).map(([k, v]) => buildXmlNode(k, v, 1)).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${body}\n</root>\n`;
}

// ─── PHP ────────────────────────────────────────────────────────────────────

function jsObjectToPhpArray(obj, indentLevel = 0) {
  const indent = ' '.repeat(indentLevel * 4);
  const arrayEntries = Object.entries(obj).map(([key, value]) => {
    const isNumericKey = !isNaN(key);
    const phpKey = isNumericKey ? '' : `'${key}' => `;
    let phpValue;
    if (value === null) {
      phpValue = 'null';
    } else if (typeof value === 'object') {
      phpValue = jsObjectToPhpArray(value, indentLevel + 1);
    } else if (typeof value === 'string') {
      phpValue = `'${value.replace(/'/g, "\\'")}'`;
    } else {
      phpValue = value;
    }
    return `${indent}    ${phpKey}${phpValue}`;
  });
  return `[\n${arrayEntries.join(',\n')}\n${indent}]`;
}

export function jsonToPhp(input) {
  if (typeof input !== 'object' || input === null) {
    throw new Error('JSON must be an object or array.');
  }
  return `<?php\n\n$data = ${jsObjectToPhpArray(input)};\n`;
}

function parsePhpValue(str, pos) {
  const skipWs = (i) => { while (i < str.length && /\s/.test(str[i])) i++; return i; };
  pos = skipWs(pos);
  if (pos >= str.length) return { value: null, pos };
  const ch = str[pos];

  if (ch === '"' || ch === "'") {
    const q = ch;
    let val = '';
    pos++;
    while (pos < str.length) {
      if (str[pos] === '\\' && pos + 1 < str.length) { val += str[pos + 1]; pos += 2; }
      else if (str[pos] === q) { pos++; break; }
      else { val += str[pos++]; }
    }
    return { value: val, pos };
  }

  if (str.slice(pos, pos + 5).match(/^array\s*\(/i)) {
    const m = str.slice(pos).match(/^array\s*\(/i);
    pos += m[0].length;
    return parsePhpArray(str, pos, ')');
  }

  if (str[pos] === '[') return parsePhpArray(str, pos + 1, ']');

  if (str.slice(pos, pos + 4).toLowerCase() === 'true') return { value: true, pos: pos + 4 };
  if (str.slice(pos, pos + 5).toLowerCase() === 'false') return { value: false, pos: pos + 5 };
  if (str.slice(pos, pos + 4).toLowerCase() === 'null') return { value: null, pos: pos + 4 };

  let numStr = '';
  if (str[pos] === '-') numStr += str[pos++];
  while (pos < str.length && /[\d.]/.test(str[pos])) numStr += str[pos++];
  if (numStr && numStr !== '-') return { value: parseFloat(numStr), pos };

  return { value: null, pos };
}

function parsePhpArray(str, pos, closeChar) {
  const result = [];
  const obj = {};
  let isObj = false;
  const skipWs = (i) => { while (i < str.length && /\s/.test(str[i])) i++; return i; };

  while (pos < str.length) {
    pos = skipWs(pos);
    if (pos >= str.length || str[pos] === closeChar) { pos++; break; }
    if (str[pos] === ',') { pos++; continue; }

    const { value: key, pos: p1 } = parsePhpValue(str, pos);
    pos = skipWs(p1);

    if (str.slice(pos, pos + 2) === '=>') {
      pos = skipWs(pos + 2);
      const { value, pos: p2 } = parsePhpValue(str, pos);
      pos = p2;
      isObj = true;
      obj[key] = value;
    } else {
      result.push(key);
    }
  }
  return { value: isObj ? obj : result, pos };
}

export function phpToJson(input) {
  const cleaned = input
    .replace(/<\?php/gi, '')           // strip opening PHP tag
    .replace(/\?>/g, '')               // strip closing PHP tag
    .replace(/^\s*return\s+/m, '')     // strip bare `return`
    .replace(/\/\*[\s\S]*?\*\//g, '')  // strip block comments
    .replace(/\/\/.*$/gm, '')          // strip line comments
    .trim()
    .replace(/;$/, '')                 // strip trailing semicolon
    .trim();
  // Accept input with or without a leading `$var =` assignment
  const assignMatch = cleaned.match(/\$[a-zA-Z_]\w*\s*=\s*/);
  const startPos = assignMatch ? assignMatch.index + assignMatch[0].length : 0;
  const ch = cleaned[startPos];
  let result;
  if (ch === '[') {
    ({ value: result } = parsePhpArray(cleaned, startPos + 1, ']'));
  } else if (cleaned.slice(startPos).match(/^array\s*\(/i)) {
    const m = cleaned.slice(startPos).match(/^array\s*\(/i);
    ({ value: result } = parsePhpArray(cleaned, startPos + m[0].length, ')'));
  } else {
    throw new Error('Input must be a PHP array literal (array(...) or [...]) or a variable assignment.');
  }
  return result;
}

// ─── Markdown ────────────────────────────────────────────────────────────────

export function jsonToMarkdown(data) {
  if (Array.isArray(data) && data.length === 0) return '_No data available._';
  if (Array.isArray(data) && typeof data[0] === 'object' && data[0] !== null) {
    const keys = [...new Set(data.flatMap(item => Object.keys(item)))];
    let md = '| ' + keys.join(' | ') + ' |\n';
    md += '| ' + keys.map(() => '---').join(' | ') + ' |\n';
    data.forEach(item => {
      const values = keys.map(k => {
        const v = item[k];
        if (v === null || v === undefined) return '';
        if (typeof v === 'object') return JSON.stringify(v).replace(/\|/g, '\\|');
        return String(v).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
      });
      md += '| ' + values.join(' | ') + ' |\n';
    });
    return md;
  }
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const entries = Object.entries(data);
    if (entries.every(([, v]) => typeof v !== 'object' || v === null || Array.isArray(v))) {
      let md = '| Key | Value |\n| --- | --- |\n';
      entries.forEach(([k, v]) => {
        const val = v === null ? 'null' : typeof v === 'object' ? JSON.stringify(v).replace(/\|/g, '\\|') : String(v).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
        md += `| ${k.replace(/\|/g, '\\|')} | ${val} |\n`;
      });
      return md;
    }
    let md = '';
    entries.forEach(([k, v]) => {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        md += `## ${k}\n\n${jsonToMarkdown(v)}\n\n`;
      } else {
        const val = v === null ? 'null' : typeof v === 'object' ? JSON.stringify(v) : String(v);
        md += `**${k}**: ${val}\n\n`;
      }
    });
    return md;
  }
  if (Array.isArray(data)) {
    let md = '| Value |\n| --- |\n';
    data.forEach(item => { md += `| ${(typeof item === 'object' ? JSON.stringify(item) : String(item)).replace(/\|/g, '\\|')} |\n`; });
    return md;
  }
  return String(data);
}

export function markdownToJson(markdown) {
  const lines = markdown.trim().split('\n');
  const result = [];
  let currentTable = null;
  let headers = [];
  let inTable = false;
  let currentObject = {};
  let lastHeading = null;

  const isSepLine = (line) => {
    const t = line.trim();
    if (!t.startsWith('|') || !t.endsWith('|')) return false;
    return t.split('|').map(c => c.trim()).filter(c => c).every(c => /^[-:\s]+$/.test(c));
  };

  const parseCell = (v) => {
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'null' || v === '') return null;
    if (!isNaN(v) && v !== '') { const n = Number(v); if (!isNaN(n)) return n; }
    try { return JSON.parse(v); } catch { return v.replace(/\\\|/g, '|').replace(/<br>/g, '\n'); }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(c => c);
      if (index + 1 < lines.length && isSepLine(lines[index + 1])) {
        headers = cells; inTable = true; currentTable = []; return;
      }
      if (inTable && isSepLine(trimmed)) return;
      if (inTable && headers.length > 0 && cells.length === headers.length) {
        const row = {};
        headers.forEach((h, i) => { row[h] = parseCell(cells[i] || ''); });
        const isSep = Object.values(row).every(v => /^[-:\s]+$/.test(String(v).trim()));
        if (!isSep) currentTable.push(row);
      }
    } else {
      if (inTable && currentTable) {
        if (Array.isArray(currentTable) && currentTable.length > 0) result.push(...currentTable);
        else if (!Array.isArray(currentTable) && Object.keys(currentTable).length > 0) result.push(currentTable);
        inTable = false; headers = []; currentTable = null;
      }
      if (trimmed.startsWith('#')) {
        const h = trimmed.replace(/^#+\s*/, '');
        lastHeading = h;
        if (!currentObject[h]) currentObject[h] = {};
      } else if (trimmed.includes(':') && !trimmed.startsWith('|')) {
        const ci = trimmed.indexOf(':');
        if (ci > 0) {
          const k = trimmed.substring(0, ci).trim();
          let v = trimmed.substring(ci + 1).trim();
          if (v) {
            if (v === 'true') v = true;
            else if (v === 'false') v = false;
            else if (v === 'null') v = null;
            else if (!isNaN(v) && v !== '') { const n = Number(v); if (!isNaN(n)) v = n; }
            if (lastHeading && currentObject[lastHeading]) currentObject[lastHeading][k] = v;
            else currentObject[k] = v;
          }
        }
      }
    }
  });

  if (inTable && currentTable) {
    if (Array.isArray(currentTable) && currentTable.length > 0) result.push(...currentTable);
    else if (!Array.isArray(currentTable) && Object.keys(currentTable).length > 0) result.push(currentTable);
  }

  if (result.length > 0) return result.length === 1 ? result[0] : result;
  if (Object.keys(currentObject).length > 0) return currentObject;
  return { content: markdown.trim() };
}

// ─── HTML ────────────────────────────────────────────────────────────────────

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function formatValue(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
    return jsonToHtml(value);
  }
  if (typeof value === 'object') return '<pre>' + escapeHtml(JSON.stringify(value, null, 2)) + '</pre>';
  return escapeHtml(String(value));
}

export function jsonToHtml(data) {
  let html = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;width:100%">\n';
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
    const keys = [...new Set(data.flatMap(item => Object.keys(item)))];
    html += '  <thead><tr>\n';
    keys.forEach(k => { html += `    <th style="background:#f2f2f2;font-weight:bold;padding:8px">${escapeHtml(String(k))}</th>\n`; });
    html += '  </tr></thead>\n  <tbody>\n';
    data.forEach(item => {
      html += '    <tr>\n';
      keys.forEach(k => { html += `      <td style="padding:8px">${formatValue(item[k])}</td>\n`; });
      html += '    </tr>\n';
    });
    html += '  </tbody>\n';
  } else if (typeof data === 'object' && data !== null) {
    html += '  <thead><tr><th>Key</th><th>Value</th></tr></thead>\n  <tbody>\n';
    Object.entries(data).forEach(([k, v]) => {
      html += `    <tr><td style="padding:8px;font-weight:bold">${escapeHtml(k)}</td><td style="padding:8px">${formatValue(v)}</td></tr>\n`;
    });
    html += '  </tbody>\n';
  }
  return html + '</table>';
}

function extractText(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
}

function extractCells(rowHtml) {
  const cells = [];
  const re = /<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/gi;
  let m;
  while ((m = re.exec(rowHtml)) !== null) cells.push({ raw: m[2], text: extractText(m[2]) });
  return cells;
}

function parseHtmlValue(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null' || v === '') return null;
  if (!isNaN(v) && v !== '') { const n = Number(v); if (!isNaN(n)) return n; }
  try { return JSON.parse(v); } catch { return v; }
}

function extractTables(html) {
  const tables = [];
  let i = 0;
  const lower = html.toLowerCase();
  while (i < html.length) {
    const start = lower.indexOf('<table', i);
    if (start === -1) break;
    let depth = 0, j = start;
    while (j < html.length) {
      if (lower.startsWith('<table', j) && (html[j + 6] === '>' || html[j + 6] === ' ')) { depth++; j += 6; }
      else if (lower.startsWith('</table>', j)) { depth--; if (depth === 0) { tables.push(html.substring(start, j + 8)); i = j + 8; break; } j += 8; }
      else j++;
    }
    if (depth !== 0) break;
  }
  return tables;
}

// Replace nested <table>...</table> blocks with placeholders so row regexes work correctly
function hoistNestedTables(html) {
  const nested = [];
  let out = '';
  let i = 0;
  const low = html.toLowerCase();
  while (i < html.length) {
    if (low.startsWith('<table', i) && /[\s>]/.test(html[i + 6] || '')) {
      let depth = 0, j = i;
      while (j < html.length) {
        if (low.startsWith('<table', j) && /[\s>]/.test(html[j + 6] || '')) { depth++; j += 6; }
        else if (low.startsWith('</table>', j)) { depth--; if (depth === 0) { nested.push(html.slice(i, j + 8)); out += `\x00NESTED${nested.length - 1}\x00`; i = j + 8; break; } else j += 8; }
        else j++;
      }
      if (depth !== 0) break;
    } else { out += html[i++]; }
  }
  return { out, nested };
}

export function htmlToJson(htmlContent) {
  if (!htmlContent?.trim()) throw new Error('Empty HTML input.');
  const rawTables = extractTables(htmlContent);
  if (rawTables.length === 0) throw new Error('No <table> element found in HTML.');
  const result = [];

  rawTables.forEach(tableHtml => {
    const fullInner = tableHtml.match(/<table[^>]*>([\s\S]*)<\/table>/i)?.[1] || '';
    // Hoist nested tables so row/cell regexes only see the outer table structure
    const { out: inner, nested } = hoistNestedTables(fullInner);

    let headerCells = [];
    const theadMatch = inner.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
    if (theadMatch) {
      const trMatch = theadMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
      if (trMatch) headerCells = extractCells(trMatch[1]).map(c => c.text);
    }
    const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const allRows = [];
    let rm;
    while ((rm = rowRe.exec(inner)) !== null) allRows.push(rm[1]);
    if (allRows.length === 0) return;
    if (!headerCells.length) headerCells = extractCells(allRows[0]).map(c => c.text);
    if (!headerCells.length) return;
    const dataRows = allRows.filter(r => !/<th[^>]*>/i.test(r) || /<td[^>]*>/i.test(r));
    if (!dataRows.length) return;

    dataRows.forEach(row => {
      const cells = extractCells(row);
      if (cells.length !== headerCells.length) return;
      const rowObj = {};
      headerCells.forEach((h, idx) => {
        const raw = cells[idx].raw;
        // Nested table placeholder
        const nestedMatch = raw.match(/\x00NESTED(\d+)\x00/);
        if (nestedMatch) {
          rowObj[h] = htmlToJson(nested[parseInt(nestedMatch[1])]);
          return;
        }
        const pre = raw.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
        if (pre) { try { rowObj[h] = JSON.parse(pre[1]); } catch { rowObj[h] = extractText(pre[1]); } }
        else rowObj[h] = parseHtmlValue(cells[idx].text);
      });
      result.push(rowObj);
    });
  });

  if (result.length === 0) throw new Error('No data rows extracted from HTML table.');
  return result.length === 1 ? result[0] : result;
}

// ─── TOML ───────────────────────────────────────────────────────────────────

export function tomlToJson(input) {
  return tomlParse(input);
}

export function jsonToToml(input) {
  if (typeof input !== 'object' || input === null) throw new Error('Input must be an object or array.');
  const tomlInput = Array.isArray(input) ? { items: input } : input;
  return tomlStringify(tomlInput);
}

// ─── SQL ────────────────────────────────────────────────────────────────────

function escapeValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function escapeIdentifier(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

export function jsonToSql(input, tableName = 'data') {
  const data = Array.isArray(input) ? input : [input];
  if (data.length === 0) return '-- No data to insert';
  return data.map(row => {
    const cols = Object.keys(row);
    return `INSERT INTO ${escapeIdentifier(tableName)} (${cols.map(escapeIdentifier).join(', ')}) VALUES (${cols.map(c => escapeValue(row[c])).join(', ')});`;
  }).join('\n');
}

function parseSqlValue(val) {
  if (val.toUpperCase() === 'NULL') return null;
  if (val.startsWith("'") || val.startsWith('"')) return val.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
  if (!isNaN(Number(val))) return Number(val);
  return val;
}

function parseSqlRowValues(str) {
  const values = [];
  let current = '', inString = false, stringChar = null;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (!inString && (ch === "'" || ch === '"')) { inString = true; stringChar = ch; current += ch; }
    else if (inString && ch === stringChar) { if (str[i + 1] === stringChar) { current += ch + ch; i++; } else { inString = false; stringChar = null; current += ch; } }
    else if (!inString && ch === ',') { values.push(parseSqlValue(current.trim())); current = ''; }
    else current += ch;
  }
  if (current.trim()) values.push(parseSqlValue(current.trim()));
  return values;
}

function extractSqlTuples(str) {
  const tuples = [];
  let i = 0;
  while (i < str.length) {
    if (str[i] === '(') {
      let depth = 1, inStr = false, strChar = null, content = '';
      i++;
      while (i < str.length && depth > 0) {
        const ch = str[i];
        if (!inStr && (ch === "'" || ch === '"')) { inStr = true; strChar = ch; }
        else if (inStr && ch === strChar && str[i + 1] === strChar) { content += ch + ch; i += 2; continue; }
        else if (inStr && ch === strChar) { inStr = false; }
        else if (!inStr && ch === '(') depth++;
        else if (!inStr && ch === ')') { depth--; if (depth === 0) { i++; break; } }
        content += ch; i++;
      }
      tuples.push(content);
    } else i++;
  }
  return tuples;
}

export function sqlToJson(input) {
  const results = {};
  const re = /INSERT\s+INTO\s+[`"']?(\w+)[`"']?\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+?)(?=;)/gi;
  let m;
  while ((m = re.exec(input)) !== null) {
    const table = m[1];
    const cols = m[2].split(',').map(c => c.trim().replace(/[`"']/g, ''));
    if (!results[table]) results[table] = [];
    extractSqlTuples(m[3]).forEach(tuple => {
      const vals = parseSqlRowValues(tuple);
      const obj = {};
      cols.forEach((c, i) => {
        let v = vals[i] !== undefined ? vals[i] : null;
        if (typeof v === 'string') { try { v = JSON.parse(v); } catch { } }
        obj[c] = v;
      });
      results[table].push(obj);
    });
  }
  return results;
}

// ─── TypeScript ──────────────────────────────────────────────────────────────

const TS_RESERVED = new Set([
  'break','case','catch','class','const','continue','debugger','default',
  'delete','do','else','enum','export','extends','false','finally','for',
  'function','if','import','in','instanceof','new','null','return','super',
  'switch','this','throw','true','try','typeof','var','void','while','with',
  'yield','let','static','implements','interface','package','private',
  'protected','public','abstract','as','async','await','declare','from',
  'module','namespace','of','readonly','require','type','undefined',
]);

function quoteReservedProps(ts) {
  return ts.replace(/^(\s+)(\w+)(\??:)/gm, (_, indent, name, rest) =>
    TS_RESERVED.has(name) ? `${indent}'${name}'${rest}` : `${indent}${name}${rest}`
  );
}

export function jsonToTypescript(input, rootName = 'RootObject') {
  if (typeof input !== 'object' || input === null) throw new Error('JSON must be an object or array.');
  return quoteReservedProps(JsonToTS(input, { rootName }).join('\n\n'));
}

function mapTsType(t) {
  const map = { string: 'string', number: 'number', boolean: 'boolean', any: 'any', null: 'null', undefined: 'undefined' };
  const lower = t.toLowerCase().trim();
  if (map[lower]) return map[lower];
  if (t.endsWith('[]')) return `array<${mapTsType(t.slice(0, -2))}>`;
  return t;
}

export function typescriptToJson(input) {
  const interfaces = {};
  const re = /interface\s+(\w+)\s*\{/g;
  let m;
  while ((m = re.exec(input)) !== null) {
    const name = m[1];
    let depth = 1, i = re.lastIndex, body = '';
    while (i < input.length && depth > 0) {
      const ch = input[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (depth > 0) body += ch;
      i++;
    }
    const props = {};
    const pr = /(\w+)(\?)?:\s*([^;]+);/g;
    let pm;
    while ((pm = pr.exec(body)) !== null) {
      props[pm[1]] = { type: mapTsType(pm[3].trim()), optional: !!pm[2] };
    }
    interfaces[name] = props;
  }
  if (Object.keys(interfaces).length === 0) throw new Error('No valid TypeScript interfaces found.');
  return interfaces;
}

// ─── Excel ──────────────────────────────────────────────────────────────────

export async function jsonToExcel(input, sheetName = 'Sheet1') {
  let data = Array.isArray(input) ? input : [input];
  const safe = sheetName.replace(/[\\\/\?\*\[\]:]/g, '').substring(0, 31) || 'Sheet1';
  const flat = data.map(row => {
    const r = {};
    for (const [k, v] of Object.entries(row)) r[k] = typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
    return r;
  });
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(safe);
  const headers = Object.keys(flat[0] || {});
  ws.columns = headers.map(k => ({ header: k, key: k }));
  flat.forEach(row => ws.addRow(row));
  const raw = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
}

export async function excelToJson(base64Input, sheetName) {
  if (!base64Input || typeof base64Input !== 'string' || base64Input.length < 8) {
    throw Object.assign(new Error('Input must be a non-empty base64-encoded .xlsx file.'), { statusCode: 400 });
  }
  const buffer = Buffer.from(base64Input.replace(/\s+/g, ''), 'base64');
  if (buffer.length < 4) {
    throw Object.assign(new Error('Input is not a valid Excel file.'), { statusCode: 400 });
  }
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw Object.assign(new Error('Could not parse Excel file. Ensure input is a valid base64-encoded .xlsx file.'), { statusCode: 400 });
  }
  const ws = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found.`);
  const rows = [];
  let headers = [];
  ws.eachRow((row, rowNumber) => {
    const values = row.values;
    if (rowNumber === 1) { headers = values.slice(1).map(v => (v != null ? String(v) : '')); return; }
    const obj = {};
    headers.forEach((h, i) => {
      let v = values[i + 1] !== undefined ? values[i + 1] : null;
      if (typeof v === 'string') { try { v = JSON.parse(v); } catch { } }
      obj[h] = v;
    });
    rows.push(obj);
  });
  if (rows.length === 0) throw new Error('No data found in Excel sheet.');
  return rows;
}

// ─── Diff / Merge / Query / Schema ──────────────────────────────────────────

export function jsonDiff(left, right) {
  const differences = microdiff(left, right);
  return {
    summary: {
      added: differences.filter(d => d.type === 'CREATE').length,
      removed: differences.filter(d => d.type === 'REMOVE').length,
      modified: differences.filter(d => d.type === 'CHANGE').length,
      total: differences.length,
      identical: differences.length === 0,
    },
    differences,
  };
}

function isObject(v) { return v && typeof v === 'object' && !Array.isArray(v); }

function deepMerge(strategy, target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(strategy, target[key], source[key]);
      } else if (Array.isArray(source[key])) {
        if (strategy === 'concat') target[key] = Array.isArray(target[key]) ? [...target[key], ...source[key]] : source[key];
        else if (strategy === 'unique') { const ex = Array.isArray(target[key]) ? target[key] : []; target[key] = [...new Set([...ex, ...source[key]])]; }
        else target[key] = source[key];
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return deepMerge(strategy, target, ...sources);
}

export function jsonMerge(sources, strategy = 'deep') {
  if (!Array.isArray(sources) || sources.length < 2) throw new Error('At least 2 sources required.');
  if (sources.length > 10) throw new Error('Maximum 10 sources allowed.');
  if (strategy === 'shallow') return Object.assign({}, ...sources);
  return deepMerge(strategy, {}, ...sources);
}

export function jsonQuery(input, expr) {
  if (!expr || !expr.trim()) throw new Error('Query expression is required.');
  const result = jmespath.search(input, expr);
  return result === undefined ? null : result;
}

export function jsonSchema(input) {
  return toJsonSchema(input);
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export function jsonValidate(input) {
  if (typeof input === 'string') {
    try { JSON.parse(input); return { valid: true }; }
    catch (e) { return { valid: false, errors: [{ message: e.message }] }; }
  }
  return { valid: true };
}

export function jsonBeautify(input, indent = 4) {
  const data = typeof input === 'string' ? JSON.parse(input) : input;
  return JSON.stringify(data, null, indent);
}

export function jsonCompress(input) {
  const data = typeof input === 'string' ? JSON.parse(input) : input;
  return JSON.stringify(data);
}
