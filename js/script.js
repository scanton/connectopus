const remote = require('electron').remote;

const EventEmitter = require(__dirname + '/custom_modules/EventEmitter.js');

const ConnectionManager = require(__dirname + '/custom_modules/ConnectionManager.js');
const connections = new ConnectionManager();

const ConnectopusModel = require(__dirname + '/custom_modules/ConnectopusModel.js');
const model = new ConnectopusModel({}, connections);

const HtmlRenderer = require(__dirname + '/custom_modules/HtmlRenderer.js');
var html = new HtmlRenderer();

const ConnectopusController = require(__dirname + '/custom_modules/ConnectopusController.js');
const controller = new ConnectopusController(model, connections, html);

const FileSystem = require(__dirname + '/custom_modules/FileSystem.js');
const fs = new FileSystem();

const TutorialData = require(__dirname + '/custom_modules/TutorialData.js');
const tuts = new TutorialData();

window.onerror = function(errorMsg, url, lineNumber) {
	console.log("Error occured: " + errorMsg);
	
	$(".server-status.pending").removeClass("pending").addClass("error");
	$(".modal-overlay").fadeOut("fast");
	connections.close();
	return false;
}

const DataUtils = require(__dirname + '/custom_modules/DataUtils.js');

const ActiveConnectionViewController = require(__dirname + '/custom_modules/ActiveConnectionsViewController.js');

require('./custom_modules/enableContextMenu.js')();

let getClassData = function(prefix, classAttr) {
	if(prefix && classAttr) {
		let a = classAttr.split(" ");
		let l = a.length;
		while(l--) {
			if(a && a[l] && a[l].indexOf(prefix + '-') > -1) {
				return a[l];
			}
		}
	}
}

let highlightCollumnDifferences = function(fields) {
	$(".table-content-column").find(".diffs").find("tr").each(function() {
		let $row = $(this);
		let l = fields.length;
		while(l--) {
			$cols = $row.find(".column-" + fields[l].name);
			$cols.removeClass("is-different");
			let val = null;
			let l2 = $cols.length;
			while(l2--) {
				let tmp = $($cols[l2]).html();
				if(val == null) {
					val = tmp;
				} else {
					if(val != tmp) {
						$cols.addClass("is-different");
					}
				}
			}
		}
		if(!$row.find(".field-id-0-0").text().length) {
			$row.find("input[type='checkbox']").remove();
		}
	});
}

let updateTableDiffStatus = function() {
	$(".mysql-footer-toolbar .status").html($(".tools-column-0 .row-checkbox-0").length + " different rows");
}

let initialzeFilterDropDowns = function() {
	let $headers = $(".diffs tr.table-headers");
	//let $rows = $(".diffs tr").not(".table-headers");
	$headers.find("th").each(function() {
		let $this = $(this);
		let fieldId = $this.attr("data-field-id");
		var a = [];
		$(".diffs .field-id-" + fieldId).not($this).each(function() {
			let s = $(this).text();
			let sl = s.length;
			if(sl < 100 && sl > 0 && a.indexOf(s) == -1) {
				a.push(s);
			}
		});
		if(a.length) {
			a.sort();
			let l = a.length;
			let options = '<select class="filter-select"><option></options>';
			for(let i = 0; i < l; i++) {
				options += '<option>' + a[i] + '</options>';
			}
			$this.find(".controls").html(options + '</select>');
		} else {
			$this.find(".controls").html('<input type="text" class="search-column-input" placeholder="filter" />');
		}
		
	});
}

let hideUnaffectedColumns = function() {
	$(".diff-header").each(function() {
		let fieldId = $(this).attr("data-field-id");
		if(fieldId != 0) {
			let $diffItems = $(".field-id-" + fieldId + ".is-different");
			if(!$diffItems.length) {
				$(".field-id-" + fieldId).hide();
			}
		}
	});
}

let showUnaffectedColumns = function() {
	$(".diffs td").show();
	$(".diffs th").show();
}

$(document).on("click", ".connect-to-db-button", function(evt) {
	evt.preventDefault();
	evt.stopPropagation();
	let id = $(this).closest("li").attr("data-id");
	if(id) {
		$(".modal-overlay").fadeIn("fast");
		connections.addConnection(model.getConnection(id), function(data) {
			$(".modal-overlay").fadeOut("fast");
			$(".link-requires-active-connections").show('slide', {direction: 'left'}, 500);
		}, model.getSettings()['default_sftp_directory']);
	}

}).on("click", ".server-list-group .server-name", function (evt) {
	evt.preventDefault();
	let $parent = $(this).closest(".list-group-item");
	$parent.find(".server-details").slideToggle('fast');
	$parent.find(".shortcut-buttons").slideToggle('fast');
	$parent.find(".server-update-button").slideToggle('fast');

}).on("click", ".connect-to-db-shortcut-button", function(evt) {
	evt.preventDefault();
	let $this = $(this);
	let $li = $this.closest(".list-group-item");

}).on("click", ".listing-item.different-size", function(evt) {
	evt.preventDefault();
	let $this = $(this);
	let path = $this.attr("data-path");
	var columnIndex = $this.attr("class").split("index-")[1].split(" ")[0];
	controller.compareFiles(columnIndex, path, function(data) {
		let $diffView = $(".code-diff-view");
		$diffView.html(html.renderTextDiff(data, columnIndex));
		$(".code-diff-container .title").text(path);
		$(".modal-overlay").fadeOut("fast");

 		$(".option-link-container").slideUp("fast");
		$(".code-diff-container").slideDown("fast", function() { $(window).resize(); });
	});

}).on("click", ".database-tables li", function(evt) {
	evt.preventDefault();
	let $this = $(this);
	if($this.hasClass("blocked")) {
		controller.showModal("Table Blocked", "<p>Your custom Settings prevents browsing to this table.</p><p>By limiting access to tables, you are able to prevent accidently selecting tables that are too large for comparison, or tables that are populated by web services; making them inappropriate for direct row by row comparison.</p><p>You can edit the Blocked Tables list by clicking the '<span class=\"glyphicon glyphicon-cog\"></span> Settings' tab at the top/right of the application.</p>", {
			buttons: [
				{
					label: 'OK', 
					class: "btn btn-success ok-button pull-right", 
					callback: function(evt) {
						evt.preventDefault();
						controller.hideModal();
					}
				}
			]
		});
	} else {
		let $parent = $this.closest('.database-tables');
		$parent.find("li.selected").removeClass("selected");
		$this.addClass("selected");

		$(".modal-overlay").fadeIn("fast");
		let tableName = $this.text().trim();
		$(".table-name-container").text(tableName);
		let tableLimit = model.getSetting("max_rows_requested");
		if(!tableLimit) {
			console.warn("max_rows_requested (table limit) not found in custom settings.  Using 100000");
			tableLimit = 100000;
		}
		connections.compareTables(tableName, function(tables) {
			let diffResult = DataUtils.diff(tables);
			$(".table-content-column .table-container").html(html.renderDiffs(diffResult, connections.getConnections()));
			if(tables && tables[0] && tables[0].fields) {
				highlightCollumnDifferences(tables[0].fields);
				//hideUnaffectedColumns();
				initialzeFilterDropDowns();
				updateTableDiffStatus();
			}
			$(".modal-overlay").fadeOut("fast");
		}, tableLimit, model.getSchema(tableName));
	}

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
	$(".server-connection-detail").html(html.renderSingleServer(connectionData)).slideDown("fast");
	$(".server-connection-detail .server-name").click();
	$(".add-new-server-container").slideUp("fast");

}).on("click", ".add-server-button", function(evt) {
	evt.preventDefault();
	$(".add-new-server-container").slideDown("fast");
	$(".server-connection-detail").slideUp("fast");
	$(".server-list-left .server-link.selected").removeClass("selected");

}).on("click", ".server-avatar .close-icon", function(evt) {
	evt.preventDefault();
	console.log("connection removal temporarily disabled (click 'Refresh' to re-initialize)");

	/*
	let id = $(this).closest(".server-avatar").attr("data-id");
	connections.removeConnection(id);
	*/
}).on("click", ".server-avatar .make-king-icon", function(evt) {
	evt.preventDefault();
	console.log("re-ordering connections temporarily disabled (click 'Refresh' to re-initialize)");

	/*
	let id = $(this).closest(".server-avatar").attr("data-id");
	connections.makeMaster(id);
	*/
}).on("click", "table .cell-container", function(evt) {
	evt.preventDefault();
	let $this = $(this);
	if($this.hasClass("scrollable")) {
		$this.removeClass("scrollable");
	} else {
		$this.addClass("scrollable");
	}

}).on("click", ".server-link .quick-connect-button", function(evt) {
	evt.preventDefault();
	let id = $(this).closest("li").attr("data-id");
	if(id) {
		$(".modal-overlay").fadeIn("fast");
		connections.addConnection(model.getConnection(id), function(data) {
			$(".modal-overlay").fadeOut("fast");
			$(".link-requires-active-connections").show('slide', {direction: 'left'}, 500);
		}, model.getSettings()['default_sftp_directory']);
	}

}).on("click", ".diffs .sort-down", function(evt) {
	evt.preventDefault();
	let fieldId = $(this).closest("th").attr("data-field-id");
	console.log("sort field-id-" + fieldId + " decending");

}).on("click", ".diffs .sort-up", function(evt) {
	evt.preventDefault();
	let fieldId = $(this).closest("th").attr("data-field-id");
	console.log("sort field-id-" + fieldId + " ascending");

}).on("click", ".all-sftp-directories .listing-item", function(evt) {
	evt.preventDefault();
	if($(this).attr("data-type") == 'd') {
		controller.addDirectory($(this).attr("data-path"));
	} else {
		console.log("controller.compareFiles()");
	}

}).on("click", ".sftp-filtered-directories .listing-item", function(evt) {
	evt.preventDefault();
	if($(this).attr("data-type") == 'd') {
		controller.addDirectory($(this).attr("data-path"));
	} else {
		console.log("controller.compareFiles()");
	}

}).on("click", ".path-links .path-history", function(evt) {
	evt.preventDefault();
	controller.addDirectory($(this).attr("data-path"));

}).on("click", ".settings-link", function(evt) {
	evt.preventDefault();
	$(".settings-panel").toggle("slide", {direction: "right", easing: "easeOutCubic"});

}).on("change", ".setting-details-container .hide-dangerous-buttons-checkbox", function(evt) {
	model.updateSetting("hide_dangerous_buttons", $(this).is(":checked"));

}).on("change", ".setting-details-container .hide-tuts-my-goots-checkbox", function(evt) {
	model.updateSetting("hide_tuts_my_goots", $(this).is(":checked"));

}).on("change", ".setting-details-container .hide-tooltip-balloons", function(evt) {
	model.updateSetting("hide_tooltip_balloons", $(this).is(":checked"));

}).on("click", ".setting-details-container .add-blocked-table-button", function(evt) {
	evt.preventDefault();
	let val = $(this).closest("td").find("input[type='text']").val();
	if(val) {
		model.pushSettingArrayItem("block_tables", val);
	}

}).on("click", ".setting-details-container .remove-blocked-table-button", function(evt) {
	evt.preventDefault();
	let val = $(this).closest("li").text();
	if(val) {
		controller.showModal("Remove <strong>" + val + "</strong>", "<p>This will remove <strong>" + val + "</strong> from the list of blocked tables, enabling difference comparisons on this table.</p><p>You can always add <strong>" + val + "</strong> back to Blocked Tables in <span class=\"glyphicon glyphicon-cog\"></span>&nbsp;Settings.</p>", {
			buttons: [
				{
					label: 'Remove <strong>' + val + '</strong> from Blocked Tables', 
					class: "btn btn-danger ok-button pull-right", 
					callback: function(evt) {
						evt.preventDefault();
						model.removeSettingArrayItem("block_tables", val);
						controller.hideModal();
					}
				},
				{
					label: 'Cancel', 
					class: "btn btn-default cancel-button pull-right", 
					callback: function(evt) {
						evt.preventDefault();
						controller.hideModal();
					}
				}
			]
		});	
	}

}).on("change", ".setting-details-container input[name='default_sftp_directory']", function(evt) {
	let val = $(this).val();
	if(val && val.length) {
		model.updateSetting("default_sftp_directory", val);
	} else {
		console.warn("invalid default sftp directory - no action taken");
	}

}).on("change", ".setting-details-container input[name='max_rows_requested']", function(evt) {
	let val = $(this).val();
	if(val && val.length) {
		model.updateSetting("max_rows_requested", val);
	} else {
		console.warn("invalid max_rows_requested - no action taken");
	}

}).on("click", ".add-new-server-button", function(evt) {
	evt.preventDefault();
	var isValid = true;
	let $form = $(this).closest("form");
	$form.find("input").each(function() {
		let $this = $(this);
		if($this.val().length) {
			$this.addClass("is-valid");
			$this.removeClass("is-not-valid");
		} else {
			$this.removeClass("is-valid");
			$this.addClass("is-not-valid");
			isValid = false;
		}
	});
	if(isValid) {
		var config = model.getConfig();
		if(!config) {
			config = {};
		}
		if(!config.servers) {
			config.servers = [];
		}
		let newId = model.md5($form.find("input[name='server']").val() + $form.find("input[name='port']").val() + $form.find("input[name='username']").val() + $form.find("input[name='password']").val());
		let newServer = {
			name: $form.find("input[name='name']").val(),
			host: $form.find("input[name='server']").val(),
			port: $form.find("input[name='port']").val(),
			username: $form.find("input[name='username']").val(),
			password: $form.find("input[name='password']").val(),
			connections: [
				{
					name: $form.find("input[name='db-connection-name']").val(),
					type: $form.find("select[name='database-type']").val(),
					host: $form.find("input[name='db-connection-host']").val(),
					database: $form.find("input[name='db-connection-database']").val(),
					username: $form.find("input[name='db-connection-username']").val(),
					password: $form.find("input[name='db-connection-password']").val()
				}
			],
			id: newId
		};
		config.servers.push(newServer);
		fs.writeJson(__dirname + '/working_files/config.json', config, () => {
			$form.find("input").val("");
			$form.find("input.is-valid").removeClass("is-valid");
			$form.find("input.is-not-valid").removeClass("is-not-valid");
			model.setConfig(config);
 			renderNewConfig(config);
 			$(".server-list-left .server-link[data-id='" + newId + "']").click();
		});
	}

}).on("click", ".delete-config-button", function(evt) {
	evt.preventDefault();
	let $serverLink = $(".server-list-left .server-link.selected");
	if($serverLink.length) {
		controller.showModal("Warning", "Are you sure you want to delete " + $serverLink.text().slice(0, -8) + '?', {
			buttons: [
				{
					label: 'OK', 
					class: "btn btn-danger ok-button pull-right", 
					callback: function(evt) {
						evt.preventDefault();
						let removed = model.removeServerFromConfig($serverLink.attr("data-id"));
						controller.hideModal();
						let config = model.getConfig();
						fs.writeJson(__dirname + '/working_files/config.json', config, () => {
				 			renderNewConfig(config);
				 			$(".server-reference-footer .add-server-button").click();
						});
					}
				},
				{
					label: 'Cancel', 
					class: "btn btn-default cancel-button pull-right", 
					callback: function(evt) {
						evt.preventDefault();
						controller.hideModal();
					}
				}
			]
		});	
	}

}).on("click", ".server-reference-footer .add-folder-button", function(evt) {
	evt.preventDefault();
	controller.showModal("Add Folder", "<div class='folder-name-div'>Folder Name: <input class='new-folder-name-input' type='text' name='folder-name' style='width: 446px;' /></div>", {
		buttons: [
			{
				label: 'Add Folder', 
				class: "btn btn-success ok-button pull-right", 
				callback: function(evt) {
					evt.preventDefault();
					let val = $(".modal-dialog .new-folder-name-input").val();
					let added = model.addFolder(val);
					if(added) {
						let config = model.getConfig();
						fs.writeJson(__dirname + '/working_files/config.json', config, () => {
				 			renderNewConfig(config);
						});
					}
					controller.hideModal();
				}
			},
			{
				label: 'Cancel', 
				class: "btn btn-default cancel-button pull-right", 
				callback: function(evt) {
					evt.preventDefault();
					controller.hideModal();
				}
			}
		]
	});

}).on("click", ".server-connection-detail .server-update-button", function(evt) {
	evt.preventDefault();
	let $this = $(this);
	let id = $this.closest(".list-group-item").attr("data-id");
	let data = $this.closest("form").serializeArray();
	let o = {};
	for(let i in data) {
		o[data[i].name] = data[i].value;
	}
	if(id) {
		model.updateServerData(o);
		let config = model.getConfig();
		fs.writeJson(__dirname + '/working_files/config.json', config, () => {
			renderNewConfig(config);
		});
	}

}).on("click", ".sftp-toolbar .sync-selected-files", function(evt) {
	evt.preventDefault();
	let $checks = $(".sftp-tree-view .sftp-row-checkbox:checked");
	let paths = [];
	$checks.each(function() {
		let $row = $(this).closest("tr");
		paths.push($row.find("td.index-0").attr("data-path"));
	});
	if($checks.length) {
		controller.showModal("Syncronize Selected Files", "Would you like to copy the selected files from the left-most server to all other servers?", {
			buttons: [
				{
					label: 'Syncronize', 
					class: "btn btn-danger ok-button pull-right", 
					callback: function(evt) {
						evt.preventDefault();
						controller.syncFiles(paths);
						//controller.hideModal();
						$(".modal-dialog").fadeOut("fast");
					}
				},
				{
					label: 'Cancel', 
					class: "btn btn-default cancel-button pull-right", 
					callback: function(evt) {
						evt.preventDefault();
						controller.hideModal();
					}
				}
			]
		});
	} else {
		controller.showModal("No Files Selected", "Please click the check-boxes next to the items you would like to syncronize.", {
			buttons: [
				{
					label: 'Ok', 
					class: "btn btn-success ok-button pull-right", 
					callback: function(evt) {
						evt.preventDefault();
						controller.hideModal();
					}
				}
			]
		});
	}

}).on("change", ".sftp-tree-view .sftp-all-row-checkbox", function(evt) {
	let $this = $(this);
	let val = $this.is(":checked");
	if(val) {
		$(".sftp-tree-view .sftp-row-checkbox:hidden").prop("checked", false);
		$(".sftp-tree-view .sftp-row-checkbox:visible").prop("checked", true).closest("tr").addClass("selected");
		$(".sftp-tree-view tr:hidden").removeClass("selected");
	} else {
		$(".sftp-tree-view .sftp-row-checkbox").prop("checked", false);
		$(".sftp-tree-view tr").removeClass("selected");
	}
	if($(".sftp-row-checkbox:checked").length) {
		$(".sync-selected-files").slideDown("fast");
	} else {
		$(".sync-selected-files").slideUp("fast");
	}

}).on("change", ".sftp-tree-view .sftp-row-checkbox", function(evt) {
	let $this = $(this);
	let val = $this.is(":checked");
	let $row = $this.closest("tr");
	if(val) {
		$row.addClass("selected");
	} else {
		$row.removeClass("selected");
	}
	if($(".sftp-row-checkbox:checked").length) {
		$(".sync-selected-files").slideDown("fast");
	} else {
		$(".sync-selected-files").slideUp("fast");
	}

}).on("change", ".diffs .check-all-visible-rows-checkbox", function(evt) {
	let $this = $(this);
	let val = $this.is(":checked");
	if(val) {
		$(".diffs .row-checkbox:hidden").prop("checked", false);
		$(".diffs .row-checkbox:visible").prop("checked", true);
		$(".diffs tr:hidden").removeClass("selected");
		$(".diffs tr:visible").each(function() {
			let $row = $(this);
			if($row.find("input[type='checkbox']").length) {
				$row.addClass("selected")
			}
		});
	} else {
		$(".diffs .row-checkbox").prop("checked", false);
		$(".diffs tr").removeClass("selected");
	}
	if($(".row-checkbox-0:checked").length) {
		$(".sync-rows-button").slideDown("fast");
	} else {
		$(".sync-rows-button").slideUp("fast");
	}

}).on("change", ".diffs .row-checkbox-0", function(evt) {
	let $this = $(this);
	let val = $this.is(":checked");
	let $row = $this.closest("tr");
	if(val) {
		$row.addClass("selected");
		$row.find(".row-checkbox").prop("checked", true);
	} else {
		$row.removeClass("selected");
		$row.find(".row-checkbox").prop("checked", false);
	}
	if($(".row-checkbox-0:checked").length) {
		$(".sync-rows-button").slideDown("fast");
	} else {
		$(".sync-rows-button").slideUp("fast");
	}
	
}).on("change", ".diffs .filter-select", function(evt) {
	let $this = $(this);
	let val = $this.val();
	let fieldId = $this.closest("th").attr("data-field-id");
	let $column = $(".diffs td.field-id-" + fieldId);
	$column.each(function() {
		let $row = $(this).closest("tr");
		if(val == '' || $(this).text() == val) {
			$row.addClass("filter-match");
			$row.removeClass("not-filter-match");
		} else {
			$row.addClass("not-filter-match");
			$row.removeClass("filter-match");
		}
	});
});

$(window).resize(function() {
	let wHeight = $(window).height();
	$(".side-bar").each(function() {
		let $sb = $(this);
		let sHeight = $sb.height();
		let sPos = $sb.offset();
		let targetHeight = wHeight - 33 - sPos.top;
		$sb.attr("style", "height: " + targetHeight + "px");
	});
	$(".table-container").each(function() {
		let $tc = $(this);
		let tHeight = $tc.height();
		let tPos = $tc.offset();
		let targetHeight = wHeight - 33 - tPos.top;
		$tc.attr("style", "height: " + targetHeight + "px");
	});
});

var renderNewConfig = (config) => {
	$(".server-list-left").html(html.renderServerReference(config));
	$(".server-list").html(html.renderServers(config));
	$(".server-list-left .server-link").draggable({
		containment: ".server-reference", 
		cursor: 'move', 
		snap: ".server-folder",
		helper: 'clone'
	});
	$(".server-list-left .server-folder").droppable({
		drop: dropServerOnFolderHandler,
		hoverClass: "drop-target-active"
	});
}

var renderNewSettings = (settings) => {
	let $container = $(".setting-details-container");
	$container.find("input[name='default_sftp_directory']").val(settings['default_sftp_directory']);
	$container.find("input[name='max_rows_requested']").val(settings['max_rows_requested']);
	if(settings['block_tables'] && settings['block_tables'].length) {
		let removeButton = '<button class="btn btn-warning remove-blocked-table-button pull-right" title="Remove Table from Blocked List"><span class="glyphicon glyphicon-minus"></span></button>';
		let s = '<ul class="block-tables-list"><li>';
		s += removeButton;
		s += settings['block_tables'].sort().join('<div class="clear-fix"></div></li><li>' + removeButton) + '<div class="clear-fix"></div></li></ul>';
		$container.find(".block-tabels-list").html(s);
	}
	let style = '<style>';
	$container.find(".hide-dangerous-buttons-checkbox").prop("checked", settings.hide_dangerous_buttons);
	if(settings.hide_dangerous_buttons) {
		style += '.btn-danger { display: none !important; } '
	}
	$container.find(".hide-tuts-my-goots-checkbox").prop("checked", settings.hide_tuts_my_goots);
	if(settings.hide_tuts_my_goots) {
		$(".tuts-my-goots-icon").fadeOut("slow");
	} else {
		$(".tuts-my-goots-icon").fadeIn("slow");
	}
	$container.find(".hide-tooltip-balloons").prop("checked", settings.hide_tooltip_balloons);
	if(settings.hide_tooltip_balloons) {
		style += '.mouse-follow-balloon { display: none !important; } '
	}

	style += '</style>';
	$(".custom-settings-styles").html(style);
}

var dropServerOnFolderHandler = function(evt, ui) {
	let id = ui.draggable.attr("data-id");
	let name = $(this).attr("data-name");
	model.addServerToFolder(id, name);
	let config = model.getConfig();
	fs.writeJson(__dirname + '/working_files/config.json', config, () => {
		renderNewConfig(config);
	});
}

model.addListener("settings-changed", (settings) => {
	fs.writeJson(__dirname + '/working_files/settings.json', settings, () => {
		renderNewSettings(settings);
	});
});

$(document).ready(function() {

	const activeConnections = new ActiveConnectionViewController(".server-avatars .text-center");
	activeConnections.renderServerAvatars(connections.getConnections());
	connections.addListener("change", function(data) {
		activeConnections.renderServerAvatars(data);
		let tableName = connections.getLastResult().name;
		$(".table-reference-column .table-list").html(html.renderTables(data, tableName, model.getSettings()['block_tables']));
		let cons = connections.getConnections();
		let l = cons.length;
		for(let i = 0; i < l; i++) {
			let c = cons[i];
			let link = $(".server-link[data-id='" + c.id + "']");
			link.removeClass("pending active error");
			link.addClass(c.status);
		}
	});
 	
 	$.ajax({
 		url: './working_files/config.json',
 		success: function(data) {
	 		if(data) {
	 			let config = JSON.parse(data);
	 			model.setConfig(config);
	 			renderNewConfig(config);
	 		}
	 	},
 		error: function(err) {
 			console.warn("Handling Error: -- (no config.json file found). Welcoming new user with introduction help screen.");
 			console.log("Welcome new user :)");
 			$(".add-new-server-container").tut("Welcome to Connectopus!", "It appears this is your first time using Connectopus.  To get started, you'll want to add some connections.  These are the SSH connections to your web server(s) and the MySQL database connection used once the SSH connection is established.");
 			let config = model.getConfig();
 			renderNewConfig(config);
 		}
 	});
 	
 	$.ajax({
 		url: './working_files/settings.json',
 		success: function(data) {
	 		if(data) {
	 			let settings = JSON.parse(data);
	 			model.setSettings(settings);
	 			renderNewSettings(settings);
	 		}
	 	},
 		error: function(err) {
 			console.log("No custom settings found");
 			var settings = { default_sftp_directory: "www", hide_dangerous_buttons: true };
 			model.setSettings(settings);
 			$(".btn-danger").hide();
 			fs.writeJson(__dirname + '/working_files/settings.json', settings, () => {
				renderNewSettings(settings);
			});
 		}
 	});

 	$(window).on("mousemove", function(evt) {
 		let $balloon = $(".mouse-follow-balloon");
 		if(evt.target && evt.target.className.indexOf("different-size") > -1) {
 			let offset = 8;
 			let masterLabel = $(".server-avatars .server-avatar-0").text();
 			$balloon.css("top", (evt.clientY + offset) + "px").css("left", (evt.clientX + offset) + "px");
 			$balloon.html("Click to compare with " + masterLabel + " <span class=\"glyphicon glyphicon-king\"></span> (master)");
 			$balloon.show();
 		} else {
 			$balloon.hide();
 		}
 	});

 	$(".tuts-my-goots-icon").click(function(evt) {
 		let $this = $(this);
 		let tut = tuts.getTut($this.attr("data-subject"));
 		if(tut) {
 			$this.tut(tut.title, tut.message);
 		}
 	});

 	$('.close-code-diff-container-button').click(function(evt) {
 		$(".sftp-option-link").click();
 	});

 	$('.close-sql-view-container-button').click(function(evt) {
 		$(".mysql-option-link").click();
 	});

 	$(".refresh-browser-link").click(function(evt) {
 		evt.preventDefault();
 		location.reload();
 	});

 	$(".toggle-dev-tools-link").click(function(evt) {
 		remote.getCurrentWindow().toggleDevTools();
 	});

 	$(".nav .option-link").click(function(evt) {
 		evt.preventDefault();
 		let $this = $(this);
 		$(".nav .option-link.active").removeClass("active");
 		$this.addClass("active");
 		$(".option-link-container").slideUp("fast");
 		$("." + $this.attr("data-target")).slideDown("fast", function() { $(window).resize(); });
 	});

 	$(".show-matching-columns-button").click(function() {
 		$(".hide-matching-columns-button").show("fast");
 		$(this).hide("fast");
 		showUnaffectedColumns();
 	});

 	$(".hide-matching-columns-button").click(function() {
 		$(".show-matching-columns-button").show("fast");
 		$(this).hide("fast");
 		hideUnaffectedColumns();
 	});

 	$(".sync-rows-button").click(function(evt) {
 		evt.preventDefault();
 		let $checks = $(".row-checkbox-0:checked");
 		let rowIds = [];
 		var tableName = $(".table-toolbar .table-name-container").text();
 		var sql = controller.getMySqlExport(tableName, rowIds);
 		$checks.each(function() {
 			let $row = $(this).closest("tr");
 			rowIds.push($row.find(".field-id-0-0").text());
 		});
 		if(rowIds.length) {
 			controller.showModal("Syncronize Selected Rows", "Would you like to copy the selected rows from the left-most (master) server to all other servers?", {
				buttons: [
					{
						label: 'Syncronize', 
						class: "btn btn-danger ok-button pull-right", 
						callback: function(evt) {
							evt.preventDefault();
							controller.syncRows(tableName, rowIds);
							controller.hideModal();
						}
					},
					{
						label: 'View SQL Code', 
						class: "btn btn-info view-sql-button pull-right", 
						callback: function(evt) {
							evt.preventDefault();
							$(".sql-view-container .sql-view").text(sql);//.html("<pre>" + sql + "</pre>");
							controller.hideModal();
							$(".option-link-container").slideUp("fast");
							$(".sql-view-container").slideDown("fast", function() { $(window).resize(); });
						}
					},
					{
						label: 'Cancel', 
						class: "btn btn-default cancel-button pull-right", 
						callback: function(evt) {
							evt.preventDefault();
							controller.hideModal();
						}
					}
				]
			});
 		} else {
 			controller.showModal("No Rows Selected", "Please select the rows you would like to syncronize with the other servers.", {
				buttons: [
					{
						label: 'OK', 
						class: "btn btn-success ok-button pull-right", 
						callback: function(evt) {
							evt.preventDefault();
							controller.hideModal();
						}
					}
				]
			});
 		}
 	});

 	$(".include-partial").each(function() {
 		var $this = $(this);
 		let uri = $this.attr("data-target");
 		$this.load(uri, function() {
 			$this.find(".database-type-select-box").selectmenu({
 				change: function() {
 					let $this = $(this);
 					let val = $this.val();
 					if(!(val == "MySQL" || val == "MariaDB")) {
 						$(this).tut(val + " Is In Development", "<p>Although we do not currently have a connector for " + val + ", it is a possible future enhancement.</p><p>Connectopus is compatable with any row-based data.  For example, lists of files, data trees, rows in a SQL table, Redis name/value data stores are all Connectopusable once a connector/adaptor for that data source has been implemented in Connectopus.</p><p>If you are a developer interested in integrating " + val + " with Connectopus, <a href=\"http://connectopus.org\" target=\"_blank\">we welcome pull requests</a>.</p>");
 					}
 				}
 			});
 		});
 	});
});
