# React Press Launcher — دليل المطور

يوضح هذا الدليل طريقة تطوير واختبار وتجميع وبناء React Press Launcher وتحويله إلى ملف تنفيذي مستقل
بصيغة `.exe` باستخدام Node.js SEA.

## نظرة عامة

React Press Launcher مسؤول عن تجهيز بيئة React Press المحلية، والتأكد من تشغيل Vite، وتشغيله عند
الحاجة، ثم فتح React Press في المتصفح الافتراضي.

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

الهدف هو أن تتم العمليات المتعلقة بـ Node.js وnpm وVite والـ environments في الخلفية، بينما يتعامل
المستخدم مع React Press فقط.

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

أثناء عملية بناء الـ Launcher.

## هيكل المشروع

هيكل الـ Launcher الحالي:

```text
react-press/
│
├── launcher/
│   ├── main.js
│   ├── browser-manager.js
│   ├── config.js
│   ├── logger.js
│   ├── path-manager.js
│   ├── process-utils.js
│   ├── setup-manager.js
│   ├── vite-manager.js
│   └── launcher.js
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
│       ├── src/
│       ├── public/
│       └── ...
│
├── dist/
│
├── sea-config.json
└── package.json
```

## ملفات الـ Launcher

ملف الدخول الأساسي للمصدر هو:

```text
launcher/main.js
```

أما الملف الناتج من عملية التجميع فهو:

```text
launcher/launcher.js
```

يقوم `esbuild` بتجميع `main.js` وجميع الـ modules التي يستوردها في ملف واحد.

## بيئات React المشتركة

يمكن أن يحتوي React Press على أكثر من Environment حسب إصدار React.

مثال:

```text
react/
├── 19.2.8/
│   └── node_modules/
│
└── 19.2.9/
    └── node_modules/
```

كل Environment تمثل مجموعة الـ dependencies المرتبطة بإصدار React محدد.

الهدف هو منع تنزيل وتخزين نفس مجموعة الـ dependencies لكل مشروع بشكل مستقل.

## المشاريع

كل مشروع يحتفظ بإعداداته الخاصة.

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

يظل إعداد المشروع منفصلًا عن الـ React Environment المشتركة.

## Junctions

يستخدم React Press نظام Windows Junction لإتاحة الـ Environment المشتركة للمشروع.

مثال:

```text
projects/react-press/node_modules
        ↓
react/19.2.8/node_modules
```

الـ Junction لا ينشئ نسخة ثانية من ملفات الـ dependencies.

بل يسمح لـ Node.js وVite وTypeScript والأدوات الأخرى بالوصول إلى الـ packages من مسار `node_modules`
المتوقع داخل المشروع.

## تجهيز الـ Environment

سكريبت تجهيز البيئة الحالي:

```text
scripts/setup-environment.js
```

ويتم تشغيله قبل فحص Vite.

دورة تجهيز البيئة:

```text
Launcher
    ↓
setup-environment.js
    ↓
فحص الـ Environment المشتركة
    ↓
إنشاء Junction عند الحاجة
```

إذا كان الـ Junction موجودًا بالفعل، يتم تركه كما هو.

## تشغيل Launcher أثناء التطوير

من مجلد المشروع:

```bash
node launcher/main.js
```

سيقوم الـ Launcher بالآتي:

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

مصدر الـ Launcher الأساسي هو:

```text
launcher/main.js
```

والناتج المطلوب:

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

يحتوي `launcher/launcher.js` على `main.js` وجميع الـ modules المستوردة منه بعد تجميعها في ملف واحد.

لا تستخدم ملف المصدر كملف إخراج.

الصحيح:

```text
Input:
launcher/main.js

Output:
launcher/launcher.js
```

والخطأ:

```text
Input:
launcher/main.js

Output:
launcher/main.js
```

## بناء ملف EXE باستخدام SEA

بعد إنشاء:

```text
launcher/launcher.js
```

ارجع إلى جذر React Press:

```bash
cd ..\..
```

ثم:

```bash
node --build-sea sea-config.json
```

وسيتم إنشاء ملف `.exe` وفقًا لإعدادات SEA.

## إعداد SEA

يجب أن يكون `sea-config.json` بهذا الشكل:

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

## أتمتة عملية البناء

يمكن إضافة scripts إلى `package.json` في جذر المشروع:

```json
{
    "scripts": {
        "bundle": "esbuild launcher/main.js --bundle --platform=node --format=esm --outfile=launcher/launcher.js",
        "build": "npm run bundle && node --build-sea sea-config.json"
    }
}
```

بعد ذلك يمكن تنفيذ العملية بالكامل من خلال:

```bash
npm run build
```

## اختبار ملف EXE

بعد نجاح البناء:

```text
dist/
└── react-press.exe
```

يمكن تشغيله:

```powershell
.\dist\react-press.exe
```

ودورة التشغيل المتوقعة:

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

إذا ظهر خطأ يفيد بأن Resource قيد الاستخدام أو مقفولة، أغلق أي نسخة تعمل من:

```text
react-press.exe
```

ثم أعد عملية البناء.

وقد تحتاج أيضًا إلى إيقاف أي عملية Vite تعمل حاليًا.

### esbuild لا يستطيع العثور على main.js

تأكد من أنك تعمل من:

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

إذا ظهرت الرسالة:

```text
vite is not recognized
```

فتأكد من أن Environment الخاصة بإصدار React تحتوي على Vite، وأن المشروع يستطيع الوصول إلى الـ shared
`node_modules`.

### تحذير إصدار Node.js

تحقق من إصدار Node.js:

```bash
node --version
```

يجب أن يكون إصدار Node.js المستخدم لتشغيل Launcher وVite متوافقًا مع إصدار Vite الموجود في المشروع.

## تقسيم ملفات Launcher

تم تقسيم Launcher إلى Modules منفصلة لتسهيل التطوير والصيانة:

```text
launcher/
├── main.js
├── launcher.js
├── config.js
├── logger.js
├── path-manager.js
├── process-utils.js
├── setup-manager.js
├── vite-manager.js
└── browser-manager.js
```

المسؤوليات:

| الملف                | المسؤولية               |
| -------------------- | ----------------------- |
| `main.js`            | نقطة دخول مصدر Launcher |
| `launcher.js`        | الملف الناتج من esbuild |
| `config.js`          | إعدادات التطبيق         |
| `logger.js`          | تسجيل الأحداث           |
| `path-manager.js`    | تحديد المسارات          |
| `process-utils.js`   | أدوات العمليات          |
| `setup-manager.js`   | تجهيز البيئة            |
| `vite-manager.js`    | فحص وتشغيل Vite         |
| `browser-manager.js` | فتح المتصفح             |

يجب اعتبار `launcher.js` ملفًا ناتجًا يتم توليده بواسطة esbuild.

التعديلات الطبيعية تتم على `main.js` والـ modules المساعدة، ثم يتم إعادة إنشاء `launcher.js`.

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

الـ Launcher هو الأساس الذي سيتم بناء نظام إدارة React Press المحلي عليه.

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
