export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.DBDgZXdg.js",app:"_app/immutable/entry/app.D_2Ws_y7.js",imports:["_app/immutable/entry/start.DBDgZXdg.js","_app/immutable/chunks/C35qZppM.js","_app/immutable/chunks/DSNROpxJ.js","_app/immutable/chunks/8-6qQ4eg.js","_app/immutable/chunks/CxwJ66eS.js","_app/immutable/entry/app.D_2Ws_y7.js","_app/immutable/chunks/DSNROpxJ.js","_app/immutable/chunks/B1b8ybsR.js","_app/immutable/chunks/CxwJ66eS.js","_app/immutable/chunks/8spvGl9n.js","_app/immutable/chunks/Tw0QuGoc.js","_app/immutable/chunks/CFPD2V2T.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js')),
			__memo(() => import('../output/server/nodes/4.js')),
			__memo(() => import('../output/server/nodes/5.js')),
			__memo(() => import('../output/server/nodes/6.js')),
			__memo(() => import('../output/server/nodes/7.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/calendar",
				pattern: /^\/calendar\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/calendar/[date]",
				pattern: /^\/calendar\/([^/]+?)\/?$/,
				params: [{"name":"date","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/ingredients",
				pattern: /^\/ingredients\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/recipes",
				pattern: /^\/recipes\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/unregistered",
				pattern: /^\/unregistered\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
