const pObj = require('pico/obj')
const base = require('@/base.json')
const env = require(`@/${pico.env('build') || 'dev'}.json`)
const product = require('@/product')

const out = {}

this.load = () => {
	pObj.extends(out, [base, {func: product}, env])
}

return out
