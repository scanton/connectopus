module.exports = class ActiveConnectionViewController {
	
	constructor(viewContainer) {
		this.$container = $(viewContainer);
	}

	renderServerAvatars(data) {
		if(data && data.length) {
			let a = [];
			for(let i in data) {
				let d = data[i];
				a.push( '<div class="server-avatar" data-id="' + d.id + '">' + d.name + ' <span class="server-status ' + d.status + '"></span><span class="glyphicon glyphicon-remove close-icon"></div>' );
			}
			this.$container.html(a.join(''));
			this.$container.closest(".server-avatars").slideDown("normal");
		} else {
			this.$container.closest(".server-avatars").slideUp("normal");
		}
		setTimeout(function() {
			$(window).resize();
		}, 400);
	}
}