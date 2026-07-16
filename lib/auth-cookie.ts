/**
 * Имя куки сессии — отдельным модулем намеренно.
 *
 * Его импортирует middleware, который работает в edge-рантайме. Тянуть туда
 * lib/auth.ts нельзя: вместе с ним в edge-бандл уехали бы Prisma и node:crypto,
 * которых там нет, и сборка легла бы.
 */
export const SESSION_COOKIE = 'dno_admin'
