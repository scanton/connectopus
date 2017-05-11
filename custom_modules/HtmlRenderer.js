module.exports = class HtmlRenderer {

	renderMysqlDetails(data) {
		var s = '';
		if(data) {
			s += '<div class="col-xs-12 col-sm-6 col-lg-4">';
			s += '<div class="panel panel-default">';
			s += '<div class="panel-heading"><h4 class="panel-title">' + data.name + '</h4></div>';
			s += '<div class="panel-body">';

			s += '<div class="input-group"><span class="input-group-addon">Host</span><input type="text" name="mysql-host" value="' + data.host + '" /></div>';
			s += '<div class="input-group"><span class="input-group-addon">Database Name</span><input type="text" name="mysql-database" value="' + data.database + '" /></div>';
			s += '<div class="input-group"><span class="input-group-addon">Userame</span><input type="text" name="mysql-username" value="' + data.username + '" /></div>';
			s += '<div class="input-group"><span class="input-group-addon">Password</span><input type="password" name="mysql-password" value="' + data.password + '" /></div>';
			s += '<button class="btn btn-default pull-right connect-to-db-button" type="submit">Connect</button>';
			s += '</div></div></div>';
		}
		return s;
	}

	renderServers(data) {
	 	var s = '';
	 	if(data.servers) {
	 		var servers = data.servers;
	 		s += '<ul class="list-group server-list-group">';
	 		for(var i in servers) {
	 			var server = servers[i];
	 			if(server) {
	 				s += '<li class="list-group-item"><span class="server-name">' + server.name + '</span>';
	 				s += '<div class="shortcut-buttons">' + this.renderShortcuts(server.connections) + '</div>';
	 				s += '<span class="badge">' + server.connections.length + '</span>';
	 				s += '<div class="server-details" style="display: none;">';
	 				s += this.renderServerDetails(server);
	 				s += '</div><button class="btn btn-default server-update-button pull-right" style="display: none;">Update Server Data</button><div class="clear-fix"></div></li>';
	 			}
	 		}
	 		s += '</ul>';
	 	}
	 	return s;
	}

	renderServerDetails(data) {
		var s = '';
		if(data) {
			s += '<div class="input-group"><span class="input-group-addon">Host</span><input type="text" name="ssh-host" value="' + data.host + '" /></div>';
			s += '<div class="input-group"><span class="input-group-addon">Port</span><input type="text" name="ssh-port" value="' + data.port + '" /></div>';
			s += '<div class="input-group"><span class="input-group-addon">Username</span><input type="text" name="ssh-username" value="' + data.username + '" /></div>';
			s += '<div class="input-group"><span class="input-group-addon">Password</span><input type="password" name="ssh-password" value="' + data.password + '" /></div>';
			if(data.connections) {
				s += '<div class="panel panel-default">';
				s += '<div class="panel-heading"><h3 class="panel-title">Database Connections</h3></div>';
				s += '<div class="panel-body">';
				for(var i in data.connections) {
					s+= this.renderMysqlDetails(data.connections[i]);
				}
				s += '</div></div>';
			}
		}
		return s;
	}
	
	renderShortcuts(data) {
		var s = '';
		for(let i in data) {
			if(data[i] && data[i].name) {
				s += '<button class="btn btn-default shortcut-button connect-to-db-shortcut-button" data-db="' + data[i].database + '">' + data[i].name + '</button>';
			}
		}
		return s;
	}

	renderTables(data) {
		var s = '<ul class="database-tables">';
		for(let i in data) {
			for(let i2 in data[i]) {
				s += '<li><span class="glyphicon glyphicon-list-alt"></span> ' + data[i][i2] + '</li>';
			}
		}
		return s + '</div>';
	}
}