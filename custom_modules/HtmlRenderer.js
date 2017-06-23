module.exports = class HtmlRenderer {

	renderDirectories(data, path) {
		if(data && path) {
			let s = '<div class="all-sftp-directories">';
			let l = data.length;
			for(let i = 0; i < l; i++) {
				s += this._renderDirectory(data[i], i, path);
			}
			return s + '</div>';
		}
	}

	renderPathLinks(path) {
		if(path && path.length) {
			let s = '<span class="path-links">';
			let a = path.split('/');
			let l = a.length;
			for(let i = 0; i < l; i++) {
				let a2 = a.slice(0, i + 1);
				if(i > 0) {
					s += ' / ';
				}
				if(i < l - 1) {
					s += '<button class="btn btn-default path-history" data-path="' + a2.join("/") + '">' + a[i] + '</button>';
				} else {
					s += '<span class="current-path">' + a[i] + '</span>';
				}
			}
			return s + '</span>';
		}
	}

	renderDiffs(tables, cons) {
		let s = '<div class="diffs"><table>';
		let count = tables.tableCount;
		let fields = tables.fields;
		let rows = tables.rows;
		let l = rows.length;
		let fieldsLength = fields.length;
		s += '<tr class="table-headers">';
		for(let i = 0; i < count; i++) {
			s += '<th class="tools-column tools-column-' + i + '">';
			if(i ==0) {
				s += '<input type="checkbox" class="check-all-visible-rows-checkbox" />';
			}
			s += '</th>';
			for(let i2 = 0; i2 < fieldsLength; i2++) {
				s += '<th data-field-id="' + i + "-" + i2 + '" class="diff-header field-id-' + i + "-" + i2 + '">' + fields[i2].name + '<div class="sort-controls">Sort: <button class="btn btn-default sort-down"><span class="glyphicon glyphicon-menu-down"></span></button><button class="btn btn-default sort-up"><span class="glyphicon glyphicon-menu-up"></span></button></div><div class="controls"></div></th>';
			}
		}
		s += '</tr>';

		for(let i = 0; i < l; i++) {
			let l2 = count;
			s += '<tr>';
			for(let i2 = 0; i2 < l2; i2++) {
				s += this.renderRow(rows[i][i2], cons[i2], fields, i2, 200, i);
			}
			s += '</tr>';
		}
		return s + '</table></div>';
	}

	renderRow(row, con, fields, index, wrapOverLength = 260, index2 = 0) {
		let s = '<td class="tools-column tools-column-' + index + '"><input type="checkbox" class="row-checkbox row-checkbox-' + index + '" /></td>';
		let l = fields.length;
		for(let i = 0; i < l; i++) {
			if(row) {
				let content = this.htmlEncode(row[fields[i].name]);
				if(content.length > wrapOverLength) {
					content = '<div class="cell-container">' + content + '</div>';
				}
				s += '<td data-field-id="' + index + '-' + i + '" class="column-' + fields[i].name + ' connection-' + con.id + ' index-' + index + ' field-id-' + index + '-' + i + '">' + content + '</td>';
			} else {
				s += '<td data-field-id="' + index + '-' + i + '" class="null-value column-' + fields[i].name + ' connection-' + con.id + ' index-' + index + ' field-id-' + index + '-' + i + '"></td>';
			}
		}
		return s + '';
	}

	renderMysqlDetails(data) {
		var s = '';
		if(data) {
			//s += '<div class="col-xs-12 col-sm-6 col-lg-4">';
			s += '<div class="panel panel-default">';
			s += '<div class="panel-heading"><h4 class="panel-title">' + data.name + '</h4></div>';
			s += '<div class="panel-body">';

			s += '<div class="input-group"><span class="input-group-addon">Host</span><input type="text" name="mysql-host" value="' + data.host + '" /></div>';
			s += '<div class="input-group"><span class="input-group-addon">Database Name</span><input type="text" name="mysql-database" value="' + data.database + '" /></div>';
			s += '<div class="input-group"><span class="input-group-addon">Userame</span><input type="text" name="mysql-username" value="' + data.username + '" /></div>';
			s += '<div class="input-group"><span class="input-group-addon">Password</span><input type="password" name="mysql-password" value="' + data.password + '" /></div>';
			s += '<button class="btn btn-default pull-right connect-to-db-button" type="submit">Connect</button>';
			//s += '</div></div></div>';
			s += '</div></div>';
		}
		return s;
	}

	renderServers(data) {
	 	var s = '';
	 	if(data.servers) {
	 		var servers = data.servers;
	 		s += '<form><ul class="list-group server-list-group">';
	 		for(var i in servers) {
	 			var server = servers[i];
	 			if(server) {
	 				s += '<li class="list-group-item" data-id="' + server.id + '"><h1 class="server-name">' + server.name + '</h1>';
	 				s += '<div class="shortcut-buttons">' + this.renderShortcuts(server.connections) + '</div>';
	 				//s += '<span class="badge">' + server.connections.length + '</span>';
	 				s += '<div class="server-details" style="display: none;">';
	 				s += this.renderServerDetails(server);
	 				s += '</div><button class="btn btn-default server-update-button pull-right" style="display: none;">Update Server Data</button><div class="clear-fix"></div></li>';
	 			}
	 		}
	 		s += '</ul></form>';
	 	}
	 	return s;
	}

	renderServerDetails(data) {
		var s = '';
		if(data) {
			s += '<div class="input-group" style="display: none;"><span class="input-group-addon">ID</span><input type="text" name="id" value="' + data.id + '" /></div>';
			s += '<div class="input-group"><span class="input-group-addon">Host</span><input type="text" name="ssh-host" value="' + data.host + '" /></div>';
			s += '<div class="input-group"><span class="input-group-addon">Port</span><input type="text" name="ssh-port" value="' + data.port + '" /></div>';
			s += '<div class="input-group"><span class="input-group-addon">Username</span><input type="text" name="ssh-username" value="' + data.username + '" /></div>';
			s += '<div class="input-group"><span class="input-group-addon">Password</span><input type="password" name="ssh-password" value="' + data.password + '" /></div>';
			if(data.connections) {
				s += '<div class="panel panel-default">';
				s += '<div class="panel-heading"><h3 class="panel-title">Database Connections</h3></div>';
				s += '<div class="panel-body">';
				for(var i in data.connections) {
					s+= this.renderMysqlDetails(data.connections[i]);
				}
				s += '</div></div>';
			}
		}
		return s;
	}
	
	renderShortcuts(data) {
		var s = '';
		for(let i in data) {
			if(data[i] && data[i].name) {
				s += '<button class="btn btn-default shortcut-button connect-to-db-shortcut-button" data-db="' + data[i].database + '">' + data[i].name + '</button>';
			}
		}
		return s;
	}

	renderTables(data, selectedItem, blockedTables = []) {
		var a = [];
		if(data && data.length) {
			for(let i in data) {
				let d = data[i];
				if(d.tables && d.tables.names && d.tables.names.length) {
					for(let i2 in d.tables.names) {
						let name = d.tables.names[i2];
						if(a.indexOf(name) == -1) {
							a.push(name);
						}
					}
				}
			}
		}
		a.sort();
		let s = '<ul class="database-tables">';
		for(let i in a) {
			let classes = [];
			let cssClass = '';
			if(blockedTables.indexOf(a[i]) > -1) {
				classes.push("blocked");
			}
			if(a[i] == selectedItem) {
				classes.push("selected");
			}
			cssClass = ' class="' + classes.join(" ") + '" ';
			s += '<li' + cssClass + '><span class="glyphicon glyphicon-list-alt"></span> ' + a[i] + '</li>';
		}
		return s + '</div>';
	}

	renderTextDiff(data, index) {
		if(!index) {
			index = 1;
		}
		let escape = require('escape-html');
		let s = '<table class="text-diffs">';
		let skip = -1;
		for(let i in data) {
			let d = data[i];
			if(d && i != skip) {
				let added = Boolean(d.added);
				let removed = Boolean(d.removed);
				let value = escape(d.value);
				if(!added && !removed) {
					s += '<tr><td class="unchanged index-0"><pre>' + value + '</pre></td><td class="unchanged index-' + index + '"><pre>' + value + '</pre></td></tr>';
				} else if(added) {
					let nextD = data[i + 1];
					if(nextD && nextD.removed) {
						s += '<tr><td class="added index-0"><pre>' + escape(nextD.value) + '</pre></td><td class="removed index-' + index + '"><pre>' + value + '</pre></td></tr>';
						skip = i + 1;
					} else {
						s += '<tr><td class="index-0"></td><td class="removed index-' + index + '"><pre>' + value + '</pre></td></tr>';
					}
				} else if(removed) {
					let nextD = data[i + 1];
					if(nextD && nextD.added) {
						s += '<tr><td class="added index-0"><pre>' + value + '</pre></td><td class="removed index-' + index + '"><pre>' + escape(nextD.value) + '</pre></td></tr>';
						skip = i + 1;
					} else {
						s += '<tr><td class="added index-0"><pre>' + value + '</pre></td><td class="index-' + index + '"></td></tr>';
					}
				}
			}
		}
		return s + '</table>';
	}

	renderServerLinks(data, isVisible = 1) {
		var s = '';
		if(data) {
			for(let i in data) {
				let d = data[i];
				s += '<li class="server-link" data-id="' + d.id + '" ' + (!isVisible ? ' style="display: none;" ' : '') + '>' + d.name + ' <button class="btn btn-success pull-right quick-connect-button">Connect</button><span class="status-icon pull-right"></span></li>';
			}
		}
		return s
	}

	renderServerFolder(name, data) {
		var s = '';
		if(name && data) {
			s += '<ul class="server-folder" data-name="' + name + '"><span class="name"><span class="glyphicon glyphicon-folder-close"></span> ' + name + '</span>';
			s += this.renderServerLinks(data, 0);
			s += '</ul>';
		}
		return s;
	}

	renderServerReference(data) {
		var s = '<ul class="server-reference">';
		if(data.folders) {
			for(let i in data.folders) {
				var folder = data.folders[i];
				if(folder.servers) {
					s += this.renderServerFolder(folder.name, folder.servers);
				}
			}
		}
		if(data.servers) {
			s += this.renderServerLinks(data.servers);
		}
		return s + '</ul>';
	}

	renderSingleServer(data) {
		return this.renderServers({servers: [data]});
	}

	htmlEncode(str) {
		return $('<div/>').text(str).html();
	}

	htmlDecode(str){
		return $('<div/>').html(str).text();
	}

	_renderDirectory(dir, index, path) { 
		let s = '<div class="directory connection-' + dir.id + '" data-connection="' + dir.id + '">';
		let l = dir.directory.length;
		for(let i = 0; i < l; i++) {
			if(dir.directory[i].path == path) {
				s += this._renderListings(dir.directory[i], index);
			}
		}
		return s + '</div>';
	}

	_renderListings(list, index) {
		let s = '<ul class="listing index-' + index + '">';
		let fileList = '';
		let l = list.listing.length;
		for(let i = 0; i < l; i++) {
			let item = list.listing[i];
			let itemString = '';
			itemString += '<li class="listing-item listing-type-' + item.type + '" data-accessTime="' + item.accessTime + '"';
			itemString += ' data-group="' + item.group + '"';
			itemString += ' data-modifyTime="' + item.modifyTime + '"';
			itemString += ' data-name="' + item.name + '"';
			itemString += ' data-owner="' + item.owner + '"';
			itemString += ' data-rights-user="' + item.rights.user + '"';
			itemString += ' data-rights-group="' + item.rights.group + '"'
			itemString += ' data-rights-other="' + item.rights.other + '"';
			itemString += ' data-size="' + item.size + '"';
			itemString += ' data-type="' + item.type + '"';
			itemString += ' data-path="' + list.path + '/' + item.name + '"';
			itemString += ' >';
			if(item.type == 'd') {
				itemString += '<span class="glyphicon glyphicon-folder-close"></span> ';
			} else if (item.type == '-') {
				itemString += '<span class="glyphicon glyphicon-file"></span> ';
			} else {
				itemString += '<span class="glyphicon glyphicon-question-sign"></span> ';
			}
			itemString += item.name;
			itemString += '</li>';
			
			if(item.type == 'd') {
				s += itemString;
			} else {
				fileList += itemString;
			}
			
			//s += itemString;
		}
		s += fileList;
		return s + '</ul>';
	}
}