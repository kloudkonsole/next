const pStr = require('pico-common').export('pico/str')
const service = require('./service.json')

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
		let arg = data[key]
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

function Host(service){
	const radix = new pStr.Radix
	const paths = Object.keys(service.routes)
	paths.forEach(key => radix.add(key))

	service.mod.forEach(cfg => {
		const mod = require('./mod/' + cfg.id)
		mod.setup(this, cfg, path)
	})
}

Host.prototye = {
	go(url,data){
		return next(null, url, data)
	}
}
