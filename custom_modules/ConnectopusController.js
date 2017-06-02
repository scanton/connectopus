module.exports = class ConnectopusController {

	constructor(model, connectionManager, htmlRenderer) {
		this.model = model;
		this.connections = connectionManager;
		this.html = htmlRenderer;
		this.connections.addListener("add-directory", (data) => {
			$(".sftp-tree-view").html(this.html.renderDirectories(this.connections.getDirectories()));
		});
	}

	syncRows(rowIds) {
		console.log('Sync rows', rowIds);
		console.log(this.connections.getLastResult());
	}
}