const pico = require('pico-common')
const psUtil = require('picos-util')
const args = require('pico-args')
const pipeline = require('./src/pipeline')

const opt = args.parse({
	name: ['stub', 'service name'],
	n: '@name',
	dir: ['service/', 'service directory'],
	d: '@dir',
	service: ['sample', 'json script'],
	s: '@service'
})

pico.run({
	name: opt.name,
	ajax: psUtil.ajax,
	paths: {
		'@': opt.dir + opt.service
	},
	env: {
		pipeline,
	},
	preprocessors: {
	},
	importRule: []
}, function(){
	const pObj = require('pico/obj')
	const pipeline = define('pipeline', pico.getEnv('pipeline')
	const index = require('@/index')

	return function(){
		const service = pObj.extend({}, index)
		pipeline.run(service)
	}
})
