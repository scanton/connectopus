module.exports = class HtmlString {

	constructor(inString = '') {
		this._s = inString;
	}

	mergeData(inStr, data) {
		if(inStr) {
			let a = inStr.split("{");
			let l = a.length;
			for(let i = 1; i < l; i++) {
				let a2 = a[i].split("}");
				if(data[a2[0]]) {
					a[i] = data[a2[0]] + a2[1];
				} else {
					a[i] = a2[1];
				}
			}
		}
		return a.join('');
	}

	renderAttributes(attributes) {
		var a = [];
		for(let i in attributes) {
			a.push(i + '="' + attributes[i] + '"');
		}
		return a.join(" ");
	}

	createTag(type, inStr, data, attributes) {
		let merged = this.mergeData(inStr, data);
		let s = this.mergeData('<{tag} ' + this.renderAttributes(attributes) + '>' + merged + '</{tag}>', {tag: type})
		return new HtmlString(s);
	}

	div(inStr, data, attributes) {
		return this.createTag('div', inStr, data, attributes);
	}
	a(inStr, data, attributes) {
		return this.createTag('a', inStr, data, attributes);
	}

	toString() {
		return this._s;
	}
}