module.exports = class ConnectopusModel {

	setConfig(config) {
		if(config) {
			this.config = config;
		}
	}

	getConnection(id) {
		let servers = this.config.servers;
		let folders = this.config.folders;
		if(servers) {
			for(let i in servers) {
				if(servers[i].id == id) {
					return servers[i];
				}
			}
		}
		if(folders) {
			for(let i in folders) {
				if(folders[i].servers) {
					for(let i2 in folders[i].servers) {
						if(folders[i].servers[i2].id == id) {
							return folders[i].servers[i2];
						}
					}
				}
			}
		}
	}
}