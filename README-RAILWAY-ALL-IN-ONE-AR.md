# Moataz AI Gateway — نسخة Railway الكاملة

هذه النسخة تعمل كلها على Railway في خدمة واحدة: الواجهة Next.js + الباك‑إند Express + Supabase + بوابة /v1 المتوافقة مع OpenAI + استوديو الوكيل.

## ماذا تغير؟

- لم تعد الواجهة منفصلة عن الباك‑إند. Railway يشغل `server.js` الذي يحمّل API وواجهة Next.js على نفس الدومين.
- تمت إضافة صفحة **استوديو الوكيل** من القائمة الجانبية: `/agent`.
- يمكنك من نفس الصفحة:
  - إضافة مزود API وحفظ المفتاح مشفرًا في Supabase.
  - فحص اتصال المزود.
  - فتح دردشة وكيل حقيقية.
  - تفعيل التصفح الحقيقي من سيرفر Railway.
  - قراءة/تعديل ملفات GitHub من المستودعات المتصلة.
  - إنشاء Gateway API key لاستخدام المنصة من CLI أو OpenCode عبر `/v1/chat/completions`.
- الباك‑إند يدعم مزودات OpenAI / OpenRouter / Anthropic / Gemini / Mistral / Groq / DeepSeek / Together / xAI / Cohere / Custom OpenAI-compatible.

## خطوات التشغيل على Railway

1. ارفع هذا المشروع كاملًا إلى GitHub.
2. في Railway اختر **New Project → Deploy from GitHub repo**.
3. أضف متغيرات البيئة من `.env.example`:

```env
NODE_ENV=production
PORT=8080
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
APP_ENCRYPTION_KEY=ضع_سر_طويل_وثابت_هنا
PUBLIC_BACKEND_URL=https://رابط-railway-بعد-النشر.up.railway.app
NEXT_PUBLIC_API_URL=
FRONTEND_ORIGIN=*
```

4. افتح Supabase SQL Editor وشغل الملف:

```txt
supabase/schema.sql
```

5. في Supabase Auth، إن كنت تريد التسجيل يعمل مباشرة بدون تأكيد بريد، عطل Email Confirmation أثناء التجربة أو فعّل SMTP صحيح.
6. انشر الخدمة. Railway سيشغل:

```bash
npm install && npm run build
npm run start
```

## استخدام CLI / OpenCode

من صفحة `/agent` أنشئ Gateway API key، ثم استخدم:

```bash
export OPENAI_BASE_URL="https://YOUR-RAILWAY-APP.up.railway.app/v1"
export OPENAI_API_KEY="mk_..."

curl "$OPENAI_BASE_URL/chat/completions" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'
```

إذا كان لديك أكثر من مزود، يمكنك تمرير `providerId` في body أو استخدام صيغة:

```json
{"model":"PROVIDER_UUID:gpt-4o-mini","messages":[...]}
```

## ملاحظات مهمة

- لا تضع `SUPABASE_SERVICE_ROLE_KEY` أو `APP_ENCRYPTION_KEY` في Vercel أو داخل المتصفح. هنا كلها داخل Railway فقط.
- لا تغير `APP_ENCRYPTION_KEY` بعد أن يحفظ المستخدمون مفاتيح API؛ تغييره سيجعل المفاتيح القديمة غير قابلة للفك.
- التصفح الحقيقي يعتمد على قدرة Railway على الوصول للرابط، وقد تمنع بعض المواقع bots أو تحتاج JavaScript؛ في هذه الحالة سيرجع خطأ واضح بدل بيانات وهمية.
