/**
 * Timeout function
 *
 * @param {object} host - host object
 * @param {string} path - pipeline name
 * @param {number} interval- setTimeout interval
 * @returns {object} - timer handler
 */
function timeout(host, path, interval){
	host.go(path)
	return setTimeout(timeout, interval, host, path, interval)
}

module.exports = {
	setup(host, cfg, rsc, paths){
		paths.forEach(p => {
			if (!isFinite(p)) return
			const interval = parseInt(p)
			if (!interval) return

			setTimeout(timeout, interval, host, p, interval)
		})
	}
}
