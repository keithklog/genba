/* GENBA Service Worker（自動生成。手で編集しない）
 * 版: 848ce3d7f5  … index.html の内容ハッシュ。中身が変わればキャッシュ名ごと変わる
 *
 * 方針：
 *   ・アプリの部品は「キャッシュ優先」。現場は電波が無いのが普通なので、
 *     一度開けたら圏外でも必ず開けることを最優先にする
 *   ・裏で新しい版を取りに行き、あればページへ知らせる（押しつけの自動更新はしない。
 *     図面に書き込んでいる最中に画面が勝手に変わるのが最悪だから）
 */
const CACHE = 'genba-848ce3d7f5';
const ASSETS = ['./', './index.html', './manifest.webmanifest',
                './icon-192.png', './icon-512.png', './icon-180.png', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  /* skipWaiting はページからの合図（更新ボタン）でだけ行う */
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys())
      if (k.startsWith('genba-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(e.request, { ignoreSearch: true });
    if (hit){
      /* 裏で更新確認（stale-while-revalidate）。失敗しても静かに諦める */
      fetch(e.request).then(res => {
        if (res && res.ok) caches.open(CACHE).then(c => c.put(e.request, res));
      }).catch(() => {});
      return hit;
    }
    try {
      const res = await fetch(e.request);
      if (res && res.ok) (await caches.open(CACHE)).put(e.request, res.clone());
      return res;
    } catch (err) {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
      throw err;
    }
  })());
});
