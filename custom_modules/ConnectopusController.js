module.exports = class ConnectopusController {

	constructor(model, connectionManager) {
		this.model = model;
		this.connections = connectionManager;
		this.connections.addListener("add-directory", (data) => {
			console.log(this.connections.getDirectories());
		});
	}

	syncRows(rowIds) {
		console.log('Sync rows', rowIds);
		console.log(this.connections.getLastResult());
	}
}