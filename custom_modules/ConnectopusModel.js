module.exports = class ConnectopusModel {

	constructor(config = {}) {
		this.md5 = require('md5');
		this.config = config;
		this._processConfig();
	}

	setConfig(config = {}) {
		this.config = config;
		this._processConfig();
	}

	getConfig() {
		return this.config;
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

	removeServerFromConfig(id) {
		let serverFound = false;
		if(id) {
			if(this.config.servers && this.config.servers.length) {
				
				let sl = this.config.servers.length;
				for(let i = 0; i < sl; i++) {
					let svr = this.config.servers[i];
					if(svr && svr.id == id) {
						this.config.servers.splice(i, 1);
						serverFound = true;
						break;
					}
				}
				if(!serverFound) {
					if(this.config.folders && this.config.folders.length) {
						let fl = this.config.folders.length;
						for(let i = 0; i < fl; i++) {
							let fldr = this.config.folders[i];
							if(fldr && fldr.servers && fldr.servers.length) {
								let fsl = fldr.servers.length;
								for(let j = 0; j < fsl; j++) {
									let svr = fldr.servers[j];
									if(svr && svr.id == id) {
										this.config.folders[i].servers.splice(j, 1);
										serverFound == true;
										break;
									}
								}
							}
						}
					}
				}
			}
		}
		return serverFound;
	}

	_processConfig() {
		let c = this.getConfig();
		if(c.servers && c.servers.length) {
			this._includeIds(c.servers);
		}
		if(c.folders && c.folders.length) {
			for(let i in c.folders) {
				let f = c.folders[i];
				if(f.servers && f.servers.length) {
					this._includeIds(f.servers);
				}
			}
		}
	}
	_includeIds(serverList) {
		if(serverList && serverList.length) {
			for(let i in serverList) {
				let srv = serverList[i];
				if(!srv.id) {
					srv.id = this.md5(srv.host + String(srv.port) + srv.username + srv.password);
				}
			}
		}
	}
}