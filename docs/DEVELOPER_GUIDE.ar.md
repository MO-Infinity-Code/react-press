# React Press Launcher — دليل المطور

يوضح هذا الدليل طريقة تطوير واختبار وتجميع وبناء React Press Launcher وتحويله إلى ملف تنفيذي مستقل
بصيغة `.exe` على Windows.

## نظرة عامة

React Press Launcher مسؤول عن تشغيل بيئة React Press محليًا.

عند تشغيل الـ Launcher تتم العملية بالترتيب التالي:

```text
ReactPress.exe
      ↓
تجهيز البيئة
      ↓
فحص Vite
      ↓
تشغيل Vite إذا لم يكن يعمل
      ↓
انتظار localhost:3000
      ↓
فتح المتصفح
```

الهدف من الـ Launcher هو أن يتعامل المستخدم مع React Press فقط، بينما تتم إدارة Node.js وnpm وVite
والـ environments في الخلفية.

## المتطلبات

يجب أن يتوفر على جهاز التطوير:

- Node.js 20.19+ أو 22.12+
- npm
- Windows
- الوصول إلى ملفات مصدر React Press

للتأكد من إصدار Node.js:

```bash
node --version
```

للتأكد من npm:

```bash
npm --version
```

لا تحتاج إلى تثبيت esbuild بشكل Global.

يتم استخدام:

```bash
npx esbuild
```

أثناء عملية البناء.

## هيكل المشروع

البنية الحالية للـ Launcher:

```text
react-press/
│
├── dist/
│   ├── bundle.js
│   └── react-press.exe
│
├── launcher/
│   ├── launcher.js
│   ├── browser-manager.js
│   ├── config.js
│   ├── logger.js
│   ├── path-manager.js
│   ├── process-utils.js
│   ├── setup-manager.js
│   └── vite-manager.js
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
├── sea-config.json
└── package.json
```

## مسؤوليات الـ Launcher

الـ Launcher هو الطبقة الرئيسية المسؤولة عن تنسيق عملية التشغيل.

ترتيب المسؤوليات:

```text
تجهيز البيئة
      ↓
فحص Vite
      ↓
تشغيل Vite
      ↓
التأكد من جاهزية Vite
      ↓
فتح المتصفح
```

المشروع الفعلي موجود داخل:

```text
projects/react-press/
```

أما الـ environment المشتركة الخاصة بإصدار React فتوجد داخل:

```text
react/19.2.8/
```

## بيئات React المشتركة

يمكن أن يكون لكل إصدار React بيئة مستقلة.

مثال:

```text
react/
├── 19.2.8/
│   └── node_modules/
│
└── 19.2.9/
    └── node_modules/
```

كل Environment تمثل مجموعة الـ dependencies المرتبطة بإصدار محدد من React.

إذا كان المشروع يستخدم React 19.2.8، فيستخدم Environment الخاصة بهذا الإصدار:

```text
react/19.2.8/node_modules/
```

الهدف هو منع تحميل وتخزين نفس شجرة الـ dependencies لكل مشروع بشكل منفصل.

## الـ Junctions

يتم استخدام Windows Junction لإتاحة الـ shared environment للمشروع من خلال مسار `node_modules`
المتوقع.

مثال:

```text
projects/react-press/node_modules
        ↓
react/19.2.8/node_modules
```

الـ Junction لا ينشئ نسخة ثانية من الملفات.

إنما يسمح لـ Node.js وVite وTypeScript والأدوات المرتبطة بها بالوصول إلى الـ packages من المسار
المتوقع داخل المشروع.

## قاعدة مهمة للـ Dependencies

إعدادات المشروع تكون داخل المشروع.

أما الـ dependencies المشتركة فتكون داخل Environment.

مثال:

```text
react/19.2.8/
├── package.json
└── node_modules/
```

بينما:

```text
projects/client-project/
├── package.json
├── src/
└── ...
```

يجب أن تتم إدارة الـ shared dependencies من خلال Environment Manager بدل تنفيذ عمليات تثبيت يدوية
داخل المشروع.

## تشغيل Launcher أثناء التطوير

من جذر المشروع:

```bash
node launcher/launcher.js
```

سيقوم الـ Launcher بالآتي:

```text
تشغيل Environment Setup
        ↓
فحص localhost:3000
        ↓
إذا كان Vite يعمل
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

## إنشاء Bundle للـ Launcher

ملفات الـ Launcher مقسمة إلى عدة Modules.

قبل بناء ملف `.exe`، يجب تجميعها في ملف JavaScript واحد باستخدام `esbuild`.

انتقل إلى مجلد مشروع React:

```bash
cd react-press\projects\react-press
```

ثم نفذ:

```bash
npx esbuild ..\..\launcher\launcher.js --bundle --platform=node --format=esm --outfile=..\..\dist\bundle.js
```

الناتج:

```text
dist/
└── bundle.js
```

يقوم `esbuild` بتجميع ملف `launcher.js` وجميع الملفات التي يستوردها، مثل:

```text
logger.js
config.js
path-manager.js
process-utils.js
setup-manager.js
vite-manager.js
browser-manager.js
```

## بناء ملف EXE باستخدام SEA

بعد إنشاء:

```text
dist/bundle.js
```

ارجع إلى جذر React Press:

```bash
cd ..\..
```

ثم نفذ:

```bash
node --build-sea sea-config.json
```

سيتم إنشاء الملف التنفيذي حسب إعدادات SEA.

الناتج المتوقع:

```text
dist/
├── bundle.js
└── react-press.exe
```

## إعداد SEA

يجب أن يشير `sea-config.json` إلى الـ bundle:

```json
{
    "main": "dist/bundle.js",
    "mainFormat": "module",
    "output": "dist/react-press.exe",
    "disableExperimentalSEAWarning": true
}
```

## أتمتة عملية البناء

يمكن اختصار عملية البناء باستخدام npm scripts.

مثال:

```json
{
    "scripts": {
        "bundle": "esbuild launcher/launcher.js --bundle --platform=node --format=esm --outfile=dist/bundle.js",
        "build": "npm run bundle && node --build-sea sea-config.json"
    }
}
```

بعدها:

```bash
npm run build
```

## اختبار ملف EXE

بعد نجاح عملية البناء:

```text
dist/
└── react-press.exe
```

يمكن تشغيله من PowerShell:

```powershell
.\dist\react-press.exe
```

المفترض أن تكون دورة التشغيل:

```text
React Press Launcher
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

إذا ظهرت رسالة تفيد بأن Resource قيد الاستخدام أو مقفولة، أغلق أي نسخة تعمل من:

```text
react-press.exe
```

ثم أعد عملية البناء.

وقد تحتاج أيضًا إلى إيقاف أي عملية Vite تعمل حاليًا.

### مشاكل esbuild

تأكد من تنفيذ الأمر من:

```text
react-press\projects\react-press
```

ثم نفذ:

```bash
npx esbuild ..\..\launcher\launcher.js --bundle --platform=node --format=esm --outfile=..\..\dist\bundle.js
```

وتأكد أن المسارات تتوافق مع هيكل المشروع.

### Vite غير معروف

إذا ظهرت:

```text
vite is not recognized
```

فتأكد من أن Environment تحتوي على Vite وأن المشروع يستطيع الوصول إلى الـ shared `node_modules`.

### تحذير إصدار Node.js

تحقق من الإصدار:

```bash
node --version
```

يجب أن يكون إصدار Node.js المستخدم لتشغيل الـ Launcher وVite متوافقًا مع إصدار Vite المستخدم في
المشروع.

## تقسيم ملفات Launcher

تم تقسيم Launcher إلى Modules منفصلة لتسهيل التطوير والصيانة.

```text
launcher/
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

| الملف                | المسؤولية                 |
| -------------------- | ------------------------- |
| `launcher.js`        | تنسيق وتشغيل النظام       |
| `config.js`          | إعدادات التطبيق           |
| `logger.js`          | تسجيل الأحداث             |
| `path-manager.js`    | تحديد المسارات            |
| `process-utils.js`   | أدوات التعامل مع العمليات |
| `setup-manager.js`   | تجهيز البيئة              |
| `vite-manager.js`    | فحص وتشغيل Vite           |
| `browser-manager.js` | فتح المتصفح               |

هذا التقسيم يجعل تعديل كل جزء مستقلًا أسهل، ويمنع تضخم ملف Launcher الرئيسي.

## دورة التطوير

الدورة المقترحة:

```text
تعديل Launcher
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

الأوامر:

```bash
node launcher/launcher.js
```

ثم:

```bash
npm run build
```

ثم:

```powershell
.\dist\react-press.exe
```

## التطوير المستقبلي

الـ Launcher هو الأساس الذي سيتم بناء إدارة React Press المحلية عليه.

المراحل المستقبلية تشمل:

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

الهدف النهائي هو أن يتعامل المستخدم مع React Press فقط، بينما يقوم النظام بإدارة:

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

في الخلفية بشكل تلقائي.

## المراجع

- Node.js SEA: https://nodejs.org/api/single-executable-applications.html
- Node.js Modules: https://nodejs.org/api/modules.html
- Vite: https://vite.dev/guide/
- esbuild: https://esbuild.github.io/
- npm: https://docs.npmjs.com/
