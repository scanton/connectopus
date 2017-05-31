const ConnectionManager = require('./custom_modules/ConnectionManager.js');
const connections = new ConnectionManager();

const remote = require('electron').remote;

window.onerror = function(errorMsg, url, lineNumber) {
	console.log("Error occured: " + errorMsg);
	
	$(".server-status.pending").removeClass("pending").addClass("error");
	$(".modal-overlay").fadeOut("fast");
	connections.close();
	return false;
}

let enableContextMenu = require('./custom_modules/enableContextMenu.js');
enableContextMenu();

const DataUtils = require('./custom_modules/DataUtils.js');

const ConnectopusModel = require('./custom_modules/ConnectopusModel.js');
const model = new ConnectopusModel();

const ActiveConnectionViewController = require('./custom_modules/ActiveConnectionsViewController.js');

const HtmlRenderer = require('./custom_modules/HtmlRenderer.js');
var html = new HtmlRenderer();

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
		
	});
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
		});
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

}).on("click", ".database-tables li", function(evt) {
	evt.preventDefault();
	let $this = $(this);
	let $parent = $this.closest('.database-tables');
	$parent.find("li.selected").removeClass("selected");
	$this.addClass("selected");

	$(".modal-overlay").fadeIn("fast");
	connections.compareTables($this.text().trim(), function(tables) {
		let diffResult = DataUtils.diff(tables);
		$(".table-content-column .table-container").html(html.renderDiffs(diffResult, connections.getConnections()));
		if(tables && tables[0] && tables[0].fields) {
			highlightCollumnDifferences(tables[0].fields);
			//hideUnaffectedColumns();
			initialzeFilterDropDowns();
		}
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
	let id = $(this).closest(".server-avatar").attr("data-id");
	connections.makeMaster(id);

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
		});
	}

}).on("click", ".diffs .sort-down", function(evt) {
	let fieldId = $(this).closest("th").attr("data-field-id");
	console.log("sort field-id-" + fieldId + " decending");

}).on("click", ".diffs .sort-up", function(evt) {
	let fieldId = $(this).closest("th").attr("data-field-id");
	console.log("sort field-id-" + fieldId + " ascending");

}).on("change", ".diffs .check-all-visible-rows-checkbox", function(evt) {
	let $this = $(this);
	let val = $this.is(":checked");
	if(val) {
		$(".diffs .row-checkbox:hidden").prop("checked", false);
		$(".diffs .row-checkbox:visible").prop("checked", true);
		$(".diffs tr:hidden").removeClass("selected");
		$(".diffs tr:visible").addClass("selected");
	} else {
		$(".diffs .row-checkbox").prop("checked", false);
		$(".diffs tr").removeClass("selected");
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

 	$(".toggle-dev-tools-link").click(function(evt) {
 		remote.getCurrentWindow().toggleDevTools();
 	});

 	$(".nav .option-link").click(function(evt) {
 		evt.preventDefault();
 		let $this = $(this);
 		$(".nav .option-link.active").removeClass("active")
 		$this.addClass("active");
 		$(".option-link-container").slideUp("fast");
 		$("." + $this.attr("data-target")).slideDown("fast");
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

 	$(".sql-view-button").click(function(evt) {
 		evt.preventDefault();
 		let $checks = $(".row-checkbox-0:checked");
 		let rowIds = [];
 		$checks.each(function() {
 			let $row = $(this).closest("tr");
 			rowIds.push($row.find(".field-id-0-0").text());
 		});
 		console.log(rowIds);
 	});

 	$(".include-partial").each(function() {
 		let $this = $(this);
 		let uri = $this.attr("data-target");
 		$this.load(uri);
 	});
});
