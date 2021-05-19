const Stripe = require('stripe')

module.exports = {
	setup(host, cfg, rsc, paths){
		return Stripe(cfg.secret)
	},
	async createSession(product, order, output){
		const session = await this.checkout.sessions.create({
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
			success_url: `${YOUR_DOMAIN}/success.html`,
			cancel_url: `${YOUR_DOMAIN}/cancel.html`,
		})
		Object.assign(output, session)
		return this.next()
	}
}
