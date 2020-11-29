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
	}
}
