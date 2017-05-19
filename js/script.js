window.onerror = function(errorMsg, url, lineNumber) {
	console.log("Error occured: " + errorMsg);
	
	$(".server-status.pending").removeClass("pending").addClass("error");
	$(".modal-overlay").fadeOut("fast");

	return false;
}

let enableContextMenu = require('./custom_modules/enableContextMenu.js');
enableContextMenu();

const DataUtils = require('./custom_modules/DataUtils.js');

const ConnectopusModel = require('./custom_modules/ConnectopusModel.js');
const model = new ConnectopusModel();

const ConnectionManager = require('./custom_modules/ConnectionManager.js');
const connections = new ConnectionManager();

const ActiveConnectionViewController = require('./custom_modules/ActiveConnectionsViewController.js');

const HtmlRenderer = require('./custom_modules/HtmlRenderer.js');
var html = new HtmlRenderer();

$(document).on("click", ".server-list-group .server-name", function (evt) {
	evt.preventDefault();
	let $parent = $(this).closest(".list-group-item");
	$parent.find(".server-details").slideToggle('fast');
	$parent.find(".shortcut-buttons").slideToggle('fast');
	$parent.find(".server-update-button").slideToggle('fast');

}).on("click", ".connect-to-db-shortcut-button", function(evt) {
	evt.preventDefault();
	let $this = $(this);
	let $li = $this.closest(".list-group-item");

}).on("click", ".connect-to-db-button", function(evt) {
	evt.preventDefault();
	let id = $(this).closest("li").attr("data-id");
	$(".modal-overlay").fadeIn("fast");
	if(id) {
		connections.addConnection(model.getConnection(id), function(data) {
			$(".modal-overlay").fadeOut("fast");
		});
	}

}).on("click", ".database-tables li", function(evt) {
	evt.preventDefault();
	let $this = $(this);
	let $parent = $this.closest('.database-tables');
	$parent.find("li.selected").removeClass("selected");
	$this.addClass("selected");

	$(".modal-overlay").fadeIn("fast");
	connections.compareTables($this.text().trim(), function(tables) {
		$(".table-content-column").html(html.renderDiffs(DataUtils.diff(tables)));
		$(".modal-overlay").fadeOut("fast");
	});

}).on("click", ".server-folder .name", function(evt) {
	evt.preventDefault();
	let $this = $(this).closest(".server-folder");
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

}).on("click", ".server-list-left .server-link", function(evt) {
	evt.preventDefault();
	$(".server-list-left .server-link.selected").removeClass("selected");
	let $this = $(this);
	$this.addClass("selected");
	let connectionData = model.getConnection($(this).attr("data-id"));
	$(".server-connection-detail").html(html.renderSingleServer(connectionData));
	$(".server-connection-detail .server-name").click();

}).on("click", ".server-avatar .close-icon", function(evt) {
	evt.preventDefault();
	let id = $(this).closest(".server-avatar").attr("data-id");
	connections.removeConnection(id);

}).on("click", ".server-avatar .make-king-icon", function(evt) {
	evt.preventDefault();
	var id = $(this).closest(".server-avatar").attr("data-id");
	connections.makeMaster(id);
});

$(window).resize(function() {
	$(".side-bar").each(function() {
		let $sb = $(this);
		let wHeight = $(window).height();
		let sHeight = $sb.height();
		let sPos = $sb.offset();
		let targetHeight = wHeight - 33 - sPos.top;
		$sb.attr("style", "height: " + targetHeight + "px");
	});
});

$(document).ready(function() {

	const activeConnections = new ActiveConnectionViewController(".server-avatars .text-center");
	activeConnections.renderServerAvatars(connections.getConnections());
	connections.addListener("change", function(data) {
		activeConnections.renderServerAvatars(data);
		$(".table-reference-column .table-list").html(html.renderTables(data));
	});
 	
 	$.ajax({
 		url: './working_files/config.json',
 		success: function(data) {
	 		if(data) {
	 			let config = JSON.parse(data);
	 			model.setConfig(config);
	 			$(".server-list-left").html(html.renderServerReference(config));
	 			$(".server-list").html(html.renderServers(config));
	 		}
	 	},
 		error: function(err) {
 			console.log("Initializing new model {} (no config.json file found)");
 			let config = model.getConfig();
 			$(".server-list-left").html(html.renderServerReference(config));
 			$(".server-list").html(html.renderServers(config));
 		}
 	});

 	$(".refresh-browser-link").click(function(evt) {
 		evt.preventDefault();
 		location.reload();
 	});

 	$(".nav .option-link").click(function(evt) {
 		evt.preventDefault();
 		let $this = $(this);
 		$(".nav .option-link.active").removeClass("active")
 		$this.addClass("active");
 		$(".option-link-container").slideUp("fast");
 		$("." + $this.attr("data-target")).slideDown("fast");
 	});

 	$(".include-partial").each(function() {
 		let $this = $(this);
 		let uri = $this.attr("data-target");
 		$this.load(uri);
 	});
});
