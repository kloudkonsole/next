const pico = require('pico-common/bin/pico-cli')
const { series, parallel } = pico.export('pico/test')
const test  = pico.export('pico/test')

const map = {
	'ensure inherit work with child(obj) and ancestor(obj)': function(cb){
		cb(null, true)
	}
}

module.exports = {
	setup(host, cfg, rsc, paths){
	},
	async parallel(desc, func){
		parallel(desc, func)
		return this.next()
	},
	async series(desc, map){
		series(desc, func)
		return this.next()
	},
}
