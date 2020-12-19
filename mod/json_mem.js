let KEY

/**
 * Collection class
 *
 * @param {object} host - host object
 * @param {object} meta - meta object
 * @param {object} rs - resource
 * @returns {object} - this
 */
function Collection(host, meta, rs){
	this.host = host
	this.index = 1
	this.documents = []
	this.meta = Object.assign({}, meta, rs.meta)
	this.schema = Object.assign({}, rs.schema)
}

Collection.prototype = {
	insert(d){
		const meta = {
			i: this.index++,
			s: 1,
			cby: 0,
			cat: new Date
		}
		this.documents.push(Object.assign({}, meta, {d}))
		return meta
	},
	select(q){
		const docs = this.documents
		if (!Array.isArray(q.csv)) return docs.slice()
		return q.csv.map(i => docs.find(item => i === item.i)).filter(item => item)
	},
	update(i, d){
		const doc = this.documents.find(item => i === item.i)
		if (!doc) return
		Object.assign(doc, {
			d,
			uby: 0,
			uat: new Date
		})
	},
	remove(i){
		for (let j = 0, d, docs = this.documents; (d = docs[j]); j++){
			if (i === d.i){
				d.s = 0
				break
			}
		}
	}
}

module.exports = {
	setup(host, cfg, rsc, paths){
		KEY = cfg.id
		const meta = cfg.meta
		return Object.keys(rsc).reduce((acc, name) => {
			const rs = rsc[name]
			if (!rs) return acc
			acc[name] = new Collection(host, meta, rs)
			return acc
		}, {})
	},
	set(name, i, input, output){
		const col = this[KEY][name]
		if (i){
			col.update(i, input)
			Object.assign(output, {i})
		}else{
			const res = col.insert(input)
			Object.assign(output, res)
		}
		return this.next()
	},
	get(name, id, output){
		const col = this[KEY][name]
		const res = col.select({index: 'i', csv: [id]})
		Object.assign(output, res[0])
		return this.next()
	},
	find(name, query, output){
		const col = this[KEY][name]
		output.push(...col.select(query))
		return this.next()
	},
	hide(name, id){
		const col = this[KEY][name]
		col.remove(id)
		return this.next()
	}
}
