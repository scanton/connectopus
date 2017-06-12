module.exports = class ConnectopusController {

	constructor(model, connectionManager, htmlRenderer) {
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

	syncRows(rowIds) {
		console.log('Sync rows', rowIds);
		console.log(this.connections.getLastResult());
	}

	showModal(title, message, options) {
		$(".modal-overlay").fadeIn("fast");
		let $dialog = $(".modal-dialog");
		
		$dialog.find(".title").text(title);
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
	}

	hideModal() {
		$(".modal-overlay").fadeOut("fast");
		$(".modal-dialog").fadeOut("fast");
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

		$(".sftp-tree-view").html(s);
	}

	_renderDirectories(connects, path, domQuery = ".directory-list") {
		let $tree = $(".sftp-tree-view");
		$tree.html(this.html.renderDirectories(connects, path));
		this._diffSftpTree();
		this._moveDirectoryListToSideBar(domQuery);
		this._removeMatches();
		this._tabelizeFiles();
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
					if(Number($item.attr("data-modifytime")) < Number($this.attr("data-modifytime")) || $item.attr("data-size") != $this.attr("data-size")) {
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