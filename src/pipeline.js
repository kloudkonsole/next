const pStr = require('pico-common').export('pico/str')
const pObj = require('pico-common').export('pico/obj')

const KEYWORDS = [
	'params',
	'next',
	'route',
	'data',
	'ptr'
]
const SRC_SPEC = '@'
const SRC_CTX = '$'
const SRC_DATA = '_'

const TYPE_ARR = ':'
const SEP = '.'

/**
 * _host class
 *
 * @param {object} radix - radix tree for routing
 * @param {object} libs - loaded lib/module from spec
 * @param {object} routes - middleware routes
 *
 * @returns {void} - this
 */
function _host(radix, libs, routes){

	/**
	 * Forward to next middelware
	 *
	 * @param {object} err - error object
	 * @param {string} named - if given it start the named pipeline instead of continuing the current pipeline
	 * @param {object} [data = this.data] - data use in current pipeline
	 * @returns {void} - no returns
	 */
	async function next(err, named, data = this.data || {}){
		if (err) throw err
		if (null != named) {
			const params = {}
			const key = radix.match(named, params)
			const route = routes[key]
			if (!route) return 'not found'
			return next.call(Object.assign({}, {params, next, route, data, ptr: 0}))
		}

		const middleware = this.route[this.ptr++]
		if (!middleware) return

		const args = middleware.slice(2).map(key => {
			if (!Array.isArray(key)) return key

			let src
			switch(key[0]){
			case SRC_CTX:
				src = this
				break
			case SRC_DATA:
				src = data
				break
			default:
				return key
			}

			const path = key.slice(1)
			let arg = pObj.dot(src, path)
			if (arg) return arg
			if (SRC_DATA !== key[0] || key.length !== 2) return void 0

			switch(key[1].charAt(0)){
			case TYPE_ARR:
				src[path.join(SEP)] = arg = []
				break
			default:
				src[path.join(SEP)] = arg = {}
				break
			}
			return arg
		})
		await middleware[1].apply(Object.assign(this, {ctx: middleware[0]}), args)
	}

	return {
		go(url, data){
			return next(null, url, data)
		},
		listen(mod, filter, instance){
		}
	}
}

module.exports = {
	run(service){
		const radix = new pStr.Radix
		const mods = {}
		const libs = {}
		const routes = {}
		const paths = Object.keys(service.routes)
		const host = _host(radix, libs, routes)

		Object.keys(service.mod).forEach(id => {
			if (!id || KEYWORDS.includes(id)) throw `invalid id [${id}]`
			const cfg = service.mod[id]
			const mod = require(`../mod/${cfg.mod}`)
			Object.assign(libs, {[id]: mod.setup(host, cfg, service.rsc, paths)})
			mods[id] = mod
		})

		paths.forEach(key => {
			radix.add(key)
			const pipeline = service.routes[key]
			if (!Array.isArray(pipeline)) throw `invald routes ${key}`
			const mws = routes[key] = []
			pipeline.forEach((station, i) => {
				if (!Array.isArray(station) || !station.length) throw `invalid route ${key}.${station}`
				const method = station[0]
				let path = method
				let params = []
				if (Array.isArray(method)) {
					path = method[0]

					method.slice(1).forEach(param => {
						if (!param.charAt){
							params.push(param)
							return
						}
						switch(param.charAt(0)){
						case SRC_SPEC:
							params.push(pObj.dot(service, (param.split(SEP)).slice(1)))
							break
						default:
							params.push(param)
							break
						}
					})
				}
				const arr = path.split(SEP)
				const mname = arr.pop()
				const obj = pObj.dot(mods, arr)
				if (!obj || !obj[mname]) throw `undefined method key:${key} path:${path}`
				const func = obj[mname]
				const route = [pObj.dot(libs, arr)]
				if (Array.isArray(method)){
					route.push(func.apply(obj, params))
				}else{
					route.push(func)
				}
				station.slice(1).forEach(s => {
					if (null == s || !s.charAt) {
						route.push(s)
						return
					}
					switch(s.charAt(0)){
					case SRC_DATA:
					case SRC_CTX:
						route.push(s.split(SEP))
						break
					case SRC_SPEC:
						route.push(pObj.dot(service, (s.split(SEP)).slice(1)))
						break
					default:
						route.push(s)
						break
					}
				})
				mws.push(route)
			})
		})

		host.go('')
	}
}
