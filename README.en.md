# English Grammar Lab · 上海初高语法填空

[简体中文](README.md) · English

A browser-based English grammar cloze practice tool for Chinese secondary-school learners, organized around Shanghai exam conventions. The interface, lessons and explanations are in Chinese; this is not a fully translated English interface or an official examination service.

## Start without an account

Download [English-Grammar-Lab.html](https://github.com/XiaoRui114514/english-grammar-lab/raw/refs/heads/main/English-Grammar-Lab.html), then open it in a modern browser. Built-in exercises work offline with no installation or API key.

- Twelve tense units and a mixed-tense challenge provide built-in sentence practice. Other grammar categories can use optional model-generated exercises.
- Passage practice, explanations, unfinished exercise recovery, mistakes, notes and spaced review are included.
- Learning records stay in browser storage by default. Export a full backup before clearing storage or moving to another browser; local files and hosted sites have different storage areas.

## Optional online features

Model-generated exercises and explanations require your own compatible provider and API key. The browser sends relevant prompts and exercise content directly to that provider; network access, CORS support and provider charges may apply. Generated questions can be incorrect. Keys remain in the page unless you explicitly choose to remember them locally.

Hosted deployments can separately configure account synchronization. Logging in enables synchronization of the documented learning-data whitelist; it does not upload API keys, model settings or unfinished drafts. Downloaded `file://` copies stay local. See [account and conflict details](README.md#共用账号与云同步) before enabling a backend. A static deployment alone does not enable accounts.

## Develop and verify

Node.js 18+ is sufficient for the dependency-free build and core checks:

```sh
npm run build
npm test
npm run test:build
```

Browser regressions additionally need the development dependencies and Chromium:

```sh
npm ci
npx playwright install chromium
npm run test:interaction
npm run test:cloud:browser
```

Edit `src/` or `data/`, then rebuild the single-file output. See [contribution instructions](CONTRIBUTING.md) and [data schema](spec/DATA_SCHEMA.md). Report incorrect questions with the unit/passage, original answer, expected answer and reasoning; never attach API keys or unredacted learning backups.

## License

Free personal self-study under the repository's [custom license](LICENSE), with attribution requirements and commercial-use restrictions. Source availability does not grant unrestricted commercial reuse.
