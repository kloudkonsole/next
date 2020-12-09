const http = require('http')
const URL = require('url')
const qs = require('querystring'),
const pObj = require('pico-common').export('pico/obj')

const RAW = Symbol.for('raw')
const HAS_DATA = obj => obj && (Array.isArray(obj) || Object.keys(obj).length)
const CREATE_BODY = (body, meta) => JSON.stringify(Object.assign({}, meta, {body}))

module.exports = {

	setup(host, cfg, paths){
		const proxy = http.createServer((req, res) => {
			const url = URL.parse(req.url, 1)
			const err = host.go(url.pathname, {req, res, url})
			if (err.charAt) {
				res.statusCode = 404
				return res.end(err)
			}
		})

		proxy.listen(cfg.port, cfg.host, () => { })
	},

	async bodyParser(req, body){
		return new Promise((resolve, reject) => {
			const arr = []

			req.on('data', chuck => {
				arr.push(chuck)

				// Too much POST data, kill the connection!
				if (arr.length > 128) req.connection.destroy()
			})
			req.on('error',err => {
				reject(err)
				this.next(err)
			})
			req.on('end', ()=>{
				const str=Buffer.concat(arr).toString()
				const raw = {[RAW]: str}
				try{
					switch(req.headers['content-type']){
					case 'application/x-www-form-urlencoded': Object.assign(body, qs.parse(str), raw); break
					case 'text/plain': Object.assign(body, raw); break
					case 'application/json': Object.assign(body, JSON.parse(str), raw); break
					default: Object.assign(body, raw); break
					}
				}catch(exp){
					Object.assign(body, raw)
				}
				resolve()
				return this.next()
			})
		})
	},

	router(rcs){
		return function(method, output, meta) {
			const rc = rcs[method]
			if (!rc) return next('unsupprted method: ' + method)
			await this.next(null, name, {
				output,
				meta,
				params: this.params,
				querySpecName: rc.query,
				bodySpecName: rc.body,
				headerSpecName: rc.header,
			})
			return this.next()
		}
	},

	async watch(res){
		try {
			await this.next()
		}catch(exp){
			console.error(exp)
			res.write(500, exp.message)
			res.end(exp.message)
		}
	},

	output: (contentType = 'application/json', dataType = 'json') => {
		let headers = {}
		Object.assign(headers, { 'Content-Type': contentType })

		let hasData = HAS_DATA
		let createBody = CREATE_BODY
		switch(dataType){
		case 'text':
			hasData = data => data && data.charAt && data.length
			createBody = body => body.charAt ? body : JSON.stringify(body)
			break
		case 'xml':
			createBody = body => '<xml></xml>'
			break
		}

		return function(res, data, meta){
			if (!res) return this.next()
			if (hasData(data) || hasData(meta)) {
				res.writeHead(200, headers)
				res.end(createBody(data, meta))
			} else {
				res.writeHead(204)
				res.end()
			}
			return this.next()
		}
	},
}
