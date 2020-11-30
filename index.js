const pStr = require('pico-common').export('pico/str')
const pObj = require('pico-common').export('pico/obj')
const service = require('./service.json')

const radix = new pStr.Radix
const mods = {}
const routes = {}

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
		if (!key || !key.charAt) return key
		let arg = pObj.dot(data, key)
		if (!arg){
			switch(key.charAt(0)){
			case ':':
				data[key] = arg = []
				break
			case '#':
				arg = key.substring(1)
				break
			default:
				data[key] = arg = {}
				break
			}
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
	const mod = require('./mod/' + cfg.id)
	mod.setup(host, cfg, paths)
	mods[cfg.id] = mod
})

paths.forEach(key => {
	radix.add(key)
	const pipeline = service.routes[key]
	if (!Array.isArray(pipeline)) throw `invald routes ${key}`
	const mws = routes[key] = []
	pipeline.forEach((station, i) => {
		if (!Array.isArray(station)) throw `invalid route ${key}.${station}`
		const method = station[0]
		let path = method
		let params = []
		if (Array.isArray(method)) {
			path = method[0]

			let spec
			method.slice(1).forEach(param => {
				if (!param.charAt){
					params.push(param)
					return
				}
				switch(param.charAt(0)){
				case '#':
					params.push(param.slice(1))
					break
				default:
					params.push(pObj.dot(service, param.split('.')))
					break
				}
			})
		}
		const arr = path.split('.')
		const mname = arr.pop()
		const obj = pObj.dot(mods, arr)
		if (!obj || !obj[mname]) throw `undefined method ${key}.${path}`
		const func = obj[mname]
		const route = []
		if (Array.isArray(method)){
			route.push(func.apply(obj, params))
		}else{
			route.push(func)
		}
		station.slice(1).forEach(s => {
			route.push(s.split('.'))
		})
		mws.push(route)
	})
})
