module.exports = class FileSystem {

	constructor() {
		this.fs = require('fs-extra');
	}

	writeJson(path, object, callback, spaces = 4) {
		console.log(object);
		this.fs.writeJson(path, object, { spaces: spaces }, callback);
	}

}