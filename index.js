const pStr = require('pico-common').export('pico/str')
const radix = new pStr.Radix
const routes = require('./routes')

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

routes.mod(path => {
	const mod = require('./mod/' + path)
	mod.setup()
})
