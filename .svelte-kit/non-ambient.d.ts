
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/calendar" | "/calendar/[date]" | "/ingredients" | "/recipes" | "/unregistered";
		RouteParams(): {
			"/calendar/[date]": { date: string }
		};
		LayoutParams(): {
			"/": { date?: string };
			"/calendar": { date?: string };
			"/calendar/[date]": { date: string };
			"/ingredients": Record<string, never>;
			"/recipes": Record<string, never>;
			"/unregistered": Record<string, never>
		};
		Pathname(): "/" | "/calendar" | `/calendar/${string}` & {} | "/ingredients" | "/recipes" | "/unregistered";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.png" | string & {};
	}
}