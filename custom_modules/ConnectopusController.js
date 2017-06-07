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

	_moveDirectoryListToSideBar(domQuery) {
		let $container = $(domQuery);
		let $list = $(".all-sftp-directories .listing-type-d").remove();
		$list.sort(function(a, b) {
			let ap = a.getAttribute("data-path").toLowerCase();
			let bp = b.getAttribute("data-path").toLowerCase();
			if(ap > bp) {
				return 1
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

	_renderDirectories(connects, path, domQuery = ".directory-list") {
		$(".sftp-tree-view").html(this.html.renderDirectories(connects, path));
		this._diffSftpTree();
		this._moveDirectoryListToSideBar(domQuery);
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