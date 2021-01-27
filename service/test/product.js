const pjson = pico.export('pico/json')

return {
	func: {
		list(){
			this.test('ensure json.path work', function(cb){
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
				pjson.path(json)('..','price')((price)=>{
					total+=price; return price
				})()
				cb(null, 360 === total)
			})
		}
	}
}
