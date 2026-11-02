import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Marked, Renderer } from 'marked';
import { Liquid } from 'liquidjs';
import * as sass from 'sass';

const root = fileURLToPath(new URL('../', import.meta.url));
const engine = new Liquid();
const baseurl = '/hci-labs';
const template = await readFile(path.join(root, 'src/default.html'), 'utf8');
const pageTemplate = (await readFile(path.join(root, 'vendor/reverie/page.html'), 'utf8')).replace(/^---[\s\S]*?---\s*/, '').replace('class="page"', 'class="page {{ page.cssClass }}"');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const renderer = new Renderer();
renderer.code = ({ text, lang }) => lang === 'mermaid'
  ? `<div class="diagram-scroll" tabindex="0" role="region" aria-label="Схема пользовательского флоу"><div class="mermaid">${escape(text)}</div></div>`
  : `<pre><code>${escape(text)}</code></pre>`;
const markdown = new Marked({ renderer });

async function renderPage(title, content, diagram = false, cssClass = '') {
  const page = { title, diagram, cssClass };
  const article = await engine.parseAndRender(pageTemplate, { page, content });
  return engine.parseAndRender(template, {
    page,
    site: { name: 'Разработка человекоориентированных интерфейсов', baseurl },
    content: article
  });
}

const source = await readFile(path.join(root, 'reports/lab-1.md'), 'utf8');
const tokens = markdown.lexer(source);
const sections = [];
for (const token of tokens) {
  if (token.type === 'heading' && token.depth === 1) continue;
  if (token.type === 'heading' && token.depth === 2) sections.push({ title: token.text, tokens: [] });
  if (sections.length) sections.at(-1).tokens.push(token);
}
const toc = sections.map((section, index) => `<li><a href="#section-${index + 1}">${section.title.replace(/^\d+\.\s*/, '')}</a></li>`).join('');
const body = sections.map((section, index) => `<section id="section-${index + 1}">${markdown.parser(section.tokens)}</section>`).join('\n');
const report = `<p><a href="${baseurl}/">← На главную</a></p><details><summary>Содержание</summary><ol>${toc}</ol></details>${body}<p><a href="${baseurl}/">← На главную</a></p>`;
const works = [
  { label: 'Лабораторная работа № 1', title: 'JTBD и пользовательские сценарии', href: `${baseurl}/lab-1/` },
  { label: 'Лабораторная работа № 2', title: 'Юзабилити-тестирование' },
  { label: 'Лабораторная работа № 3', title: 'Аналитика и KPI' },
  { label: 'Эссе', title: 'Что такое хороший интерфейс' }
];
const titlePage = '<p><strong>Поток:</strong> РЧОИ 1.3<br><strong>ФИО:</strong> Архангельская Елизавета Павловна<br><strong>Группа:</strong> К3439</p>';
const home = `${titlePage}<ul>${works.map(work => `<li>${work.href ? `<a href="${work.href}">${work.label}. ${work.title}</a>` : `${work.label}. ${work.title}`}</li>`).join('\n')}</ul>`;
const scss = (await readFile(path.join(root, 'vendor/reverie/style.scss'), 'utf8')).replace(/^---[\s\S]*?---\s*/, '');
const compiled = sass.compileString(scss, {
  loadPaths: [path.join(root, 'vendor/reverie/_sass')],
  style: 'compressed',
  logger: sass.Logger.silent
});
for (const dir of ['assets', 'lab-1']) await mkdir(path.join(root, dir), { recursive: true });
await writeFile(path.join(root, 'assets/style.css'), compiled.css);
await copyFile(path.join(root, 'src/report.css'), path.join(root, 'assets/report.css'));
await copyFile(path.join(root, 'src/site.js'), path.join(root, 'assets/site.js'));
await copyFile(path.join(root, 'node_modules/@mermaid-js/tiny/dist/mermaid.tiny.js'), path.join(root, 'assets/mermaid.tiny.js'));
await copyFile(path.join(root, 'node_modules/@mermaid-js/tiny/LICENSE'), path.join(root, 'assets/mermaid.LICENSE'));
await writeFile(path.join(root, 'index.html'), await renderPage('Разработка человеко-ориентированных интерфейсов', home, false, 'report-page'));
await writeFile(path.join(root, 'lab-1/index.html'), await renderPage('Лабораторная работа № 1. JTBD и пользовательские сценарии', report, true, 'report-page'));
console.log('Built with Reverie: index.html, lab-1/index.html');
