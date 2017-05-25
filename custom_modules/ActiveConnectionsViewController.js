module.exports = class ActiveConnectionViewController {
	
	constructor(viewContainer) {
		this.$container = $(viewContainer);
	}

	renderServerAvatars(data) {
		if(data && data.length) {
			let a = [];
			let count = 0;
			for(let i in data) {
				let d = data[i];
				let icon = count == 0 ? '<span class="glyphicon glyphicon-king"></span>' : '<span class="glyphicon glyphicon-pawn hide-on-hover"></span><span title="Promote to Master" class="glyphicon glyphicon-king display-on-hover make-king-icon"></span>';
				a.push( '<div class="server-avatar server-avatar-' + i + '" data-id="' + d.id + '">' + icon + ' ' + d.name + ' <span class="server-status ' + d.status + '"></span><span class="glyphicon glyphicon-remove close-icon"></div>' );
				++count;
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