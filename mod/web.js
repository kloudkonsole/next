const http = require('http')
const URL = require('url')
const qs = require('querystring')

const RAW = Symbol.for('raw')
const HAS_DATA = obj => obj && (Array.isArray(obj) || Object.keys(obj).length)
const CREATE_BODY = (body, meta) => JSON.stringify(Object.assign({}, meta, {body}))

module.exports = {

	setup(host, cfg, rsc, paths){
		const proxy = http.createServer(async (req, res) => {
			const url = URL.parse(req.url, 1)
			const err = await host.go(url.pathname, {req, res, url})
			if (err) {
				res.statusCode = 404 // eslint-disable-line require-atomic-updates
				return res.end(err.charAt ? err : JSON.stringify(err))
			}
		})

		proxy.listen(cfg.port, cfg.host, () => process.stdout.write(`listening to ${cfg.host}:${cfg.port}`))
	},

	bodyParser(req, body){
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
			req.on('end', () => {
				const str = Buffer.concat(arr).toString()
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

	router: rsc => async function(method, params) {
		const rs = rsc[params.rsc]
		if (!rs) return this.next(`unsupprted key: ${params.rsc}`)
		const indi = params.id ? '/id' : ''
		const name = `${method}/rsc${indi}`
		await this.next(null, name, Object.assign({
			params,
			rs
		}, this.data))
		return this.next()
	},

	output: (contentType = 'application/json', dataType = 'json') => {
		let headers = {}
		Object.assign(headers, {'Content-Type': contentType})

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

		return async function(res, output, meta){
			if (!res) return this.next()

			try {
				await this.next()
				if (hasData(output) || hasData(meta)) {
					res.writeHead(200, headers)
					res.end(createBody(output, meta))
				} else {
					res.writeHead(204)
					res.end()
				}
			} catch(exp) {
				console.error(exp)
				res.writeHead(500, exp.message || exp)
				res.end(exp.message || exp)
			}
		}
	}
}
