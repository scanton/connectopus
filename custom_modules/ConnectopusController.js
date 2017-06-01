module.exports = class ConnectopusController {

	constructor(model, connectionManager) {
		this.model = model;
		this.connections = connectionManager;
	}

	syncRows(rowIds) {
		console.log('Sync rows', rowIds);
		console.log(this.connections.getLastResult());
	}
}