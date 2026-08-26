# React Press Launcher — دليل المطور

يوضح هذا الدليل طريقة تطوير واختبار وتجميع وبناء React Press Launcher وتحويله إلى ملف تنفيذي مستقل
بصيغة `.exe` باستخدام Node.js SEA.

## نظرة عامة

React Press Launcher مسؤول عن تجهيز بيئة React Press المحلية، وفحص Vite، وتشغيله عند الحاجة، وانتظار
جاهزية التطبيق، ثم فتحه في المتصفح الافتراضي.

دورة التشغيل:

```text
React Press Launcher
        ↓
تجهيز البيئة
        ↓
فحص Vite
        ↓
تشغيل Vite إذا لزم الأمر
        ↓
انتظار localhost:3000
        ↓
فتح المتصفح
```

الهدف من الـ Launcher هو إدارة عملية تشغيل React Press تلقائيًا دون حاجة المستخدم إلى تنفيذ أوامر
التطوير المعتادة يدويًا.

## المتطلبات

يجب أن يتوفر على جهاز التطوير:

- Windows
- Node.js 20.19+ أو 22.12+
- npm
- Git

للتأكد من إصدار Node.js:

```bash
node --version
```

للتأكد من npm:

```bash
npm --version
```

لا تحتاج إلى تثبيت `esbuild` بشكل Global.

يتم استخدام:

```bash
npx esbuild
```

لتجميع الـ Launcher.

## هيكل المشروع

هيكل ملفات الـ Launcher الحالي:

```text
react-press/
│
├── launcher/
│   ├── browser.mjs
│   ├── constants.mjs
│   ├── launcher.js
│   ├── logger.mjs
│   ├── main.js
│   ├── setup.mjs
│   ├── state.mjs
│   ├── utils.mjs
│   └── viteManager.mjs
│
├── scripts/
│   └── setup-environment.js
│
├── react/
│   └── 19.2.8/
│       └── node_modules/
│
├── projects/
│   └── react-press/
│       ├── package.json
│       ├── index.html
│       ├── vite.config.ts
│       ├── src/
│       ├── public/
│       └── ...
│
├── dist/
│
├── sea-config.json
└── package.json
```

## ملفات Launcher

تم تقسيم الـ Launcher إلى مجموعة من الملفات، وكل ملف مسؤول عن جزء محدد.

### `main.js`

نقطة الدخول الأساسية لمصدر الـ Launcher.

يعمل على تنسيق مراحل التشغيل وربط Modules المختلفة معًا.

### `launcher.js`

الملف الناتج من عملية `esbuild`.

يحتوي على الـ Launcher بعد تجميع `main.js` وجميع الـ Modules المستوردة منه.

يجب اعتبار هذا الملف ملفًا Generated File يتم إعادة إنشائه أثناء عملية الـ Build.

### `browser.mjs`

مسؤول عن فتح تطبيق React Press في المتصفح الافتراضي.

### `constants.mjs`

يحتوي على الثوابت والإعدادات المشتركة المستخدمة داخل الـ Launcher.

### `logger.mjs`

مسؤول عن تسجيل الـ logs وأحداث التشغيل.

### `setup.mjs`

مسؤول عن تجهيز الـ Environment قبل تشغيل Vite.

### `state.mjs`

مسؤول عن حالة الـ Launcher أثناء التشغيل.

### `utils.mjs`

يحتوي على الدوال المساعدة المشتركة بين Modules المختلفة.

### `viteManager.mjs`

مسؤول عن فحص Vite وتشغيله ومتابعة حالته وانتظار جاهزيته.

## بيئات React المشتركة

يمكن لـ React Press تخزين أكثر من Environment حسب إصدار React.

مثال:

```text
react/
├── 19.2.8/
│   └── node_modules/
│
└── 19.2.9/
    └── node_modules/
```

كل Environment تمثل مجموعة الـ dependencies الخاصة بإصدار React محدد.

يتم استخدام Environment نفسها من خلال المشاريع التي تعتمد على نفس إصدار React، بهدف منع تنزيل نفس
شجرة الـ dependencies لكل مشروع بشكل منفصل.

## المشاريع

كل مشروع يحتفظ بإعداداته وملفاته الخاصة.

مثال:

```text
projects/
└── react-press/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    ├── src/
    └── public/
```

تظل إعدادات المشروع منفصلة عن الـ React Environment المشتركة.

## Junctions

يمكن لـ React Press استخدام Windows Junction لإتاحة الـ Environment المشتركة للمشروع.

مثال:

```text
projects/react-press/node_modules
        ↓
react/19.2.8/node_modules
```

الـ Junction لا يقوم بإنشاء نسخة فعلية ثانية من ملفات الـ dependencies.

بل يسمح لـ Node.js وVite وTypeScript والأدوات الأخرى بالوصول إلى الـ packages من مسار `node_modules`
المتوقع داخل المشروع.

## تجهيز الـ Environment

يتم التعامل مع تجهيز البيئة من خلال طبقة الـ setup.

سكريبت تجهيز البيئة الحالي:

```text
scripts/setup-environment.js
```

دورة تجهيز البيئة:

```text
Launcher
    ↓
Environment Setup
    ↓
فحص الـ Shared Environment
    ↓
إنشاء Junction عند الحاجة
```

إذا كان الـ Junction موجودًا بالفعل، فلا تتم إعادة إنشائه دون حاجة.

## تشغيل Launcher أثناء التطوير

يتم تشغيل مصدر الـ Launcher من جذر المشروع:

```bash
node launcher/main.js
```

دورة التشغيل المتوقعة:

```text
تشغيل Environment Setup
        ↓
فحص localhost:3000
        ↓
إذا كان Vite يعمل بالفعل
        ↓
فتح المتصفح

وإلا
        ↓
npm run dev
        ↓
انتظار localhost:3000
        ↓
فتح المتصفح
```

العنوان الافتراضي:

```text
http://localhost:3000/
```

## تجميع Launcher باستخدام esbuild

نقطة الدخول للمصدر هي:

```text
launcher/main.js
```

والملف الناتج هو:

```text
launcher/launcher.js
```

انتقل إلى مجلد مشروع React:

```bash
cd react-press\projects\react-press
```

ثم نفذ:

```bash
npx esbuild ..\..\launcher\main.js --bundle --platform=node --format=esm --outfile=..\..\launcher\launcher.js
```

دورة التجميع:

```text
launcher/main.js
        ↓
      esbuild
        ↓
launcher/launcher.js
```

يقوم `esbuild` تلقائيًا بتجميع جميع الـ Modules التي يتم استيرادها من `main.js`.

ومنها:

```text
browser.mjs
constants.mjs
logger.mjs
setup.mjs
state.mjs
utils.mjs
viteManager.mjs
```

لا تستخدم `launcher/launcher.js` كملف Source.

المدخل الصحيح دائمًا:

```text
launcher/main.js
```

والناتج:

```text
launcher/launcher.js
```

## إعداد SEA

يجب أن يشير ملف `sea-config.json` إلى الـ bundle الناتج:

```json
{
    "main": "launcher/launcher.js",
    "mainFormat": "module",
    "output": "dist/react-press.exe",
    "disableExperimentalSEAWarning": true
}
```

دورة البناء:

```text
launcher/main.js
        ↓
esbuild
        ↓
launcher/launcher.js
        ↓
Node.js SEA
        ↓
dist/react-press.exe
```

## بناء ملف EXE

بعد إنشاء:

```text
launcher/launcher.js
```

ارجع إلى جذر المشروع:

```bash
cd ..\..
```

ثم:

```bash
node --build-sea sea-config.json
```

والناتج:

```text
dist/react-press.exe
```

## أتمتة عملية البناء

يمكن إضافة scripts إلى `package.json`:

```json
{
    "scripts": {
        "bundle": "esbuild launcher/main.js --bundle --platform=node --format=esm --outfile=launcher/launcher.js",
        "build": "npm run bundle && node --build-sea sea-config.json"
    }
}
```

بعدها يمكن تنفيذ عملية البناء بالكامل:

```bash
npm run build
```

## اختبار ملف EXE

بعد نجاح عملية البناء:

```text
dist/
└── react-press.exe
```

يمكن تشغيله:

```powershell
.\dist\react-press.exe
```

دورة التشغيل المتوقعة:

```text
react-press.exe
        ↓
تجهيز البيئة
        ↓
فحص Vite
        ↓
تشغيل Vite إذا لزم
        ↓
localhost:3000
        ↓
المتصفح الافتراضي
```

## حل المشاكل

### Resource Busy أو Locked

إذا ظهر خطأ يفيد بأن Resource قيد الاستخدام أو مقفولة، أغلق أي عملية تعمل من:

```text
react-press.exe
```

ثم أعد عملية البناء.

وقد تحتاج إلى إيقاف Vite إذا كان يعمل.

### esbuild لا يستطيع العثور على `main.js`

تأكد من أن الأمر يتم تنفيذه من:

```text
react-press\projects\react-press
```

تحقق من وجود الملف:

```powershell
Test-Path ..\..\launcher\main.js
```

المفترض أن تكون النتيجة:

```text
True
```

ثم نفذ:

```bash
npx esbuild ..\..\launcher\main.js --bundle --platform=node --format=esm --outfile=..\..\launcher\launcher.js
```

### Vite غير معروف

إذا ظهرت:

```text
vite is not recognized
```

فتأكد من أن Environment الخاصة بإصدار React تحتوي على Vite وأن المشروع يستطيع الوصول إلى الـ shared
`node_modules`.

### تحذير إصدار Node.js

تحقق من إصدار Node.js:

```bash
node --version
```

يجب أن يكون إصدار Node.js المستخدم مع الـ Launcher وVite متوافقًا مع إصدار Vite الموجود في المشروع.

## المسؤوليات

| الملف             | المسؤولية                              |
| ----------------- | -------------------------------------- |
| `main.js`         | نقطة دخول مصدر Launcher وتنسيق التشغيل |
| `launcher.js`     | Bundle الناتج من esbuild               |
| `browser.mjs`     | فتح المتصفح                            |
| `constants.mjs`   | الثوابت المشتركة                       |
| `logger.mjs`      | تسجيل الأحداث                          |
| `setup.mjs`       | تجهيز البيئة                           |
| `state.mjs`       | حالة التشغيل                           |
| `utils.mjs`       | الدوال المساعدة                        |
| `viteManager.mjs` | فحص وتشغيل ومراقبة Vite                |

## دورة التطوير

الدورة المقترحة:

```text
تعديل Source Code
        ↓
تشغيل Launcher محليًا
        ↓
اختبار React Press
        ↓
Bundle باستخدام esbuild
        ↓
Build باستخدام SEA
        ↓
اختبار react-press.exe
```

تشغيل المصدر:

```bash
node launcher/main.js
```

تجميع الـ Launcher:

```bash
npx esbuild ..\..\launcher\main.js --bundle --platform=node --format=esm --outfile=..\..\launcher\launcher.js
```

بناء الـ EXE:

```bash
node --build-sea sea-config.json
```

اختبار الـ EXE:

```powershell
.\dist\react-press.exe
```

## المعمارية المستقبلية

الـ Launcher يمثل الأساس لنظام إدارة React Press المحلي.

المراحل المستقبلية يمكن أن تشمل:

```text
Node Version Manager
        ↓
React Version Manager
        ↓
Environment Manager
        ↓
Theme Manager
        ↓
Plugin Manager
        ↓
Project Manager
```

الهدف النهائي هو أن يقوم React Press بإدارة:

```text
Node.js
npm
React
Vite
Tailwind
Environments
Projects
Themes
Plugins
```

بشكل تلقائي في الخلفية، مع إبقاء تجربة المستخدم بسيطة.

## المراجع

- Node.js SEA: https://nodejs.org/api/single-executable-applications.html
- Node.js Modules: https://nodejs.org/api/modules.html
- Vite: https://vite.dev/guide/
- esbuild: https://esbuild.github.io/
- npm: https://docs.npmjs.com/
