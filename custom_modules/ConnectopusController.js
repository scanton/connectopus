module.exports = class ConnectopusController extends EventEmitter {

	constructor(model, connectionManager, htmlRenderer) {
		super();
		this.diff = require('diff');
		this.escape = require('jsesc');
		this.fs = require('fs-extra');
		this.model = model;
		this.connections = connectionManager;
		this.html = htmlRenderer;
		this.connections.addListener("add-directory", (data) => {
			this._renderDirectories(this.connections.getDirectories(), this.connections.activePath);
			this._diffSftpTree();

		});
		this.connections.addListener("active-path-change", (path) => {
			$(".active-sftp-path").html(this.html.renderPathLinks(path));
		})
	}

	addDirectory(path) {
		if(this.connections.hasPath(path)) {
			this.connections.setActivePath(path);
			this._renderDirectories(this.connections.getDirectories(), path)
		} else {
			$(".modal-overlay").fadeIn("fast");
			this.connections.compareDirectory(path, function(data) {
				//console.log(data);
				$(".modal-overlay").fadeOut("fast");
			});
		}
	}

	compareFiles(connectionIndex, path, callback) {
		var fs = this.fs;
		var diff = this.diff;
		var dirName = __dirname.split("/custom_modules")[0];
		var workingPath = dirName + '/working_files/compare/';
		fs.removeSync(dirName + '/working_files/compare/');
		var comp0, comp1;
		$(".modal-overlay").fadeIn("fast");
		let cacheCount = 0;
		this.connections.cacheCompare(connectionIndex, path, workingPath, function(stream, index) {
			let localPath = workingPath + 'comp-' + (index == 0 ? 0 : 1) + '.txt';
			fs.ensureDirSync(workingPath);
			stream.pipe(fs.createWriteStream(localPath)).on("finish", () => {
				++cacheCount;
				if(cacheCount == 2) {
					comp0 = fs.readFileSync(workingPath + 'comp-0.txt', 'utf8');
					comp1 = fs.readFileSync(workingPath + 'comp-1.txt', 'utf8');
					callback(diff.diffLines(comp0, comp1, {ignoreWhitespace: false, newlineIsToken: true}));
				}
			});
		});
	}

	syncFiles(paths) {
		var fs = this.fs;
		var dirName = __dirname.split("/custom_modules")[0];
		var workingPath = dirName + '/working_files/temp/';
		fs.removeSync(dirName + '/working_files/temp/');
		$(".modal-overlay").fadeIn("fast");
		this.connections.cacheFiles(paths, (data) => {
			this.connections.putRemoteFilesFromCache(workingPath, data);
			//$(".modal-overlay").fadeOut("fast");
		}, function(stream, path) {
			let a = path.split("/");
			a.pop();
			let dir = a.join("/");
			let localPath = workingPath + path;
			let localDir = workingPath + dir;
			fs.ensureDirSync(localDir);
			stream.pipe(fs.createWriteStream(localPath));
		}, function(err) {
			console.error("on-file-sync-error", err);
		});
	}

	showModal(title, message, options) {
		$(".modal-overlay").fadeIn("fast");
		let $dialog = $(".modal-dialog");
		
		$dialog.find(".title").html(title);
		$dialog.find(".message").html(message);

		if(options && options.buttons && options.buttons.length) {
			let $div = $("<div class='dynamic-button-container'></div>");
			let obl = options.buttons.length;
			for(let i = 0; i < obl; i++) {
				let b = options.buttons[i];
				let $btn = $('<button class="' + b.class + '">' + b.label + '</button> ');
				$btn.click(b.callback);
				$div.append($btn);
			}
			$dialog.find(".dialog-buttons").html($div);
		}
		$dialog.fadeIn("fast");
		$dialog.find(".message input[type='text']").focus();
	}

	hideModal() {
		$(".modal-overlay").fadeOut("fast");
		$(".modal-dialog").fadeOut("fast");
	}

	escapeSingleQuotes(str) {
		let a = str.split("\\'");
		let l = a.length;
		for(let i = 0; i < l; i++) {
			a[i] = a[i].split("'").join("\\'");
		}
		return a.join("\\'");
	}

	syncRows(rowIds) {
		console.log(this.getMySqlExport(rowIds));
	}

	getMySqlExport(rowIds) {
		let rowData = [];
		let results = this.connections.getLastResult();
		
		if(results && results.data && results.data[0] && results.data[0].results && results.data[0].results.length) {
			let idFieldName = results.data[0].fields[0].name;
			var table = results.data[0].fields[0].table;
			let r = results.data[0].results;
			let l = r.length;
			for(let i = 0; i < l; i++) {
				if(rowIds.indexOf(String(r[i][idFieldName])) > -1) {
					rowData.push(r[i]);
				}
			}
		}
		if(rowIds.length != rowData.length) {
			console.error("Missing row data in last results", rowIds, rowData);
		} else {
			return this._constructSqlInserts(table, results.data[0].fields, rowIds, rowData);
		}
	}

	_constructSqlInserts(tableName, fields, rowIds, rowData) {
		let fieldArray = [];
		let l = fields.length;
		for(let i = 0; i < l; i++) {
			fieldArray.push(fields[i].name);
		}
		let valuesArray = [];
		l = rowData.length;
		for(let i = 0; i < l; i++) {
			let element = '(';
			let a = [];
			let r = rowData[i];
			let l2 = fieldArray.length;
			for(let j = 0; j < l2; j++) {
				let val = r[fieldArray[j]];
				let type = typeof(val);
				if(type == "string") {
					val = "'" + this.escapeSingleQuotes(val) + "'";
				} else if(type == "object"){
					val = "'" + this.escapeSingleQuotes(val.toString()) + "'";
				}
				a.push(val);
			}
			element += a.join(",");
			element += ')';
			valuesArray.push(element);
		}

		let s = '';
		//s += ' SET @PREVIOUS_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS; \n\r ';
		//s += ' SET FOREIGN_KEY_CHECKS = 0; \n\r '
		//s += ' SET FOREIGN_KEY_CHECKS = @PREVIOUS_FOREIGN_KEY_CHECKS; \n\r ';
		//s += ' SET @PREVIOUS_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS; \n\r ';
		//s += ' SET FOREIGN_KEY_CHECKS = 0; \n\r\n\r ' ;

		s += ' DELETE FROM `' + tableName + '` WHERE `' + fieldArray[0] + '` IN ("' + rowIds.join('", "') + '"); \n\r\n\r ';

		s += ' LOCK TABLES `' + tableName + '` WRITE; \n\r ';
		s += ' ALTER TABLE `' + tableName + '` DISABLE KEYS; \n\r\n\r ';

		s += ' INSERT INTO `' + tableName + '` (`' + fieldArray.join("`, `") + '`) VALUES \n\r ';

		s += valuesArray.join(",\n\r") + '; \n\r\n\r ';

		s += ' ALTER TABLE `' + tableName + '` ENABLE KEYS; \n\r ';
		s += ' UNLOCK TABLES; \n\r ';
		//s += ' SET FOREIGN_KEY_CHECKS = @PREVIOUS_FOREIGN_KEY_CHECKS; ';

		return s;
	}

	_moveDirectoryListToSideBar(domQuery) {
		let $container = $(domQuery);
		let $list = $(".all-sftp-directories .listing-type-d").remove();
		$list.sort(function(a, b) {
			let ap = a.getAttribute("data-path").toLowerCase();
			let bp = b.getAttribute("data-path").toLowerCase();
			if(ap > bp) {
				return 1;
			} else if(ap < bp) {
				return -1;
			}
			return 0;
		});
		var usedPaths = [];
		var $filtered = $('<ul class="sftp-filtered-directories"></ul>');
		$list.each(function() {
			let $this = $(this);
			let path = $this.attr("data-path");
			if(usedPaths.indexOf(path) == -1) {
				usedPaths.push(path);
				$filtered.append($this);
			}
		});
		$container.html($filtered);
	}

	_tabelizeFiles() {
		let $lists = $(".all-sftp-directories .listing");
		let $lineItems = $lists.find("li");
		let a = [];
		$lineItems.each(function() {
			let $this = $(this);
			let path = $this.attr("data-path");
			if(a.indexOf(path) == -1) {
				a.push(path);
			}
		});
		a.sort(function(a, b) {
			let al = a.toLowerCase().trim();
			let bl = b.toLowerCase().trim();
			if(al > bl) {
				return 1;
			} else if (al < bl) {
				return -1;
			}
			return 0;
		});

		let listLength = $lists.length;
		let l = a.length;
		let s = '<table class="tabelized-files"><tr><th class="checkbox-column"><input class="sftp-all-row-checkbox" type="checkbox" /></th>';
		for(let k = 0; k < listLength; k++) {
			s += '<th class="index-' + k + '">';
			s += $(".server-avatar-" + k).text();
			s += '</th>'
		}
		s += '</tr>'
		for(let i = 0; i < l; i++) {
			let p = a[i];
			s += '<tr><td class="checkbox-column"><input class="sftp-row-checkbox" type="checkbox" /></td>';
			for(let j = 0; j < listLength; j++) {
				s += '<td ';

				let $item = $($lists[j]).find(".listing-item[data-path='" + p + "']");
				if($item.length > 0) {
					s += ' class="' + $item.attr("class") + ' index-' + j + '" ';
					s += ' data-accesstime="' + $item.attr("data-accesstime")  + '" ';
					s += ' data-group="' + $item.attr("data-group")  + '" ';
					s += ' data-modifytime="' + $item.attr("data-modifytime")  + '" ';
					s += ' data-name="' + $item.attr("data-name")  + '" ';
					s += ' data-owner="' + $item.attr("data-owner")  + '" ';
					s += ' data-rights-user="' + $item.attr("data-rights-user")  + '" ';
					s += ' data-rights-group="' + $item.attr("data-rights-group")  + '" ';
					s += ' data-rights-owner="' + $item.attr("data-rights-owner")  + '" ';
					s += ' data-size="' + $item.attr("data-size")  + '" ';
					s += ' data-type="' + $item.attr("data-type")  + '" ';
					s += ' data-path="' + $item.attr("data-path")  + '" ';
					s += '>' + $item.text();
				} else {
					s += ' class="unfound index-' + j + '">';
				}
				
				s += '</td>';
			}
			s += '</tr>';
		}

		s += '</table>';

		let $sftpView = $(".sftp-tree-view");
		$sftpView.html(s);

		$sftpView.find(".does-not-exist-in-main-data-set").closest("tr").find(".sftp-row-checkbox").remove();
		/*
		$sftpView.find(".listing-item.index-0").each(function() {
			let fileName = $(this).text();
			let supportedFileTypes = ['.php', '.js', '.css', '.htm', '.html', '.txt', '.xml', '.json'];
			let isSupported = false;
			for(let i in supportedFileTypes) {
				let type = supportedFileTypes[i];
				if(fileName.slice(-type.length) == type) {
					isSupported = true;
					break;
				}
			}
			if(!isSupported) {
				//$(this).closest("tr").find(".sftp-row-checkbox").remove();
			}
		});
		*/
		//$sftpView.find(".listing-item.different-size").attr("title", "Click to see file diff");
	}

	_renderDirectories(connects, path, domQuery = ".directory-list") {
		let $tree = $(".sftp-tree-view");
		$tree.html(this.html.renderDirectories(connects, path));
		this._diffSftpTree();
		this._moveDirectoryListToSideBar(domQuery);
		this._removeMatches();
		this._tabelizeFiles();
		this._updateStatusBar();
	}

	_updateStatusBar() {
		let totalChecks = $(".sftp-row-checkbox").length;
		$(".sftp-footer-toolbar .status").html(totalChecks + " different code file" + (totalChecks != 1 ? 's' : '') + " found");
	}

	_removeMatches() {
		let $main = $(".all-sftp-directories .listing.index-0");
		var $listings = $(".all-sftp-directories .listing").not($main);
		let l = $listings.length;
		if(l) {
			$main.find(".listing-item").each(function() {
				let $this = $(this);
				let path = $this.attr("data-path");
				var allMatch = true;
				for(let i = 0; i < l; i++) {
					let $list = $($listings[i]);
					let $item = $list.find(".listing-item[data-path='" + path + "']");
					/**
					 * only leaving items that match in size.  We're disregarding the file create date.
					 **/
					//if(Number($item.attr("data-modifytime")) < Number($this.attr("data-modifytime")) || $item.attr("data-size") != $this.attr("data-size")) {
					if($item.attr("data-size") != $this.attr("data-size")) {
						allMatch = false;
						break;
					}
				}
				if(allMatch) {
					$(".all-sftp-directories .listing-item[data-path='" + path + "'").remove();
				}
			});
		}
	}

	_diffSftpTree() {
		let $tree = $(".sftp-tree-view");
		let $listings = $tree.find("ul.listing");
		let $primeListing = $($listings[0]);
		var _getListItemByPath = this._getListItemByPath;
		$listings.not($primeListing).each(function() {
			let $list = $(this);
			$list.find("li").each(function() {
				let $this = $(this);
				let $target = _getListItemByPath($primeListing, $this.attr("data-path"));
				if(!$target) {
					$this.addClass("does-not-exist-in-main-data-set");
				} else {
					if($this.attr("data-type") == '-') {
						let timeDiff = Number($target.attr("data-modifytime")) - Number($this.attr("data-modifytime"));
						if(timeDiff > 0) {
							$this.addClass("outdated");
						}
						let sizeDiff = Number($target.attr("data-size")) - Number($this.attr("data-size"));
						if(sizeDiff != 0) {
							$this.addClass("different-size");
						}
					}
				}
			});
		});
	}

	_getListItemByPath($list, path) {
		let $rows = $list.find("li");
		let l  = $rows.length;
		let $o;
		while(l--) {
			$o = $($rows[l]);
			if($o.attr("data-path") == path) {
				return $o;
			}
		}
	}
}