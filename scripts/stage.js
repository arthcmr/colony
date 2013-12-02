/*
 * Stage Object
 * (extends paper Base object)
 */

var Stage = paper.Base.extend({

	/*
	 * Initialization
	 */

	initialize: function(element) {

		var element_jq = $('#'+element);
		var canvas = element_jq[0];
		paper.setup(canvas);

	},

	/*
	 *	Retrieve canvas width and height
	 */

	getDimensions: function() {
		return paper.view.size;
	}


});