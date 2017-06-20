(function( $ ) {

	$("html").append("<style>.tut_subject{ background-color: #6F6 !important; }</style>");

	var renderButtons = function(buttonData) {
		return '<button class="btn btn-success ok-button">OK</button>';
	}
 
    $.fn.tut = function(title, message, buttons, arrowOptions) {
    	
    	$(".tut_subject").removeClass("tut_subject");
    	this.addClass("tut_subject");

    	var $modalOverlay = $("#tuts_my_goots_overlay");
    	var $modalMessage = $("#tuts_my_goots_message");
 		
 		if(!$modalOverlay.length) {
 			$("body").append('<div id="tuts_my_goots_overlay" style="position:absolute;top:0;bottom:0;left:0;right:0;background-color:rgba(0,0,0,0.5);z-index:20;display: none;"></div>');
 			$modalOverlay = $("#tuts_my_goots_overlay");
 		}
 		if(!$modalMessage.length) {
 			$("body").append('<div id="tuts_my_goots_message" style="position:absolute;left:20%;background-color:white;top:100px;z-index:25;padding:1em;right:20%;border-radius:5px;display:none;"><h1></h1><div class="message-container"></div><div class="button-container pull-right"></div></div>');
 			$modalMessage = $("#tuts_my_goots_message");
 		}
 		
 		$modalMessage.find("h1").html(title);
 		$modalMessage.find(".message-container").html(message);
 		$modalMessage.find('.button-container').html(renderButtons(buttons));

 		$modalOverlay.fadeIn("slow");
 		$modalMessage.slideDown("slow");
 		$modalMessage.find('.button-container .ok-button').click(function() {
 			$("#tuts_my_goots_overlay").fadeOut("slow");
    		$("#tuts_my_goots_message").slideUp("slow");
    		$(".tut_subject").removeClass("tut_subject");
 		});

        return this;
 
    };
 
}( jQuery ));