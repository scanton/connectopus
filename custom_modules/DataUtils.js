module.exports = class DataUtils {

	static objectsMatch(obj1, obj2) {
		for(let i in obj1) {
			if(obj1[i] != obj2[i]) {
				return false;
			}
		}
		return true;
	}

	static isObjectInArray(obj, arr) {
		let l = arr.length;
		while(l--) {
			if(this.objectsMatch(obj, arr[l])) {
				return true;
			}
		}
		return false;
	}

	static removeObjectFromArray(obj, arr) {
		let l = arr.length;
		while(l--) {
			if(this.objectsMatch(obj, arr[l])) {
				arr = this.removeFromArray(arr, l);
				return arr;
			}
		}
		return arr;
	}

	static removeFromArray(arr, index) {
		return arr.slice(index, 1);
	}

	static clone(obj) {
		return JSON.parse(JSON.stringify(obj));
	}

	static diff(tables) {
		let a = [];
		let data = this.clone(tables);
		let l = data.length;
		if(l > 1) {
			for(let i = 1; i < l; i++) {
				a.push(this._removeMatches(data[0], data[i]));
			}
		}
		return this._formatRows(a);
	}

	static _formatRows(tables) {
		let o = {rows: []}
		if(tables && tables.length && tables[0][0].fields[0]) {
			let primaryKeyFieldName = tables[0][0].fields[0].name;
			o.fields = tables[0][0].fields;
			o.primaryKey = primaryKeyFieldName;
			let l = tables.length;
			for(let i = 0; i < l; i++) {
				let tableGroup = tables[i];
				this._addRows(o.rows, tableGroup[0], 0, primaryKeyFieldName);
				this._addRows(o.rows, tableGroup[1], i + 1, primaryKeyFieldName);
			}
		}
		return o;
	}

	static _addRows(arr, table, index, key) {
		if(table && table.results) {
			let l = table.results.length;
			while(l--) {
				let r = table.results[l];
				let i = this._getRowIndex(arr, r[key]);
				if(i != -1) {
					arr[i][index] = r;
				} else {
					let a = [];
					a.id = r[key];
					a[index] = r;
					arr.push(a);
				}
			}
		}
	}

	static _getRowIndex(arr, id) {
		if(arr && arr.length) {
			let l = arr.length;
			while(l--) {
				if(arr[l].id == id) {
					return l;
				}
			}
		}
		return -1;
	}

	static _removeMatches(table1, table2) {
		if(table1 && table1.results && table2 && table2.results) {
			table1 = this.clone(table1);
			table2 = this.clone(table2);
			var l2;
			var l = table1.results.length;
			while(l--) {
				l2 = table2.results.length;
				while(l2--) {
					if(this.objectsMatch(table1.results[l], table2.results[l2])) {
						table1.results.splice(l, 1);
						table2.results.splice(l2, 1);
						break;
					}
				}
			}
		}
		return [table1, table2];
	}
}