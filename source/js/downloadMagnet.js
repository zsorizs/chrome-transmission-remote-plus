
// populate the download popup with the torrent information
chrome.extension.sendMessage({ 'method': 'get-torrent-info', 'page': 'magnet' }, function(request) {
	var oSelect = $('#downloadLocations');

	// add the list of download directories
	if (request.dirs.length === 0) {
		oSelect.attr('disabled', 'disabled');

		// create the default directory download option
		var oOption = $('<option></option>');
		oOption.text('< Default Directory >');
		oOption.val('');

		oSelect.append(oOption);
	} else {
		for (var i = 0, dir; dir = request.dirs[i]; ++i) {

			var oOption = $('<option></option>');
			oOption.text(dir.label);
			oOption.val(dir.dir);

			oSelect.append(oOption, null);
		}
	}

	// events
	$('#save').click(function (e) {
		chrome.extension.sendMessage({ 'url': request.url, 'dir': oSelect.val() });
		window.close();
	});

	$('#cancel').click(function (e) {
		window.close();
	});
});
