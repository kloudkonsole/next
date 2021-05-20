const Stripe = require('stripe')

module.exports = {
	setup(host, cfg, rsc, paths){
		return {client:Stripe(cfg.secret), domain:cfg.domain}
	},
	async createSession(product, order, output){
		const stripe = this.ctx.client
		const domain = this.ctx.domain
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: [{
				price_data: {
					currency: 'usd',
					product_data: {
						name: 'Stubborn Attachments',
						images: ['https://i.imgur.com/EHyR2nP.png'],
					},
					unit_amount: 2000,
				},
				quantity: 1,
			}],
			mode: 'payment',
			success_url: `${domain}/success.html`,
			cancel_url: `${domain}/cancel.html`,
		})
		Object.assign(output, session)
		return this.next()
	}
}
