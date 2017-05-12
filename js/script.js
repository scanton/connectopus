let enableContextMenu = require('./custom_modules/enableContextMenu.js');
enableContextMenu();

const tunnel = require('tunnel-ssh');
const mysql = require('mysql');

const HtmlRenderer = require('./custom_modules/HtmlRenderer.js');
var html = new HtmlRenderer();

$(document).on("click", ".server-list-group .server-name", function (evt) {
	let $parent = $(this).closest(".list-group-item");
	$parent.find(".server-details").slideToggle('slow');
	$parent.find(".shortcut-buttons").slideToggle('slow');
	$parent.find(".server-update-button").slideToggle('slow');
}).on("click", ".connect-to-db-shortcut-button", function(evt) {
	evt.preventDefault();
	let $this = $(this);
	let $li = $this.closest(".list-group-item");

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
		connection.query('show tables', function(error, results, fields) {
			if(error) {
				console.error(error);
			}
			$(".table-reference-column h4").show();
			$(".table-reference-column .database-name").html('<span class="glyphicon glyphicon-hdd"></span> ' + mySqlData.database);
			$(".table-reference-column .table-list").html(html.renderTables(results));
		});
		console.log(sshConn);
		connection.end();
	});
}).on("click", ".database-tables li", function(evt) {
	let $this = $(this);
	let $parent = $this.closest('.database-tables');
	$parent.find("li.selected").removeClass("selected");
	$this.addClass("selected");
}).on("click", ".server-folder", function(evt) {
	let $this = $(this);
	let $icon = $this.find(".glyphicon");
	if($icon.hasClass("glyphicon-folder-close")) {
		$icon.removeClass("glyphicon-folder-close");
		$icon.addClass("glyphicon-folder-open");
		$this.find("li").slideDown("fast");
	} else {
		$icon.removeClass("glyphicon-folder-open");
		$icon.addClass("glyphicon-folder-close");
		$this.find("li").slideUp("fast");
	}
});

$(document).ready(function() {
 	$.ajax('./working_files/config.json').done(function(data) {
 		if(data) {
 			let config = JSON.parse(data);
 			$(".server-list-left").html(html.renderServerReference(config));
 			$(".server-list").html(html.renderServers(config));
 		}
 	});

 	$(".nav .option-link").click(function(evt) {
 		evt.preventDefault();
 		let $this = $(this);
 		$(".nav .option-link.active").removeClass("active")
 		$this.addClass("active");
 		$(".option-link-container").slideUp("slow");
 		$("." + $this.attr("data-target")).slideDown("slow");
 	});

 	$(".include-partial").each(function() {
 		let $this = $(this);
 		let uri = $this.attr("data-target");
 		$this.load(uri);
 	});
});

