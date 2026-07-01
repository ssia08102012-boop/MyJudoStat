# MyJudoStat — Claude Development Guide

## Проект

Персональний PWA-щоденник змагань з дзюдо для спортсмена Klub Judo Ryś (Польща).
Мова спілкування з користувачем: **українська**.

---

## Стек

| Шар | Технологія | Причина |
|-----|------------|---------|
| Білд | Vite 5 | Швидкий HMR, tree-shaking, PWA plugin |
| UI | React 18 | Компоненти, хуки, зрозумілий потік даних |
| Типи | TypeScript | Безпека при рефакторингу |
| Іконки | **Lucide React** | Сучасні SVG-іконки, tree-shakable, без емодзі |
| Графіки | Chart.js + react-chartjs-2 | Легкий, добре виглядає на темній темі |
| Стилі | CSS Modules | Ізоляція, ті самі CSS-змінні дизайну |
| Сховище | localStorage + IndexedDB | Офлайн-перший підхід |
| Хмара | Supabase JS v2 | Вже налаштовано, не змінюємо бекенд |
| PWA | vite-plugin-pwa (Workbox) | Автоматичний service worker |
| Деплой | GitHub Pages | Безкоштовно, вже є репо |

---

## Дизайн-система (не змінювати)

```css
--bg: #06080b
--bg2: #0b0f14
--bg3: #101620
--border: #1a2838
--orange: #e8720a      /* акцент */
--orange2: #ff9332
--amber: #f5c040
--text: #e2dbd0
--muted: #52606e
--green: #3dba70
--red: #e04444
```

Шрифти: `Cinzel` (заголовки) + `Crimson Pro` (текст)
Тема: тільки темна, без перемикача (не потрібен)

---

## Структура проекту

```
src/
  types/
    index.ts           — Tournament, Fight, Profile, Achievement типи
  services/
    storage.ts         — localStorage + IndexedDB (getComps, saveComps, etc.)
    supabase.ts        — syncPush, syncPull, autoSync
    i18n.ts            — TR словники UK/EN/PL + t() хелпер
    achievements.ts    — логіка розблокування досягнень
  hooks/
    useComps.ts        — стан турнірів + CRUD операції
    useLang.ts         — мова + перемикач
    useProfile.ts      — профіль спортсмена + фото
  components/
    Hero/              — фото, пояс, тренери, live-stats
    Stats/             — картки + 3 графіки Chart.js + Goals
    Tournaments/       — список, пошук, фільтр, картки
    Modals/
      FightModal       — деталі сутички
      TournamentModal  — додати / редагувати турнір
      BackupModal      — експорт / імпорт / Supabase sync
    Achievements/      — плашки досягнень
    UI/                — Button, Modal, Toast, ShareButton (спільні)
  styles/
    variables.css      — CSS custom properties
    global.css         — reset, fonts, scrollbar
  App.tsx
  main.tsx
public/
  manifest.json
  apple-touch-icon.png
  icon-192.png
  icon-512.png
```

---

## Фічі

### Порт з існуючого (обов'язково)
- [x] Профіль спортсмена (фото, пояс з підсвіткою, вага, тренери)
- [x] Турніри CRUD (додати / редагувати / видалити)
- [x] Деталі сутичок (суперник, техніка, рахунок, нотатки)
- [x] Медіа на турнір (фото/відео, lightbox)
- [x] Статистика (турніри, сутички, % перемог, медалі)
- [x] Фільтр по роках
- [x] Backup JSON (export / import)
- [x] Supabase cloud sync
- [x] i18n UK / EN / PL
- [x] PWA (офлайн, installable)

### Нові фічі
- [ ] **Charts** — стовпчастий (перемоги/поразки по роках), кільцевий (медалі), лінійний (тренд %)
- [ ] **Пошук** — по назві турніру та місту
- [ ] **Розширений фільтр** — по медалі (тільки золото тощо)
- [ ] **Native Share API** — поділитись результатом турніру
- [ ] **Goals / Цілі** — встановити ціль % перемог на рік, прогрес-бар
- [ ] **Achievements** — 8 досягнень, розблоковуються автоматично
- [ ] **Background Sync** — запис офлайн → синхронізація при підключенні

### Achievements список (8 штук)
1. Перший турнір
2. Перше золото
3. 10 перемог
4. 5 перемог підряд
5. 50 сутичок
6. Турнір за кордоном
7. Повна статистика (заповнено 5 сутичок з деталями)
8. 100 сутичок

---

## Правила кодування

1. **Іконки** — тільки Lucide React. Жодних емодзі в UI-компонентах.
2. **Типи** — всі дані типізовані через `src/types/index.ts`.
3. **Сховище** — вся робота з localStorage/IDB тільки через `src/services/storage.ts`.
4. **i18n** — всі рядки через `t(key)` хелпер, жодних хардкодних рядків в JSX.
5. **Компоненти** — функціональні, з хуками. Клас-компоненти заборонені.
6. **CSS** — CSS Modules (`.module.css`). Inline-стилі тільки для динамічних значень (ширина прогрес-бару тощо).
7. **Commits** — зрозумілі повідомлення англійською: `feat: add search filter`, `fix: sw cache bug`.
8. **Без зайвого** — не додавати фічі поза планом без обговорення.

## QA — ОБОВ'ЯЗКОВО перед кожним комітом

**Правило: жоден файл не повертається і не залишається без повного тестування.**

### Чеклист перед комітом
```
[ ] npm run build   — 0 помилок TypeScript, успішний білд
[ ] npm run dev     — додаток запускається без помилок у консолі
[ ] Перевірити UI   — відображення, адаптивність (mobile 375px, desktop 1280px)
[ ] Перевірити логіку — додати турнір, редагувати, видалити, пошук, фільтр
[ ] Перевірити PWA  — manifest.json, service worker реєструється
[ ] Перевірити i18n — перемикання мов UK/EN/PL, всі рядки перекладені
```

### При зміні компонента
```
[ ] Компонент рендериться без помилок
[ ] Props типізовані правильно (TypeScript strict)
[ ] CSS Module класи застосовуються
[ ] Немає console.error в DevTools
```

### При зміні сервісу (storage, supabase, i18n)
```
[ ] Функція повертає очікуваний тип
[ ] Помилки оброблені (try/catch або .catch())
[ ] Якщо storage — перевірити fallback (IDB при повному localStorage)
```

### Автоматичний тест при кожному білді
```bash
npm run build  # TypeScript компілює + Vite будує без помилок
```

---

## Supabase (існуючий бекенд — не змінювати)

```
URL: https://ogiqpuqeatwhxjezwhai.supabase.co
Tables: judo_comps, judo_profile, judo_fights
Bucket: judo-photos
Auth: user-id based (без пароля)
```

---

## Фази розробки

| Фаза | Опис | Статус |
|------|------|--------|
| 0 | CLAUDE.md + Vite+React+TS scaffolding | ✅ Готово |
| 1 | Types + Services (storage, i18n, supabase) | ✅ Готово |
| 2 | UI shell + Hero компонент | ✅ Готово |
| 3 | Stats + Charts | ✅ Готово |
| 4 | Tournaments list + Search + Filter | ✅ Готово |
| 5 | Modals (Fight, Tournament, Backup) | ⏳ Наступний |
| 6 | Achievements + Goals + Share | ⏳ |
| 7 | PWA + GitHub Pages деплой | ⏳ |
