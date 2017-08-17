module.exports = class ConnectionManager extends EventEmitter {
	
	constructor() {
		super();
		this.connectionIndex = 1;
		this.remoteTransferDetails = {};
		this.connections = [];
		this.tunnel = require('tunnel-ssh');
		this.mysql = require('mysql');
		this.Ssh2SftpClient = require('ssh2-sftp-client');
		this.sftp = new this.Ssh2SftpClient();
		this.hasPendingQueue = false;
		this.currentQueueItem;
		this.pendingQueue = [];
		this.queueResults = [];
		this.server = null;
		this.activeTableName = '';
		this.directories = [];
		this.paths = [];
		this.activePath = '';
		this.hasPendingSftpQueue = false;
		this.currentSftpQueueItem;
		this.pendingSftpQueue = [];
		this.sftpQueueResults = [];
	}

	addConnection(data, callback, defaultDirectory = 'www') {
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
			this.sftpRequestDirectory(data.id, defaultDirectory, function(list) {
				//console.log(list, 'list');
				/**
				 * This event is handled in ConnectopusController "add-directory" handler
				 **/
			});
		}
		return this.connections.length;
	}

	cacheCompare(connectionIndex, path, workingPath, callback, errorHandler) {
		var setConnectionStatus = this.setConnectionStatus.bind(this);
		if(connectionIndex && path) {
			this.sftp = new this.Ssh2SftpClient();
			var cons = this.getConnections();
			if(cons && cons[connectionIndex]) {
				var conn = cons[connectionIndex];
				var sshData = this._getSshData(conn);
				setConnectionStatus(conn.id, 'pending');
				this.sftp.connect(sshData).then(() => {
					this.sftp.get(path).then((stream) => {
						setConnectionStatus(this.getConnections()[connectionIndex].id, 'active');
						callback(stream, connectionIndex);
						var conn = this.getConnections()[0];
						var sshData = this._getSshData(conn);
						setConnectionStatus(conn.id, 'pending');
						this.sftp = new this.Ssh2SftpClient();
						this.sftp.connect(sshData).then(() => {
							this.sftp.get(path).then((stream) => {
								setConnectionStatus(conn.id, 'active');
								callback(stream, 0);
							});
						});
					});
				}).catch((err) => {
					setConnectionStatus(this.getConnections()[connectionIndex].id, "error");
					if(errorHandler) {
						errorHandler(err);
					}
				});
			}
		}
	}

	cacheFiles(fileList, completeCallback = null, progressCallback = null, errorHandler = null) {
		var setConnectionStatus = this.setConnectionStatus.bind(this);
		if(fileList && fileList.length) {
			this.sftp = new this.Ssh2SftpClient();
			var fileListLength = fileList.length;
			var filesLoaded = 0;
			var filesUploaded = 0;
			var currentConnection = 0;
			let cons = this.getConnections();
			if(cons && cons[currentConnection]) {
				var consLength = cons.length;
				let conn = cons[currentConnection];
				let sshData = this._getSshData(conn);
				setConnectionStatus(conn.id, 'pending');
				this.sftp.connect(sshData).then(() => {
					for(let i = 0; i < fileListLength; i++) {
						this.sftp.get(fileList[i], null, null).then((stream) => {
							filesLoaded++;
							progressCallback(stream, fileList[i]);
							if(filesLoaded == fileListLength) {
								setConnectionStatus(conn.id, 'active');
								completeCallback(fileList);
							}
						});
					}
				}).catch((err) => {
					setConnectionStatus(id, "error");
					if(errorHandler) {
						errorHandler(err);
					}
				});
			}
		}
	}

	close() {
		if(this.server && this.server.close) {
			this.server.close();
		}
	}

	compareDirectory(path, callback) {
		this.setActivePath(path);
		let queue = [];
		let cons = this.getConnections();
		let nextSftpQueue = this._nextSftpQueue.bind(this);
		for(let i in cons) {
			let c = cons[i];
			queue.push(this._createSftpQueueItem(c.id, path, nextSftpQueue));
		}
		this._processSftpQueue(queue, callback);
	}

	compareTables(tableName, callback, tableLimit, schema) {
		if(!Number.isInteger(Number(tableLimit))) {
			tableLimit = 100000;
		}
		this.activeTableName = tableName;
		let queue = [];
		let cons = this.getConnections();
		let query = ' SELECT * FROM ' + tableName + ' LIMIT ' + tableLimit; 
		if(schema) {
			let l = schema.length;
			let a = [];
			for(let i = 0; i < l; i++) {
				let field = schema[i];
				if(field.dataType == 'varchar' || field.dataType == 'text' || field.dataType == 'mediumtext') {
					a.push('CONVERT(BINARY CONVERT(' + field.columnName + ' USING latin1) USING utf8) as \'' + field.columnName + '\' ');
				} else {
					a.push(field.columnName);
				}
			}
			query = ' SELECT ' + a.join(", ") + ' FROM ' + tableName + ' LIMIT ' + tableLimit;
		}
		let nextQueue = this._nextQueue.bind(this);
		for(let i in cons) {
			let c = cons[i];
			queue.push(this._createQueueItem(c.id, query, nextQueue));
		}
		this._processQueue(queue, callback);
	}

	hasPath(path) {
		return this.paths.indexOf(path) > -1;
	}

	getActivePath() {
		return this.activePath;
	}

	getConnection(id) {
		for(let i in this.connections) {
			if(this.connections[i].id == id) {
				return this.connections[i];
			}
		}
	}

	getConnectionCount() {
		return this.connections.length;
	}

	getConnections() {
		return this.connections;
	}

	getLastResult() {
		return { name: this.activeTableName, data: this.queueResults };
	}

	getDirectories() {
		return this.directories;
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
	
	parseTables(data) {
		let a = [];
		for(let i in data) {
			for(let i2 in data[i]) {
				a.push(data[i][i2]);
			}
		}
		return a;
	}

	putRemoteFilesFromCache(workingPath, fileList, callback = null, errorHandler = null) {
		var handleFilePutComplete = this._handleFilePutComplete.bind(this);
		var handleFilePutProgress = this._handleFilePutProgress.bind(this);
		let connections = this.getConnections();
		let fileListLength = fileList.length;
		this.remoteTransferDetails = { workingPath: workingPath, fileList: fileList, callback: callback, errorHandler: errorHandler };
		if(connections.length > 1) {
			this.connectionIndex = 1;
			this._putFilesToConnection(connections[this.connectionIndex], workingPath, fileList, handleFilePutComplete, handleFilePutProgress, errorHandler);
		} else {
			if(callback) {
				callback("0 updates");
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

	setActivePath(path) {
		this.activePath = path;
		if(!this.hasPath(path)) {
			this.paths.push(path);
		}
		this.dispatchEvent("active-path-change", path);
	}

	setConnections(connections) {
		this.connections = connections;
		this.dispatchEvent("change", this.connections);
		return connections.length;
	}

	setConnectionStatus(id, status) {
		this.getConnection(id).status = status;
		this.dispatchEvent("change", this.connections);
	}

	sftpRequestDirectory(id, directory = 'www', callback = null, errorHandler = null) {
		var setConnectionStatus = this.setConnectionStatus.bind(this);
		this.sftp = new this.Ssh2SftpClient();
		this.setActivePath(directory);
		setConnectionStatus(id, 'pending');
		let conn = this.getConnection(id);
		let sshData = this._getSshData(conn);
		this.sftp.connect(sshData).then(() => {
			this.sftp.list(directory).then((data) => {
				setConnectionStatus(id, 'active');
				this._addDirectory(id, directory, data);
				callback(id, directory, data);
			});
		}).catch((err) => {
			setConnectionStatus(id, "error");
			if(errorHandler) {
				errorHandler(err);
			}
		});
	}

	sqlRequest(id, query, callback, dbConnection = 0) {
		let conn = this.getConnection(id);
		var mySqlClient = this.mysql;
		var dispatch = this.dispatchEvent;
		var setConnectionStatus = this.setConnectionStatus.bind(this);
		var convertDates = this._convertDates.bind(this);

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
				database: dbConn.database,
				timezone: 'utc',
				multipleStatements: true
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
					dispatchEvent("ssh-error", error);
					setConnectionStatus(id, "error");
				}
				let connection = mySqlClient.createConnection(mySqlData);
				connection.query(query, function(error, results, fields) {
					console.log("hit 6", error);
					/**
					select * from information_schema.columns
					where table_schema = 'ww2lpspl_content'
					order by table_name,ordinal_position
					 **/
					if(error) {
						console.error(error);
						dispatchEvent("mysql-error", error);
						setConnectionStatus(id, "error");
						throw error;
					} else {
						setConnectionStatus(id, 'active');
					}

					results = convertDates(results, fields);

					callback(error, results, fields);
					server.close();
				});
				connection.end();
			});
			this.server = sshCon;
		}
	}

	sqlSync(query, callback) {
		let queue = [];
		let cons = JSON.parse(JSON.stringify(this.getConnections()));
		cons.shift();
		let nextQueue = this._nextQueue.bind(this);
		for(let i in cons) {
			let c = cons[i];
			queue.push(this._createQueueItem(c.id, query, nextQueue));
		}
		this._processQueue(queue, callback);

	}

	/**
	 * Private Methods
	 **/

	_addDirectory(id, directory, data) {
		let dataItem = null;
		let l = this.directories.length;
		let i;
		for(i = 0; i < l; i++) {
			if(this.directories[i].id == id) {
				dataItem = this.directories[i];
			}
		}
		if(dataItem == null) {
			dataItem = {id: id, directory: []};
			this.directories.push(dataItem);
		}
		l = dataItem.directory.length;
		let hasDirectory = false;
		for(i = 0; i < l; i++) {
			if(dataItem.directory[i].path == directory) {
				dataItem.directory[i].listing = data.sort(this._sortByName);
				hasDirectory = true;
				break;
			}
		}
		if(!hasDirectory) {
			dataItem.directory.push({ path: directory, listing: data.sort(this._sortByName) });
		}
		dataItem.directory.sort(this._sortByPath);

		this.dispatchEvent("add-directory", {id: id, directory: directory, data: data});
	}

	_convertDates(results, fields) {
		let l = fields.length;
		while(l--) {
			if(fields[l].type == 12) {
				let l2 = results.length;
				let name = fields[l].name;
				while(l2--) {
					results[l2][name] = this._convertLocalTimestampToMySql(results[l2][name]);
				}
			}
		}
		return results;
	}
	_convertLocalTimestampToMySql(stamp) {
		let d = new Date(stamp);
		if(d == 'Invalid Date') {
			return stamp;
		}
		let twoDigits = (d) => {
			if(0 <= d && d < 10) return "0" + d.toString();
			if(-10 < d && d < 0) return "-0" + (-1*d).toString();
			return d.toString();
		}
		return d.getUTCFullYear() + "-" + twoDigits(1 + d.getUTCMonth()) + "-" + twoDigits(d.getUTCDate()) + " " + twoDigits(d.getUTCHours()) + ":" + twoDigits(d.getUTCMinutes()) + ":" + twoDigits(d.getUTCSeconds());
	}

	_createQueueItem(id, query, callback, dbConnection = 0) {
		return { id: id, query: query, callback: callback, dbConnection: dbConnection };
	}

	_createSftpQueueItem(id, path, callback) {
		return { id: id, path: path, callback: callback };
	}

	_getSshData(conn) {
		return {
			host: conn.host,
			port: conn.port,
			username: conn.username,
			password: conn.password
		};
	}

	_handleFilePutComplete(data) {
		var handleFilePutComplete = this._handleFilePutComplete.bind(this);
		var handleFilePutProgress = this._handleFilePutProgress.bind(this);

		//console.log("on-file-put-complete", data);

		let connections = this.getConnections();
		++this.connectionIndex;
		if(connections.length > this.connectionIndex) {
			this._putFilesToConnection(connections[this.connectionIndex], this.remoteTransferDetails.workingPath, this.remoteTransferDetails.fileList, handleFilePutComplete, handleFilePutProgress, this.remoteTransferDetails.errorHandler);
		} else {
			//$(".modal-overlay").fadeIn("fast");
			this.compareDirectory(this.getActivePath(), function(data) {
				//$(".modal-overlay").fadeOut("fast");
				//dispatch complete event?
				$(".modal-overlay").fadeOut("fast");
			});
		}
	}

	_handleFilePutProgress() {
		console.log("file-progress");
	}

	_nextQueue(error, results, fields) {
		//this.currentQueueItem;
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

	_nextSftpQueue(id, directory, data) {
		this.sftpQueueResults.push({id: id, directory: directory, data: data});
		if(this.pendingSftpQueue.length) {
			let q = this.currentSftpQueueItem = this.pendingSftpQueue.shift();
			this.sftpRequestDirectory(q.id, q.path, q.callback);
			this.dispatchEvent("sftp-queue-progress", this.pendingSftpQueue);
		} else {
			this.dispatchEvent("sftp-queue-complete", this.sftpQueueResults);
			this.sftpQueueCallback(this.sftpQueueResults);
		}
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

	_processSftpQueue(queue, callback) {
		if(queue && queue.length) {
			this.sftpQueueCallback = callback;
			this.sftpQueueResults = [];
			this.pendingSftpQueue = queue;
			this.dispatchEvent("sftp-queue-begin", queue);
			let q = this.currentSftpQueueItem = this.pendingSftpQueue.shift();
			this.sftpRequestDirectory(q.id, q.path, q.callback);
		}
	}

	_putFilesToConnection(currentConnection, workingPath, fileList, callback, progressCallback, errorHandler = null) {
		var setConnectionStatus = this.setConnectionStatus.bind(this);
		var filesUploaded = 0;
		let sshData = this._getSshData(currentConnection);
		let fileListLength = fileList.length;
		setConnectionStatus(currentConnection.id, 'pending');
		this.sftp = new this.Ssh2SftpClient();
		this.sftp.connect(sshData).then(() => {
			for(let i = 0; i < fileListLength; i++) {
				this.sftp.put(workingPath + fileList[i], fileList[i]).then((stream) => {
					filesUploaded++;
					progressCallback(stream, fileList[i]);
					if(filesUploaded == fileListLength) {
						setConnectionStatus(currentConnection.id, 'active');
						callback(currentConnection.id);
					}
				});
			}
		});
	}

	_sortByName(a, b) {
		if(a.name.toLowerCase() > b.name.toLowerCase()) {
			return 1;
		} else if(a.name.toLowerCase() < b.name.toLowerCase()) {
			return -1;
		}
		return 0;
	}
	_sortByPath(a, b) {
		if(a.path.toLowerCase() > b.path.toLowerCase()) {
			return 1;
		} else if(a.path.toLowerCase() < b.path.toLowerCase()) {
			return -1;
		}
		return 0;
	}

}