import type { Handle } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';

/**
 * レート制限用のシンプルなメモリストア
 * 本番環境ではRedisなどの外部ストアを推奨
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * レート制限をチェック
 * @param ip IPアドレス
 * @param maxRequests 期間内の最大リクエスト数
 * @param windowMs 期間（ミリ秒）
 */
function checkRateLimit(ip: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
	const now = Date.now();
	const record = rateLimitStore.get(ip);

	// 期間が過ぎていればリセット
	if (!record || now > record.resetTime) {
		rateLimitStore.set(ip, {
			count: 1,
			resetTime: now + windowMs
		});
		return true;
	}

	// 制限内かチェック
	if (record.count >= maxRequests) {
		return false;
	}

	// カウントを増やす
	record.count++;
	return true;
}

/**
 * SvelteKit Hooks - Server-side middleware
 * セキュリティ機能:
 * 1. CSRF保護（Originヘッダーチェック）
 * 2. レート制限
 * 3. セキュリティヘッダー追加
 */
export const handle: Handle = async ({ event, resolve }) => {
	const clientIp = event.getClientAddress();
	const origin = event.request.headers.get('origin');
	const referer = event.request.headers.get('referer');

	// /api/* エンドポイントへのアクセスを保護
	if (event.url.pathname.startsWith('/api/')) {
		// レート制限チェック（本番環境のみ）
		if (!dev) {
			const allowed = checkRateLimit(clientIp, 100, 60000); // 1分間に100リクエストまで
			if (!allowed) {
				console.warn('[Security] Rate limit exceeded:', {
					ip: clientIp,
					path: event.url.pathname
				});

				return json(
					{
						error: 'Too Many Requests',
						message: 'レート制限を超えました。しばらくしてから再度お試しください。'
					},
					{
						status: 429,
						headers: {
							'Retry-After': '60'
						}
					}
				);
			}
		}

		// CSRF保護: POSTリクエストの場合、OriginまたはRefererをチェック
		if (event.request.method === 'POST') {
			const allowedOrigins = [event.url.origin];

			// OriginヘッダーまたはRefererヘッダーが自サイトからのものか確認
			const isValidOrigin = origin && allowedOrigins.includes(origin);
			const isValidReferer = referer && referer.startsWith(event.url.origin);

			if (!isValidOrigin && !isValidReferer) {
				console.warn('[Security] CSRF attempt detected:', {
					ip: clientIp,
					origin,
					referer,
					path: event.url.pathname
				});

				return json(
					{
						error: 'Forbidden',
						message: 'リクエストが拒否されました'
					},
					{ status: 403 }
				);
			}
		}

		console.log('[Security] API request allowed:', {
			ip: clientIp,
			path: event.url.pathname,
			method: event.request.method
		});
	}

	// レスポンスを取得
	const response = await resolve(event);

	// セキュリティヘッダーを追加
	if (!dev) {
		response.headers.set('X-Content-Type-Options', 'nosniff');
		response.headers.set('X-Frame-Options', 'DENY');
		response.headers.set('X-XSS-Protection', '1; mode=block');
		response.headers.set(
			'Strict-Transport-Security',
			'max-age=31536000; includeSubDomains; preload'
		);
		response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	}

	return response;
};
