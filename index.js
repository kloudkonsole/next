const http = require('http')
const url = require('url')
const pStr = require('pico-common').export('pico/str')
const pObj = require('pico-common').export('pico/obj')
const radix = new pStr.Radix

async function wait(sec){
	await new Promise((resolve, reject) => {
		setTimeout(resolve, sec)
	})
	return this.next()
}

function validate(spec, src = 'body'){
	return function(res, output, ext) {
		let obj
		switch(src){
		case 'body':
			obj = req.body
			break
		case 'params':
			obj = this.params
			break
		case 'query':
			obj = url.parse(req.url, true)
			break
		case 'headers':
			obj = req.headers
			break
		}
		const found = pObj.validate(spec, obj, output, ext)
		if (found) return this.next(`invalid params [${found}]`)
		return this.next()
	}
}

async function log(res){
	try {
	const s = Date.now()
		await this.next()
	}catch(exp){
		console.error(exp)
		res.statusCode = 500
		res.end(exp.message)
	}
}

function output(res, txt){
	res.writeHead(200, { 'Content-Type': 'text/plain' })
	res.end(txt)
	return this.next()
}

function outputJSON(res, obj){
	res.writeHead(200, { 'Content-Type': 'application/json' })
	res.end(JSON.stringify(obj))
	return this.next()
}

const routes = {
	'/1.0/health': [
		[log, 'res'],
		[wait, 5],
		[output, 'res', 'ok'],
	],
	'/1.0/user/:id': [
		[log, 'res'],
		[wait, 5000],
		[validate({type: 'object', spec: {id: 'string'}}, 'params'), 'res', 'params'],
		[outputJSON, 'res', 'params'],
	]
}

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

function router(routes){
	const keys = Object.keys(routes)
	keys.forEach(key => radix.add(key))

	return (req, res) => {
		const err = next(null, req.url, {req, res})
		if (err.charAt) {
			res.statusCode = 404
			return res.end(err)
		}
	}
}

const proxy = http.createServer(router(routes))

// Now that proxy is running
proxy.listen(1337, '127.0.0.1', () => { })
