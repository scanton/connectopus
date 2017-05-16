module.exports = class ConnectopusController {

	constructor(model) {
		if(!model) {
			console.error("No ConnectopusModel provided to ConnectopusController constructor.");
		}
		this.model = model;
	}
}