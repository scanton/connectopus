module.exports = class ConnectionManager {
	
	constructor() {
		this.connections = [];
		this.listeners = {};
		this.tunnel = require('tunnel-ssh');
		this.mysql = require('mysql');
	}

	addConnection(data) {
		console.log(data);
		var hasConnection = false;
		if(data) {
			for(let i in this.connections) {
				if(this.connections[i].id == data.id) {
					hasConnection = true;
					break;
				}
			}
		}
		if(!hasConnection) {
			this.conenctions.push(data);
			this.dispatchEvent("add-connection", this.connections);
			this.dispatchEvent("changed", this.connections);
		}
		return this.connections.length;
	}

	getConnection(id) {
		for(let i in this.connections) {
			if(this.connections[i].id == id) {
				return this.connections[i];
			}
		}
	}

	removeConnection(id) {
		for(let i in this.connections) {
			if(this.connections[i].id == id) {
				this.dispatchEvent("remove-connection", this.conenctions.splice(i, 1));
				this.dispatchEvent("changed", this.connections);
			}
		}
	}

	setConnectionStatus(id, status) {
		this.getConnection().status = status;
		this.dispatchEvent("changed", this.connections);
	}

	sqlRequest(id, query, callback, dbConnection = 0) {
		let conn = this.getConnection(id);
		if(conn && conn.connections[dbConnection]) {
			let dbConn = conn.connections[dbConnection];
			let mySqlData = {
				host: dbConn.host,
				user: dbConn.username,
				password: dbConn.password,
				database: dbConn.database
			}
			let sshData = {
				host: conn.host,
				port: conn.port,
				username: conn.username,
				password: conn.password,
				dstHost: 'localhost',
				dstPort: 3306
			}
			let sshCon = this.tunnel(sshData, function(error, server) {
				if(error) {
					console.error(error);
					this.dispatchEvent("ssh-error", error);
				}
				let connection = this.mysql.createConnection(mySqlData);
				connection.query(query, function(error, results, fields) {
					/**
					select * from information_schema.columns
					where table_schema = 'ww2lpspl_content'
					order by table_name,ordinal_position
					 **/
					if(error) {
						console.error(error);
						this.dispatchEvent("mysql-error", error);
					}
					callback(error, results, fields);
				});
				connection.end();
			});
		}
	}

	getConnections() {
		return this.connections;
	}

	getConnectionCount() {
		return this.connections.length;
	}

	addListener(eventName, handler) {
		if(eventName && handler) {
			if(!this.listeners[eventName]) {
				this.listeners[eventName] = [];
			}
			this.listeners[eventName].push(handler);
		}
	}

	dispatchEvent(eventName, data) {
		if(this.listeners[eventName]) {
			for(let i in this.listeners[eventName]) {
				this.listeners[eventName][i](data);
			}
		}
	}
}