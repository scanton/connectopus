module.exports = class ConnectionManager {
	
	constructor() {
		this.connections = [];
		this.listeners = {};
		this.tunnel = require('tunnel-ssh');
		this.mysql = require('mysql');
		let Ssh2SftpClient = require('ssh2-sftp-client');
		this.sftp = new Ssh2SftpClient();
		this.hasPendingQueue = false;
		this.currentQueueItem;
		this.pendingQueue = [];
		this.queueResults = [];
		this.server = null;
	}

	addConnection(data, callback) {
		var hasConnection = false;
		if(data) {
			for(let i in this.connections) {
				if(this.connections[i].id == data.id) {
					hasConnection = true;
					callback();
					break;
				}
			}
		}
		if(!hasConnection) {
			let setConnectionStatus = this.setConnectionStatus.bind(this);
			let parseTables = this.parseTables.bind(this);
			let parseSchema = this.parseSchema.bind(this);
			data.status = 'pending';
			this.connections.push(data);
			this.dispatchEvent("add-connection", this.connections);
			this.dispatchEvent("change", this.connections);
			//let query = "SELECT * from information_schema.columns WHERE table_schema = '" + data.connections[0].database + "' ORDER BY table_name,ordinal_position";
			let query = 'show tables';
			query = 'select * from information_schema.columns WHERE table_schema = \'' + data.connections[0].database + '\' ORDER BY table_name, ordinal_position';
			this.sqlRequest(data.id, query, function(error, results, fields) {
				if(results) {
					data.tables = parseSchema(results);
					setConnectionStatus(data.id, "active");
				}
				if(error) {
					setConnectionStatus(data.id, "error");
					console.error(error);
				}
				callback(results);
			});
			this.sftpRequestDirectory(data.id, 'www', function(list) {
				console.log(list, 'list');
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

	makeMaster(id) {
		let cons = this.getConnections();
		for(let i in cons) {
			if(cons[i].id == id) {
				let a = cons.splice(i, 1);
				for(let i in cons) {
					a.push(cons[i]);
				}
				return this.setConnections(a);
			}
		}
	}

	compareTables(tableName, callback) {
		let queue = [];
		let cons = this.getConnections();
		let query = ' SELECT * FROM ' + tableName + ' LIMIT 100000 '; 
		let nextQueue = this._nextQueue.bind(this);
		for(let i in cons) {
			let c = cons[i];
			queue.push(this._createQueueItem(c.id, query, nextQueue));
		}
		this._processQueue(queue, callback);
	}

	sftpRequestDirectory(id, directory = 'www', callback = null, errorHandler = null) {
		let conn = this.getConnection(id);
		let sshData = {
			host: conn.host,
			port: conn.port,
			username: conn.username,
			password: conn.password
		}
		this.sftp.connect(sshData).then(() => {
			this.sftp.list(directory);
		}).then((evt, data) => {
			if(data) {
				callback(data);
			}
		}).catch((err) => {
			if(errorHandler) {
				errorHandler(err);
			}
		});
		/*
		let SftpClient = require('ssh2').Client;
		let client = new SftpClient();
		if(!callback) {
			callback = function(err, list) {
				if(err) {
					throw err;
				}
				console.dir(list);
			}
		}
		let conn = this.getConnection(id);
		let sshData = {
			host: conn.host,
			port: conn.port,
			username: conn.username,
			password: conn.password
		}
		client.on("ready", function() {
			client.sftp(function(err, sftp) {
				sftp.readdir(directory, callback);
			});
		}).connect(sshData);
		*/
	}

	sqlRequest(id, query, callback, dbConnection = 0) {
		let conn = this.getConnection(id);
		var mySqlClient = this.mysql;
		var dispatch = this.dispatchEvent;
		var setConnectionStatus = this.setConnectionStatus.bind(this);

		var setServer = (function(context) {
			return function(server) {
				context.server = server;
			}
		})(this);

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
				setServer(server);
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
					} else {
						setConnectionStatus(id, 'active');
					}
					callback(error, results, fields);
					server.close();
				});
				connection.end();
			});
			this.server = sshCon;
		}
	}

	getConnections() {
		return this.connections;
	}

	setConnections(connections) {
		this.connections = connections;
		this.dispatchEvent("change", this.connections);
		return connections.length;
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

	parseSchema(schema) {
		if(schema && schema.length) {
			let o = {
				names: [],
				schema: {}
			};
			for(let i in schema) {
				let table = schema[i];
				if(o.names.indexOf(table.TABLE_NAME) == -1) {
					o.names.push(table.TABLE_NAME);
					o.schema[table.TABLE_NAME] = [];
				}
				let a = o.schema[table.TABLE_NAME];
				a.push({
					columnName: table.COLUMN_NAME,
					columnType: table.COLUMN_TYPE,
					dataType: table.DATA_TYPE,
					isNullable: table.IS_NULLABLE !== 'NO',
				});
			}
			return o;
		}
	}

	close() {
		if(this.server && this.server.close) {
			this.server.close();
		}
	}

	_createQueueItem(id, query, callback, dbConnection = 0) {
		return { id: id, query: query, callback: callback, dbConnection: dbConnection };
	}

	_processQueue(queue, callback) {
		if(queue && queue.length) {
			this.queueCallback = callback;
			this.queueResults = [];
			this.pendingQueue = queue;
			this.dispatchEvent("queue-begin", queue);
			let q = this.currentQueueItem = this.pendingQueue.shift();
			this.sqlRequest(q.id, q.query, q.callback, q.dbConnection);
		}
	}

	_nextQueue(error, results, fields) {
		this.currentQueueItem;
		this.queueResults.push({id: this.currentQueueItem.id, results: results, error: error, fields: fields});
		if(this.pendingQueue.length) {
			let q = this.currentQueueItem = this.pendingQueue.shift();
			this.sqlRequest(q.id, q.query, q.callback, q.dbConnection);
			this.dispatchEvent("queue-progress", this.pendingQueue);
		} else {
			this.dispatchEvent("queue-complete", this.queueResults);
			this.queueCallback(this.queueResults);
		}
	}
}