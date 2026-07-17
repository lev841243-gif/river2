#!/usr/bin/env bash
#
# Выкатка на боевой сервер. Запускать НА СЕРВЕРЕ:
#
#   ssh root@85.198.68.244 'bash /root/dno/scripts/deploy.sh'
#
# Почему скриптом, а не серией команд руками:
#
# 1. Порядок шагов легко перепутать, а цена — боевой сайт. Забыть
#    `prisma generate` после правки схемы = падение в рантайме («Unknown
#    argument»), на этом уже наступали.
# 2. Прежняя процедура делала `rm -rf .next` у РАБОТАЮЩЕГО сайта: Next читает
#    чанки с диска на каждый запрос, поэтому посетители получали ошибки всё
#    время сборки — десятки секунд. Здесь сборка идёт в отдельную папку, а
#    подмена — одним `mv`, то есть мгновенно.
# 3. Если после выкатки сайт не отвечает — откат происходит сам, а не после
#    того, как кто-то заметит.

set -euo pipefail

cd "$(dirname "$0")/.."

SITE="https://prokatkaterov.ru/"

echo "→ код"
# Сервер — не рабочее место: своих правок здесь быть не должно. Сбрасываем их
# перед pull, потому что сборка иногда трогает файлы под git (Next дописывает
# include в tsconfig.json), и тогда pull отказывается работать — «your local
# changes would be overwritten». Так уже было с tsconfig.tsbuildinfo: деплой
# тихо не доезжал, а выглядело это как «код не работает».
git checkout -- . 2>/dev/null || true
git pull

# npm ci каждый раз: он же тянет postinstall → prisma generate. Лишние 30 секунд
# дешевле, чем забытый generate после правки schema.prisma.
echo "→ зависимости"
npm ci --silent

echo "→ миграции"
npx prisma migrate deploy

# Сборка падает на ошибках типов (ignoreBuildErrors: false в next.config.mjs),
# поэтому сломанный код сюда не доедет.
echo "→ сборка (сайт продолжает работать на старой)"
rm -rf .next-build
NEXT_DIST_DIR=.next-build npm run build

echo "→ подмена сборки"
rm -rf .next-old
[ -d .next ] && mv .next .next-old
mv .next-build .next

echo "→ перезапуск"
pm2 reload dno --update-env >/dev/null

# PM2 в fork_mode — это полноценный перезапуск, процессу нужно подняться.
sleep 4

code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$SITE" || echo 000)
echo "→ проверка: $SITE → $code"

if [ "$code" != "200" ]; then
  echo "❌ сайт не отвечает. Откатываю на предыдущую сборку."
  rm -rf .next-bad
  mv .next .next-bad
  mv .next-old .next
  pm2 reload dno --update-env >/dev/null
  sleep 4
  back=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$SITE" || echo 000)
  echo "   после отката: $back"
  echo "   сломанная сборка сохранена в .next-bad — есть что смотреть"
  exit 1
fi

echo "✅ готово: $(git log --oneline -1)"
