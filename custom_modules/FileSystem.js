module.exports = class FileSystem extends EventEmitter {

	constructor() {
		super();
		this.fs = require('fs-extra');
	}

	writeJson(path, object, callback, spaces = 4) {
		this.fs.writeJson(path, object, { spaces: spaces }, callback);
	}

}