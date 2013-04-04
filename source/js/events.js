$(function () {
	//================
	// delete button

	// change the delete button to indicate if it deletes data or not
	function changeDeleteButton(event, type) {
		if (event.which === 17) {
			$('[name="torrent_remove"]').attr('class', 'torrent_button ' + type);
		}
	}

	// change delete button to indicate delete w/ data
	$(document).keydown(function () {
		changeDeleteButton(event, 'remove_data');
	});

	// change delete button to indicate just delete from list
	$(document).keyup(function (event) {
		changeDeleteButton(event, 'remove');
	});

	//=================
	// torrent filter

	// set the current torrent filter

	function applyFilter() {
		$.map(torrents, function (el, idx) {
			el.filter();
		});

		// set whether or not the no torrents status message is visible
		setStatusVisibility();
	}

	// filter torrents by type
	$('#filter_type').change(function () {
		localStorage.torrentType = this.value;
		applyFilter();
	});

	// filter torrents by name
	$('#filter_input').bind('input', function () {
		localStorage.torrentFilter = this.value;
		applyFilter();
	});

	// clear the filter when the clear button is clicked
	$('#filter_clear').click(function () {
		$(this).hide();
		$('#filter_input').val('');
		localStorage.torrentFilter = '';
		applyFilter();
	});

	// set the visibility of the clear filter button when something is typed into the filter input field
	$('#filter_input').keyup(function () {
		$('#filter_clear').css('display', (this.value === '') ? 'none' : 'block');
	});


	//=======
	// menu

	// toggle the menu
	$('#menu_button').click(function (event) {
		var isHidden = $(this).attr('class') !== 'on';
		$('#menu').toggle(isHidden);
		$(this).toggleClass('on', isHidden);
		event.stopPropagation();
	});
	
	$("#uploadBasket").click( function() {
		chrome.windows.create({ url: 'basket.html', type: 'popup', width: 384, height: 384 });
		$('#menu_button').click();
	});
	$("#fullWebUI").click( function() {
		chrome.tabs.create({ url: localStorage.server + localStorage.webPath });
		$('#menu_button').click();
	});

	//TODO: what is what actually for?
	// hide menu when something besides the menu is clicked
	//$('#menu').click(function(event) { event.stopPropagation(); });
	/*
$(document).click( function() {
	$('#menu').hide();
	$('#menu_button').attr('class', '');
});
*/

	//==============
	// turtle mode

	// toggle turtle mode
	$('#turtle_button').click(function () {
		clearTimeout(refresh);
		port.postMessage({
			args: '"alt-speed-enabled": ' + !($(this).attr('class') === 'on'),
			method: 'session-set'
		});
		refreshPopup();
	});

	$('#list_wrapper').scroll(function (e) {
		clearTimeout(refresh);
		if (this.offsetHeight + this.scrollTop === this.scrollHeight) {
			refresh = setTimeout(refreshPopup, 3000);
		}
	});
});