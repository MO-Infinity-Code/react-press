# React Press Launcher — دليل المطور

يوضح هذا الدليل طريقة تطوير واختبار وتجميع وبناء React Press Launcher وتحويله إلى ملف تنفيذي مستقل
بصيغة `.exe` باستخدام Node.js SEA.

> **مهم جدًا قبل البدء**
>
> قبل أي خطوة تانية، جهّز الـ Shared React Environment:
>
> ```bash
> cd react-press\react\19.2.8
> npm install
> ```

> **تحذير: تثبيت المكتبات**
>
> أي مكتبة جديدة تتثبت من جوه الـ Shared Environment بس:
>
> ```bash
> cd react-press\react\19.2.8
> npm install <package-name>
> ```
>
> ممنوع تثبيت أي حاجة من جوه `projects\react-press` أو أي مشروع تاني بيعتمد على البيئة المشتركة — ده
> بيكسر بنية الـ Environment.

## نظرة عامة

الـ Launcher بيجهز بيئة React Press، يفحص Vite، يشغّله لو محتاج، وبعدين يفتح المتصفح.

```text
Launcher → تجهيز البيئة → فحص Vite → تشغيل Vite (لو لازم) → انتظار localhost:3000 → فتح المتصفح
```

## المتطلبات

- Windows
- Node.js 20.19+ أو 22.12+
- npm
- Git

```bash
node --version
npm --version
```

## هيكل المشروع

```text
react-press/
├── launcher/
│   ├── browser.mjs
│   ├── constants.mjs
│   ├── launcher.js       ← ملف ناتج (Generated)
│   ├── logger.mjs
│   ├── main.js            ← نقطة الدخول
│   ├── setup.mjs
│   ├── state.mjs
│   ├── utils.mjs
│   └── viteManager.mjs
├── scripts/
│   └── setup-environment.js
├── react/
│   └── 19.2.8/node_modules/     ← Shared Environment
├── projects/
│   └── react-press/
│       ├── package.json
│       ├── vite.config.ts
│       ├── src/
│       └── public/
├── dist/
├── sea-config.json
└── package.json
```

## مسؤوليات ملفات Launcher

| الملف             | المسؤولية                                  |
| ----------------- | ------------------------------------------ |
| `main.js`         | نقطة الدخول وتنسيق التشغيل                 |
| `launcher.js`     | Bundle ناتج من esbuild — لا يُعدَّل يدويًا |
| `browser.mjs`     | فتح المتصفح                                |
| `constants.mjs`   | الثوابت المشتركة                           |
| `logger.mjs`      | تسجيل الأحداث                              |
| `setup.mjs`       | تجهيز البيئة                               |
| `state.mjs`       | حالة التشغيل                               |
| `utils.mjs`       | دوال مساعدة                                |
| `viteManager.mjs` | فحص وتشغيل ومراقبة Vite                    |

## بيئات React المشتركة (Junctions)

كل نسخة React ليها مجلد `node_modules` خاص بيها، بيتشارك بين كل المشاريع اللي بتستخدم نفس النسخة:

```text
react/
├── 19.2.8/node_modules/
└── 19.2.9/node_modules/
```

على ويندوز، بيتم الوصول للـ Environment المشتركة من جوه أي مشروع عن طريق Junction:

```text
projects/react-press/node_modules  →  react/19.2.8/node_modules
```

الـ Junction رابط بس، مفيش نسخ فعلي للملفات. لو موجود بالفعل، `scripts/setup-environment.js` مش
بيعيد إنشاءه.

## تشغيل Launcher أثناء التطوير

```bash
node launcher/main.js
```

العنوان الافتراضي: `http://localhost:3000/`

## تجميع Launcher (esbuild)

من جوه `projects/react-press`:

```bash
npx esbuild ..\..\launcher\main.js --bundle --platform=node --format=esm --outfile=..\..\launcher\launcher.js
```

⚠️ المصدر دايمًا `main.js` — متعدلش `launcher.js` يدويًا، هو ملف ناتج بيتكتب فوق نفسه كل مرة.

## بناء EXE (Node.js SEA)

`sea-config.json`:

```json
{
    "main": "launcher/launcher.js",
    "mainFormat": "module",
    "output": "dist/react-press.exe",
    "disableExperimentalSEAWarning": true
}
```

من جذر المشروع:

```bash
node --build-sea sea-config.json
```

الناتج: `dist/react-press.exe`

## أتمتة البناء

```json
"scripts": {
    "bundle": "esbuild launcher/main.js --bundle --platform=node --format=esm --outfile=launcher/launcher.js",
    "build": "npm run bundle && node --build-sea sea-config.json"
}
```

```bash
npm run build
```

## اختبار EXE

```powershell
.\dist\react-press.exe
```

## حل المشاكل

| المشكلة                   | الحل                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| Resource Busy / Locked    | اقفل أي `react-press.exe` أو Vite شغال، وأعد البناء                                             |
| esbuild مش لاقي `main.js` | تأكد إنك في `projects\react-press`، وشغّل `Test-Path ..\..\launcher\main.js` (لازم يرجع `True`) |
| `vite is not recognized`  | تأكد إن Environment النسخة عندها Vite، وإن المشروع مربوط بالـ Junction صح                       |
| تحذير نسخة Node.js        | تأكد إن `node --version` متوافق مع نسخة Vite المستخدمة                                          |

## دورة التطوير الكاملة

```text
تعديل الكود → node launcher/main.js (اختبار) → esbuild (Bundle) → node --build-sea (Build) → .\dist\react-press.exe (اختبار نهائي)
```

## المعمارية المستقبلية

الـ Launcher هو الأساس لنظام إدارة React Press المحلي، والمخطط له لاحقًا:

```text
Node Version Manager → React Version Manager → Environment Manager → Theme Manager → Plugin Manager → Project Manager
```

## المراجع

- Node.js SEA: https://nodejs.org/api/single-executable-applications.html
- Node.js Modules: https://nodejs.org/api/modules.html
- Vite: https://vite.dev/guide/
- esbuild: https://esbuild.github.io/
- npm: https://docs.npmjs.com/
