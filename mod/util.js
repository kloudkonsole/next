function groupQuery(input, grouping, output = []){
	for (let i = 0, keys, val0; (keys = grouping[i]); i++){
		val0 = input[keys[0]]
		if (!val0) continue
		if (Array.isArray(val0)){
			for (let j = 0, l = val0.length; j < l; j++){
				output.push(keys.reduce((acc, key) => {
					acc[key] = input[key][j]
					return acc
				}, {}))
			}
		}else{
			output.push(keys.reduce((acc, key) => {
				acc[key] = input[key]
				return acc
			}, {}))
		}
	}
	return output
}

module.exports = {
	setup: function(host, cfg, paths){
	},

	wait: async function(sec){
		await new Promise((resolve, reject) => {
			setTimeout(resolve, sec)
		})
		return this.next()
	},

	log: function(...args) {
		args.forEach(console.log)
		return this.next()
	},

	Input: (spec) => {
		return function(input, output, ext) {
			const error = pObj.validate(spec, input, output, ext)
			if (error) return this.next(`invalid params [${error}]`)
			return this.next()
		}
	},

	Input2(input, spec, output, ext) {
		const error = pObj.validate(spec, input, output, ext)
		if (error) return this.next(`invalid params [${error}]`)
		return this.next()
	},

	group(input, grouping, output){
		if (grouping && grouping.length){
			Object.assign(output, { group: groupQuery(input, grouping) }, input)
		} else {
			Object.assign(output, input)
		}
		return this.next()
	},
}
