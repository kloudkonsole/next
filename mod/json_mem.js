let KEY

/**
 * @param host
 * @param meta
 * @param rc
 */
function Collection(host, meta, rc){
	this.host = host
	this.index = 1
	this.documents = []
	this.meta = Object.assign({}, meta, rc.meta)
	this.schema = Object.assign({}, rc.schema)
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
				docs.splice(i, 1)
				break
			}
		}
	}
}

module.exports = {
	setup(host, cfg, rcs, paths){
		KEY = cfg.id
		const meta = cfg.meta
		return Object.keys(rcs).reduce((acc, name) => {
			const rc = rcs[name]
			if (!rc) return acc
			acc[name] = new Collection(host, meta, rc)
			return acc
		}, {})
	},
	set(name, input, id, output){
		const col = this[KEY][name]
		if (id){
			col.update(id, input)
		}else{
			id = col.insert(input)
		}
		Object.assign({id})
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
		col.update(id, {s: 0})
		return this.next()
	}
}
