const psUtil = require('picos-util')

/**
 * @param {string} method - GET, POST, PUT, DELETE
 * @param {string} href - network url
 * @param {object} params - request body or query string
 * @param {object} opt - option such as header
 * @param {object} output - store response
 *
 * @returns {Function} - callback
 */
function req(method, href, params, opt, output){
	return new Promise((resolve, reject) => {
		psUtil.ajax(method, href, params, opt, (err, state, res) => {
			if (4 !== state) return
			if (err) return reject(err)
			resolve(res)
		})
	})
}

/**
 * @param {string} method - GET, POST, PUT, DELETE
 * @param {string} href - network url
 * @param {object} params - request body or query string
 * @param {object} opt - option such as header
 * @param {Function} cb - callback method
 *
 * @returns {void} - undefined
 */
function poll(method, href, params, opt, cb){
	psUtil.ajax(method, href, params, opt, (err, state, res) => {
		if (4 !== state) return
		if (err) {
			if (500 > err.code) return cb(err)
			return setTimeout(poll, 1000, method, href, params, opt, cb)
		}
		cb(null, res)
	})
}

module.exports = {
	setup(host, cfg, rsc, paths){
	},
	poll: (method, href) => function(params, opt, output){
		process.stdout.write(`waiting ${href} response... `)
		return new Promise((resolve, reject) => {
			poll(method, href, params, opt, (err, res) => {
				if (err) return reject(err)
				if (output) Object.assign(output, res)
				process.stdout.write('done\n')
				resolve()
				this.next()
			})
		})
	},
	test(){
		req()
	}
}
