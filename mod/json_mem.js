/**
 *
 */
function JSONDOC(){
}

JSONDOC.prototype = {
}

/**
 * @param cfg
 */
function JSONCOL(cfg){
}

JSONCOL.prototype = {

}

module.exports = {
	setup(host, cfg, paths){
		return new JSONCOL(cfg)
	}
}
