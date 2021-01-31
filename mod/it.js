const pico = require('pico-common/bin/pico-cli')
const {series, parallel} = pico.export('pico/test')
const test = pico.export('pico/test')

module.exports = {
	setup(host, cfg, rsc, paths){
	},
	async parallel(desc, func){
		parallel(desc, func(this))
	},
	async series(desc, func){
		series(desc, func(this))
	}
}
