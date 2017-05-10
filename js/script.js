const tunnel = require('tunnel-ssh');
const mysql = require('mysql');

const remote = require('electron').remote;
const {Menu, MenuItem} = remote;

const menu = new Menu()
const menuItem = new MenuItem({
	label: 'Inspect Element',
	click: () => {
		remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y)
	}
})
menu.append(menuItem)

window.addEventListener('contextmenu', (e) => {
	e.preventDefault()
	rightClickPosition = {x: e.x, y: e.y}
	menu.popup(remote.getCurrentWindow())
}, false)

var config = {};

//const config = require('./working_files/config.js');

/** config.js (example)
module.exports = {
	servers: [
		{
			name: 'Server Name',
			host: '<server url>.com',
			port: 80,
			username: '<username>',
			password: '<password>',
			connections: [
				{
					name: 'MySQL on <Server Name>',
					type: 'MySQL',
					host: 'localhost',
					database: '<db name>',
					username: '<db user>',
					password: '<db password>'
				}
			]
		}
	]
}
 **/
var renderShortcuts = function(data) {
	var s = '';
	for(var i in data) {
		if(data[i] && data[i].name) {
			s += '<button class="btn btn-default shortcut-button connect-to-db-shortcut-button" data-db="' + data[i].database + '">' + data[i].name + '</button>';
		}
	}
	return s;
}

var renderMysqlDetails = function(data) {
	var s = '';
	if(data) {
		s += '<div class="col-xs-6">';
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

var renderServerDetails = function(data) {
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
				s+= renderMysqlDetails(data.connections[i]);
			}
			s += '</div></div>';
		}
	}
	return s;
}

var renderServers = function(data) {
 	var s = '';
 	if(data.servers) {
 		var servers = data.servers;
 		s += '<ul class="list-group server-list-group">';
 		for(var i in servers) {
 			var server = servers[i];
 			if(server) {
 				s += '<li class="list-group-item"><span class="server-name">' + server.name + '</span>';
 				s += '<div class="shortcut-buttons">' + renderShortcuts(server.connections) + '</div>';
 				s += '<span class="badge">' + server.connections.length + '</span>';
 				s += '<div class="server-details" style="display: none;">';
 				s += renderServerDetails(server);
 				s += '</div><button class="btn btn-default server-update-button pull-right" style="display: none;">Update Server Data</button><div class="clear-fix"></div></li>';
 			}
 		}
 		s += '</ul>';
 	}
 	return s;
}

$(document).on("click", ".server-list-group .server-name", function (evt) {
	var $parent = $(this).closest(".list-group-item");
	$parent.find(".server-details").toggle('slow');
	$parent.find(".shortcut-buttons").toggle('slow');
	$parent.find(".server-update-button").toggle('slow');
}).on("click", ".connect-to-db-shortcut-button", function(evt) {
	evt.preventDefault();

}).on("click", ".connect-to-db-button", function(evt) {
	evt.preventDefault();
	$li = $(this).closest("li");
	$panel = $(this).closest(".panel");
	console.log($panel);
	var mySqlData = {
		host: $panel.find("input[name='mysql-host']").val(),
		user: $panel.find("input[name='mysql-username']").val(),
		password: $panel.find("input[name='mysql-password']").val(),
		database: $panel.find("input[name='mysql-database']").val()
	}
	var sshData = {
		host: $li.find("input[name='ssh-host']").val(),
		port: $li.find("input[name='ssh-port']").val(),
		username: $li.find("input[name='ssh-username']").val(),
		password: $li.find("input[name='ssh-password']").val(),
		dstHost: 'localhost',
		dstPort: 3306
	}
	tunnel(sshData, function(error, server) {
		console.log(mySqlData);
		var connection = mysql.createConnection(mySqlData);
		connection.connect();
		connection.query('SELECT * FROM admins', function(error, results, fields) {
			console.log(error);
			console.log(results);
			console.log(fields);
		});
		connection.end();
	});
});

$(document).ready(function() {
 	$.ajax('./working_files/config.json').done(function(data) {
 		if(data) {
 			config = JSON.parse(data);
 			$(".server-list").html(renderServers(config));
 		}
 	});

 	$(".include-partial").each(function() {
 		var $this = $(this);
 		var uri = $this.attr("data-target");
 		$this.load(uri);
 	});
 });

