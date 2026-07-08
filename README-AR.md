# باك‑إند Moataz AI — Railway + Supabase

هذا المجلد هو الباك‑إند المستقل الذي ترفعه على Railway.  
الباك‑إند ليس واجهة وهمية؛ هو API حقيقي يتصل بـ Supabase، يحفظ المستخدمين والمزودين والمفاتيح مشفرة، ويستدعي مزودي الذكاء الاصطناعي فعليًا عند استخدام صفحة الدردشة.

## ماذا يحتوي؟

- تسجيل ودخول عبر Supabase Auth.
- حفظ مقدمي الخدمات في Supabase.
- تشفير مفاتيح مزودي الذكاء الاصطناعي قبل حفظها في قاعدة البيانات.
- دعم مزودات فعلية:
  - OpenAI
  - OpenRouter
  - Anthropic Claude
  - Google Gemini
  - Mistral
  - Groq
  - DeepSeek
  - Together AI
  - xAI
  - Cohere
  - أي مزود OpenAI-compatible عبر Custom
- فحص الاتصال بالمزود.
- جلب النماذج من المزود إن أمكن.
- دردشة فعلية عبر `/api/playground/chat`.
- تكامل Telegram webhook.
- ربط مستودعات GitHub وقراءة/كتابة الملفات عبر token.
- سجلات استخدام حقيقية في جدول `usage_logs`.

## 1) جهّز Supabase

افتح Supabase ثم SQL Editor وشغّل الملف:

```sql
supabase/schema.sql
```

هذا ينشئ الجداول والسياسات المطلوبة.

## 2) متغيرات Railway

ارفع هذا المجلد إلى Railway، ثم ضع المتغيرات التالية:

```env
PORT=8080
NODE_ENV=production
FRONTEND_ORIGIN=https://your-frontend.vercel.app

SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

APP_ENCRYPTION_KEY=اكتب_نص_عشوائي_طويل_جدا_ولا_تشاركه
PUBLIC_BACKEND_URL=https://your-backend.up.railway.app
```

مهم جدًا:  
`SUPABASE_SERVICE_ROLE_KEY` لا يوضع أبدًا في Vercel ولا في الواجهة. يوضع فقط في Railway.

## 3) التشغيل المحلي

```bash
npm install
cp .env.example .env
npm run dev
```

سيعمل الخادم عادة على:

```txt
http://localhost:8080
```

## 4) ربط الواجهة

بعد نشر الباك‑إند على Railway، انسخ رابط Railway وضعه في Vercel داخل متغير:

```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

ثم أعد نشر الواجهة.

## 5) ملاحظات مهمة

- إذا كان Supabase Auth يتطلب تأكيد البريد الإلكتروني، فلن يرجع تسجيل الحساب token مباشرة. إما عطّل email confirmation أثناء التجربة أو فعّل البريد وسجّل الدخول بعد التأكيد.
- مفاتيح المستخدمين ومفاتيح Telegram وGitHub تحفظ مشفرة باستخدام `APP_ENCRYPTION_KEY`.
- عند تغيير `APP_ENCRYPTION_KEY` لن تستطيع فك تشفير المفاتيح القديمة.
- تأكد من ضبط `FRONTEND_ORIGIN` على رابط Vercel حتى لا تحدث مشاكل CORS.
