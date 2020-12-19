const pObj = require('pico-common').export('pico/obj')

/**
 * group object's array to array objects
 *
 * @param {object} input - parsed querystring
 * @param {array} grouping - keys to be group
 * @param {array} output - output array
 * @returns {array} - output array
 */
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
	setup(host, cfg, rsc, paths){
	},

	async wait(sec){
		await new Promise((resolve, reject) => {
			setTimeout(resolve, sec)
		})
		return this.next()
	},

	log(...args) {
		// eslint-disable-next-line no-console
		for (const a of args){
			console.log(a)
		}
		return this.next()
	},

	input: spec => function(input, output, ext) {
		const error = pObj.validate(spec, input, output, ext)
		if (error) return this.next(`invalid params [${error}]`)
		return this.next()
	},

	input2(input, spec, output, ext) {
		const error = pObj.validate(spec, input, output, ext)
		if (error) return this.next(`invalid params [${error}]`)
		return this.next()
	},

	group(input, grouping, output){
		if (Array.isArray(grouping) && grouping.length){
			Object.assign(output, {group: groupQuery(input, grouping)}, input)
		} else {
			Object.assign(output, input)
		}
		return this.next()
	},

	extend(...args){
		const output = args.pop()
		pObj.extends(output, args)
		return this.next()
	},

	push(item, array){
		array.push(item)
		return this.next()
	}
}
