const http = require('http')
const URL = require('url')
const pObj = require('pico-common').export('pico/obj')

const HAS_DATA = obj => obj && (Array.isArray(obj) || Object.keys(obj).length)
const CREATE_BODY = (body, meta) => JSON.stringify(Object.assign({}, meta, {body}))

function groupQuery(input, grouping, output = []){
	for (let i = 0, keys, val0; (keys = grouping[i]); i++){
		val0 = input[keys[0]]
		if (!val0) continue
		if (Array.isArray(val0)){
			for (let j = 0, l = val0.length; j < l; j++){
				output.push(keys.reduce((acc, key) => {
					acc[key] = input[key][j]
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
	return output
}

module.exports = {

	setup: function(host, cfg, paths){
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

	log: async function (res){
		try {
			await this.next()
		}catch(exp){
			console.error(exp)
			res.write(500, exp.message)
			res.end(exp.message)
		}
	},

	input: (spec, grouping) => {
		return function(input, output, ext) {
			let obj = input
			if (grouping && grouping.length){
				const group = groupQuery(input, grouping)
				obj = Object.assign({group}, input)
			}
			const error = pObj.validate(spec, obj, output, ext)
			if (error) return this.next(`invalid params [${error}]`)
			return this.next()
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
