return {
router: rsc => async function(method, params) {
    const rs = rsc[params.rsc]
    if (!rs) return this.next(`unsupprted key: ${params.rsc}`)
    const indi = params.id ? '/id' : ''
    const name = `${method}/rsc${indi}`
    await this.next(null, name, Object.assign({
        params,
        rs
    }, this.data))
    return this.next()
},
}
