# Checklist نشر الباك‑إند على Railway

1. شغّل `supabase/schema.sql` في Supabase SQL Editor.
2. ارفع هذا المجلد فقط إلى Railway.
3. أضف متغيرات `.env.example` في Railway.
4. تأكد أن `FRONTEND_ORIGIN` هو رابط Vercel.
5. تأكد أن `PUBLIC_BACKEND_URL` هو رابط Railway لو أردت Telegram webhook.
6. Start command:
   `npm start`
7. افتح `/api/healthz` للتأكد أن الخدمة تعمل.
