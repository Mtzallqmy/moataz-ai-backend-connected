# Moataz AI Backend — Railway + Supabase

هذا هو ملف الباكند المخصص للنشر على Railway.  
يعمل مع قاعدة Supabase PostgreSQL فقط.

## متغيرات Railway

ضع هذه المتغيرات داخل خدمة الباكند في Railway:

```env
DATABASE_URL=رابط Supabase PostgreSQL
JWT_SECRET=سر_طويل
ENCRYPTION_KEY=سر_طويل
FRONTEND_URL=https://رابط-الواجهة-في-vercel.vercel.app
NIXPACKS_NODE_VERSION=22
```

## أوامر Railway

Build Command:

```bash
npm run build
```

Start Command:

```bash
npm run railway:start
```

عند التشغيل سيقوم تلقائيًا بـ:

```bash
prisma generate
prisma db push --accept-data-loss
node prisma/seed.js
node server.mjs
```

## اختبار الباكند

بعد النشر افتح:

```txt
https://YOUR-RAILWAY-DOMAIN/health
```

إذا ظهرت `healthy` فالربط صحيح.
