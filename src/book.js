const fs = require('fs')
const path = require('path')
const pObj = require('pico-common').export('pico/obj')
const symPath = process.argv[1]

const fopt = {encoding: 'utf8'}
const EXT = '.json'

let CWD

/**
 * @param cb
 */
function getWD(cb){
	if (CWD) return cb(CWD)
	fs.readlink(symPath, (err, realPath) => {
		if (err) realPath = symPath
		CWD = path.dirname(realPath)
		cb(CWD)
	})
}

/**
 * @param wd
 * @param file
 */
function getPath(wd, file){
	return path.resolve(wd, file) + EXT
}

/**
 * @param wd
 * @param fnames
 * @param list
 * @param cb
 */
function readPages(wd, fnames, list, cb){
	if (!fnames.length) return cb(null, list)

	fs.readFile(getPath(wd, fnames.shift()), fopt, (err, json) => {
		if (err) return cb(err)
		list.push(JSON.parse(json))
		readPages(wd, fnames, list, cb)
	})
}

/**
 * @param wd
 * @param index
 * @param cb
 */
function readBook(wd, index, cb){
	readPages(wd, [index], [], (err, res) => {
		if (err) return cb(err)
		if (!res.length) return cb(`not found: ${index}`)
		readPages(wd, res[0], [], cb)
	})
}

module.exports = {
	open(bname, cb){
		getWD(cwd => {
			const bpath = path.resolve(cwd, bname)
			const wd = path.dirname(bpath)
			const name = path.basename(bpath)
			readBook(wd, name, (err, book) => {
				if (err) return cb(err)
				cb(null, pObj.extends({}, book))
			})
		})
	}
}
