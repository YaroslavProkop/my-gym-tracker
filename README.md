# MY GYM TRACKER — запуск і публікація

Це готовий React/Vite сайт із темним інтерфейсом і червоними акцентами. Для онлайн-акаунтів та синхронізації використовується Supabase; для публічного посилання — Vercel.

## 1. Створи базу даних Supabase
1. Відкрий https://supabase.com/ та створи безкоштовний проєкт.
2. У проєкті відкрий **SQL Editor → New query**.
3. Скопіюй весь вміст файлу `supabase.sql`, встав і натисни **Run**.
4. Відкрий **Project Settings → API** (або Connect).
5. Скопіюй **Project URL** і **anon/public key**. Не використовуй `service_role` key у браузері.

## 2. Налаштуй сайт
1. Розпакуй ZIP.
2. У кореневій папці створи файл `.env` (поруч із `package.json`).
3. Скопіюй у нього:
   ```
   VITE_SUPABASE_URL=https://твій-проєкт.supabase.co
   VITE_SUPABASE_ANON_KEY=твій-публічний-ключ
   ```
4. Встанови Node.js LTS з https://nodejs.org/
5. Відкрий термінал у папці сайту та виконай:
   ```
   npm install
   npm run dev
   ```
6. Відкрий адресу, яку покаже Vite (зазвичай http://localhost:5173).

## 3. Опублікуй сайт у Vercel
1. Створи акаунт на https://vercel.com/ і https://github.com/.
2. Завантаж файли цього проєкту в новий GitHub repository.
3. У Vercel натисни **Add New → Project**, імпортуй репозиторій.
4. Framework: Vite. Build command: `npm run build`. Output directory: `dist`.
5. У **Environment Variables** додай `VITE_SUPABASE_URL` і `VITE_SUPABASE_ANON_KEY` з тих самих значень, що й у `.env`.
6. Натисни Deploy. Vercel видасть постійне посилання виду `https://назва-проєкту.vercel.app`.

## 4. Перевір реєстрацію
- Відкрий опубліковане посилання та створи акаунт.
- Якщо Supabase просить підтвердження email, підтвердь лист.
- Для зручності в Supabase → Authentication → URL Configuration додай Vercel URL до Site URL та Redirect URLs.
- Увійди з телефона й комп'ютера тим самим акаунтом — дані будуть синхронізуватися через Supabase.

## Важливо
- У браузер можна додавати тільки Supabase anon/public key. Ніколи не публікуй `service_role` key.
- Таблиці захищені Row Level Security: користувач може читати/змінювати тільки власні записи.
- Це стартова версія: дані зберігаються в хмарі, але не має автоматичного резервного копіювання/видалення акаунта.
- Перед публічним використанням перевір налаштування підтвердження email і політики доступу в Supabase.
- GYM TRACKER
