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
			this.conenctions.push(data);
		}
		this.dispatchEvent("add-connection", this.connections);
		return this.connections.length;
	}

	removeConnection(id) {
		for(let i in this.connections) {
			if(this.connections[i].id == id) {
				this.dispatchEvent("remove-connection", this.conenctions.splice(i, 1));
			}
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