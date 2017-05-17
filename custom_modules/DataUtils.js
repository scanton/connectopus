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
		console.log(this.clone(tables));
		/*
		let t1 = this.clone(table1);
		let t2 = this.clone(table2);
		let a = [];
		let l = t1.length;
		for(let i in t1) {

		}
		return a;
		*/
	}
}