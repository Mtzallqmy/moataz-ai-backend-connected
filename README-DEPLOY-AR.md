# تعليمات النشر السريعة — Moataz AI

## أين أضع متغيرات قاعدة البيانات؟

- ضع `DATABASE_URL` في Railway فقط داخل خدمة الباكند.
- لا تضع `DATABASE_URL` في Vercel.
- Vercel يحتاج فقط رابط الباكند:
  `NEXT_PUBLIC_API_URL=https://رابط-الباكند-في-railway`

## 1) نشر الباكند على Railway

ارفع مجلد:

```txt
moataz-ai-backend-railway
```

ثم ضع Variables في Railway:

```env
DATABASE_URL=رابط Supabase PostgreSQL
JWT_SECRET=سر_طويل_عشوائي
ENCRYPTION_KEY=سر_طويل_عشوائي
FRONTEND_URL=https://رابط-الواجهة-في-vercel.vercel.app
NIXPACKS_NODE_VERSION=22
```

Build Command:

```bash
npm run build
```

Start Command:

```bash
npm run railway:start
```

بعد النشر افتح:

```txt
https://رابط-railway/health
```

## 2) نشر الواجهة على Vercel

ارفع مجلد:

```txt
moataz-ai-frontend-vercel
```

ثم ضع Variables في Vercel:

```env
NEXT_PUBLIC_API_URL=https://رابط-الباكند-في-railway.up.railway.app
```

Build Command:

```bash
npm run build
```

## 3) رابط Supabase

من Supabase:
Settings → Database → Connection string → URI

استخدم رابط PostgreSQL كاملًا في Railway باسم `DATABASE_URL`.

## برومبت صغير للتنفيذ

انشر مجلد `moataz-ai-backend-railway` على Railway واضبط DATABASE_URL من Supabase و JWT_SECRET و ENCRYPTION_KEY و FRONTEND_URL. ثم انشر مجلد `moataz-ai-frontend-vercel` على Vercel واضبط NEXT_PUBLIC_API_URL برابط الباكند في Railway. لا تضع DATABASE_URL في Vercel.
