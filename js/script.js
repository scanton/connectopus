const tunnel = require('tunnel-ssh');
const mysql = require('mysql');

const config = require('./working_files/config.js');

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

 $(document).ready(function() {
 	$(".include-partial").each(function() {
 		var $this = $(this);
 		var uri = $this.attr("data-target");
 		$this.load(uri);
 	});
 });