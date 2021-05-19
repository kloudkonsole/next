const path = require('path')
const args = require('pico-args')
const book = require('./src/book')
const pipeline = require('./src/pipeline')

const opt = args.parse({
	dir: ['service/', 'service directory'],
	d: '@dir',
	service: ['sample/index', 'service script in json format'],
	s: '@service'
})
book.open(path.join(opt.dir, opt.service), (err, service) => {
	if (err) throw err
	pipeline.run(service)
})
