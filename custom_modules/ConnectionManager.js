module.exports = class ConnectionManager {
	
	constructor() {
		this.connections = [];
		this.listeners = {};
		this.tunnel = require('tunnel-ssh');
		this.mysql = require('mysql');
	}

	addConnection(data) {
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
			let setConnectionStatus = this.setConnectionStatus.bind(this);
			let parseTables = this.parseTables.bind(this);
			data.status = 'pending';
			this.connections.push(data);
			this.dispatchEvent("add-connection", this.connections);
			this.dispatchEvent("change", this.connections);
			//let query = "SELECT * from information_schema.columns WHERE table_schema = '" + data.connections[0].database + "' ORDER BY table_name,ordinal_position";
			let query = 'show tables';
			this.sqlRequest(data.id, query, function(error, results, fields) {
				if(results) {
					data.tables = parseTables(results);
					setConnectionStatus(data.id, "active");
				}
				if(error) {
					setConnectionStatus(data.id, "error");
					console.error(error);
				}
			});
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
				this.dispatchEvent("remove-connection", this.connections.splice(i, 1));
				this.dispatchEvent("change", this.connections);
			}
		}
	}

	setConnectionStatus(id, status) {
		this.getConnection(id).status = status;
		this.dispatchEvent("change", this.connections);
	}

	sqlRequest(id, query, callback, dbConnection = 0) {
		let conn = this.getConnection(id);
		var mySqlClient = this.mysql;
		var dispatch = this.dispatchEvent;
		var setConnectionStatus = this.setConnectionStatus.bind(this);
		setConnectionStatus(id, 'pending');
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
					dispatch("ssh-error", error);
					setConnectionStatus(id, "error");
				}
				let connection = mySqlClient.createConnection(mySqlData);
				connection.query(query, function(error, results, fields) {
					/**
					select * from information_schema.columns
					where table_schema = 'ww2lpspl_content'
					order by table_name,ordinal_position
					 **/
					if(error) {
						console.error(error);
						dispatch("mysql-error", error);
						setConnectionStatus(id, "error");
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

	parseTables(data) {
		let a = [];
		for(let i in data) {
			for(let i2 in data[i]) {
				a.push(data[i][i2]);
			}
		}
		return a;
	}
}