const tunnel = require('tunnel-ssh');
const mysql = require('mysql');

const remote = require('electron').remote;
const {Menu, MenuItem} = remote;

const menu = new Menu()
const menuItem = new MenuItem({
	label: 'Inspect Element',
	click: () => {
		remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y);
	}
})
menu.append(menuItem);

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

const HtmlRenderer = require('./custom_modules/HtmlRenderer.js');

$(document).on("click", ".server-list-group .server-name", function (evt) {
	let $parent = $(this).closest(".list-group-item");
	$parent.find(".server-details").slideToggle('slow');
	$parent.find(".shortcut-buttons").slideToggle('slow');
	$parent.find(".server-update-button").slideToggle('slow');
}).on("click", ".connect-to-db-shortcut-button", function(evt) {
	evt.preventDefault();

}).on("click", ".connect-to-db-button", function(evt) {
	evt.preventDefault();
	$li = $(this).closest("li");
	$panel = $(this).closest(".panel");
	let mySqlData = {
		host: $panel.find("input[name='mysql-host']").val(),
		user: $panel.find("input[name='mysql-username']").val(),
		password: $panel.find("input[name='mysql-password']").val(),
		database: $panel.find("input[name='mysql-database']").val()
	}
	let sshData = {
		host: $li.find("input[name='ssh-host']").val(),
		port: $li.find("input[name='ssh-port']").val(),
		username: $li.find("input[name='ssh-username']").val(),
		password: $li.find("input[name='ssh-password']").val(),
		dstHost: 'localhost',
		dstPort: 3306
	}
	let sshConn = tunnel(sshData, function(error, server) {
		if(error) {
			console.error(error);
		}
		let connection = mysql.createConnection(mySqlData);
		connection.connect();
		connection.query('SELECT * FROM admins', function(error, results, fields) {
			if(error) {
				console.error(error);
			}
			console.log(results);
		});
		connection.end();
	});
});

$(document).ready(function() {
	var html = new HtmlRenderer();
 	$.ajax('./working_files/config.json').done(function(data) {
 		if(data) {
 			config = JSON.parse(data);
 			$(".server-list").html(html.renderServers(config));
 		}
 	});

 	$(".include-partial").each(function() {
 		let $this = $(this);
 		let uri = $this.attr("data-target");
 		$this.load(uri);
 	});
});

