import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';

/**
 * 本番環境対応のエラーレスポンスを生成
 * 開発環境: 詳細なエラー情報を返す
 * 本番環境: 一般的なエラーメッセージのみ返し、詳細はサーバーログに記録
 */
export function createErrorResponse(
	error: any,
	defaultMessage: string = 'エラーが発生しました',
	statusCode: number = 500
) {
	// サーバーログには常に詳細を記録
	console.error('[Error]', {
		message: error.message,
		code: error.code,
		stack: dev ? error.stack : undefined,
		timestamp: new Date().toISOString()
	});

	// 開発環境: 詳細なエラー情報を返す
	if (dev) {
		return json(
			{
				error: defaultMessage,
				details: error.message,
				code: error.code || 'UNKNOWN_ERROR',
				stack: error.stack
			},
			{ status: statusCode }
		);
	}

	// 本番環境: 一般的なメッセージのみ
	return json(
		{
			error: defaultMessage
		},
		{ status: statusCode }
	);
}

/**
 * バリデーションエラーレスポンスを生成
 */
export function createValidationError(message: string, field?: string) {
	return json(
		{
			error: 'Validation Error',
			message,
			field
		},
		{ status: 400 }
	);
}
