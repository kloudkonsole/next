const pjson = require('pico/json')

return {
	list(ctx){
		return function(){
			this.test('ensure json.path work', cb => {
				const json = {
					store: {
						book: [
							{price: 10},
							{price: 20},
							{price: 30},
							{price: 40}
						],
						bycycle: [
							{price: 50},
							{price: 60},
							{price: 70},
							{price: 80}
						]
					}
				}
				let total = 0
				pjson.path(json)('..','price')(price => {
					total += price; return price
				})()
				cb(null, 360 === total)
			})

			this.test('read product list', async function(cb){
				const output = []
				await ctx.next(null, 'fetch/so', {params: {page: 1, size: 25}, output})
				cb(null, output.body && Array.isArray(output.body))
			})
		}
	}
}
