module.exports = function() {
	if(!remote) {
		let remote = require('electron').remote;
	}
	let {Menu, MenuItem} = remote;

	let menu = new Menu()
	let menuItem = new MenuItem({
		label: 'Inspect Element',
		click: () => {
			remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y);
		}
	})
	menu.append(menuItem);

	window.addEventListener('contextmenu', (e) => {
		e.preventDefault()
		rightClickPosition = {x: e.x, y: e.y}
		menu.popup(remote.getCurrentWindow())
	}, false);
};