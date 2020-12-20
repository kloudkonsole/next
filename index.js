const args = require('pico-args')
const book = require('./src/book')
const pipeline = require('./src/pipeline')

const options = args.parse({
	service: ['service/logistic/index', 'service json script'],
	s: '@service'
})

book.open(options.service, (err, service) => {
	if (err) throw err
	pipeline.run(service)
})
