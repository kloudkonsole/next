const pStr = require('pico-common').export('pico/str')
const pObj = require('pico-common').export('pico/obj')
const service = require('./service.json')

const SRC_SPEC = '@'
const SRC_CTX = '$'
const SRC_DATA = '_'
const TYPE_ARR = ':'
const SEP = '.'
const radix = new pStr.Radix
const mods = {}
const routes = {}

/**
 * @param err
 * @param named
 * @param data
 */
async function next(err, named, data = this.data){
	if (err) throw err
	if (named) {
		const params = {}
		const key = radix.match(named, params)
		const route = routes[key]
		if (!route) return 'not found'
		return next.call({params, next, route, data, ptr: 0}, null, null, data)
	}

	const middleware = this.route[this.ptr++]
	if (!middleware) return

	const args = middleware.slice(1).map(key => {
		if (!Array.isArray(key)) return key

		let src
		switch(key[0]){
		case SRC_SPEC:
			src = service
			break
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
	await middleware[0].apply(this, args)
}

const host = {
	go(url,data){
		return next(null, url, data)
	}
}

const paths = Object.keys(service.routes)
service.mod.forEach(cfg => {
	const mod = require(cfg.mod)
	mod.setup(host, cfg, paths)
	mods[cfg.id] = mod
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
				let p
				switch(param.charAt(0)){
				case SRC_SPEC:
					p = param.split(SEP)
					p.unshift()
					params.push(pObj.dot(service, p.slice(1)))
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
		const route = []
		if (Array.isArray(method)){
			route.push(func.apply(obj, params))
		}else{
			route.push(func)
		}
		station.slice(1).forEach(s => {
			if (!s.charAt) {
				route.push(s)
				return
			}
			switch(s.charAt(0)){
			case SRC_DATA:
			case SRC_CTX:
			case SRC_SPEC:
				route.push(s.split(SEP))
				break
			default:
				route.push(s)
				break
			}
		})
		mws.push(route)
	})
})
