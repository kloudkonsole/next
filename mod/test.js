const pico = require('../bin/pico-cli')
const { parallel, series } = pico.export('pico/test')

const map = {
	'ensure inherit work with child(obj) and ancestor(obj)': function(cb){
		cb(null, true)
	}
}

module.exports = {
	async parallel(desc, map){
		parallel(desc, function(){
			Object.keys(map).forEach((k, f) => this.test(k, f)
		})
	},
	async series(desc, map){
		series(desc, function(){
			Object.keys(map).forEach((k, f) => this.test(k, f)
		})
	},
}
