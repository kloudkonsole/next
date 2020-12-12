const http = require('http')
const URL = require('url')
const qs = require('querystring')

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

	/*
	 * @ spec
	 * $ this
	 * _ data
	 */
	router: rcs => async function(req, res, output, meta) {
		const params = this.params
		const indi = params.id ? '/id' : ''
		const key = params.rcs + indi
		const rc = rcs[key]
		if (!rc) return this.next(`unsupprted key: ${key}`)
		const method = req.method
		const spec = rc[method]
		if (!rc) return this.next(`unsupprted method: ${method}`)
		const name = `${req.method}/rcs${indi}`
		await this.next(null, name, {
			output,
			meta,
			req,
			res,
			params,
			spec
		})
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

		return async function(res, data, meta){
			if (!res) return this.next()

			try {
				await this.next()
				if (hasData(data) || hasData(meta)) {
					res.writeHead(200, headers)
					res.end(createBody(data, meta))
				} else {
					res.writeHead(204)
					res.end()
				}
			} catch(exp) {
				console.error(exp)
				res.write(500, exp.message)
				res.end(exp.message)
			}
		}
	}
}
