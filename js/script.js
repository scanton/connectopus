const tunnel = require('tunnel-ssh');
const mysql = require('mysql');

var config = {};

//const config = require('./working_files/config.js');

/** config.js (example)
module.exports = {
	servers: [
		{
			name: 'Server Name',
			server: '<server url>.com',
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
var renderMysqlDetails = function(data) {
	var s = '';

	return s;
}

var renderServerDetails = function(data) {
	var s = '';
	if(data) {
		s += '<div class="input-group"><span class="input-group-addon">Server</span><input type="text" value="' + data.server + '" /></div>';
		s += '<div class="input-group"><span class="input-group-addon">Port</span><input type="text" value="' + data.port + '" /></div>';
		s += '<div class="input-group"><span class="input-group-addon">Username</span><input type="text" value="' + data.username + '" /></div>';
		s += '<div class="input-group"><span class="input-group-addon">Password</span><input type="text" value="' + data.password + '" /></div>';
		if(data.connections) {
			for(var i in data.connections) {
				s+= renderMysqlDetails(data.connections[i]);
			}
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
 				s += '<li class="list-group-item">' + server.name + '<span class="badge">' + server.connections.length + '</span>';
 				s += '<div class="server-details" style="display: none;">';
 				s += renderServerDetails(server);
 				s += '</div></li>';
 			}
 		}
 		s += '</ul>';
 	}
 	return s;
}
$(document).on("click", ".server-list-group .list-group-item", function (evt) {
	var $this = $(this);
	$this.find(".server-details").toggle('slow');
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

