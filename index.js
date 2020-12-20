const args = require('pico-args')
const book = require('./src/book')
const pipeline = require('./src/pipeline')

const opt = args.parse({
	dir: ['service/', 'service directory'],
	d: '@dir',
	service: ['sample/index', 'json script'],
	s: '@service'
})
book.open(opt.dir + opt.service, (err, service) => {
	if (err) throw err
	pipeline.run(service)
})
