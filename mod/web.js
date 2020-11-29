const http = require('http')
const url = require('url')
const pObj = require('pico-common').export('pico/obj')

const FILTER = [['index', 'csv'], ['range', 'start', 'end']]
const HAS_DATA = obj => obj && (Array.isArray(obj) || Object.keys(obj).length)
const CREATE_BODY = (body, meta) => JSON.stringify(Object.assign({}, meta, {body}))

function pushFilter(input, filter, i, output){
	for (let keys; (keys = filter[i]); i++){
		const val0 = input[keys[0]]
		if (!val0) continue
		if (Array.isArray(val0)){
			for (let i = 0, l = val0.length; i < l; i++){
				output.push(keys.reduce((acc, key) => {
					acc[key] = input[key][i]
					return acc
				}, {}))
			}
		}else{
			output.push(keys.reduce((acc, key) => {
				acc[key] = input[key]
				return acc
			}, {}))
		}
	}
}

module.exports = {

	setup: function(host, cfg, paths){
		const proxy = http.createServer((req, res) => {
			const err = host.go(req.url, {req, res})
			if (err.charAt) {
				res.statusCode = 404
				return res.end(err)
			}
		})

		proxy.listen(cfg.port, cfg.host, () => { })
	},

	log: async function (res){
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

	input: function(spec, src = 'body', filter = FILTER){
		return function(req, output, ext) {
			let obj
			switch(src){
			case 'body':
				obj = req.body
				break
			case 'params':
				obj = this.params
				break
			case 'query':
				obj = Object.assign({filter: []}, url.parse(req.url, 1).query)
				pushFilter(obj, filter, 0, obj.filter)
				break
			case 'headers':
				obj = req.headers
				break
			}
			const found = pObj.validate(spec, obj, output, ext)
			if (found) return this.next(`invalid params [${found}]`)
			return this.next()
		}
	},
}
