function decodeString(s) {
	var r;
	try {
		r = decodeURIComponent( escape( s ) );
	} catch (e) {
		r = decodeBytes(s, 'cp1251');
	}
	return r;
}

// populate the download popup with the torrent information
chrome.extension.sendMessage({ 'method': 'get-torrent-info', 'page': 'magnet' }, function(request) {
	var select = $('#downloadLocations');

	// add the list of download directories
	console.log(request.dirs.length);
	if (request.dirs.length === 0) {
		select.disabled = 'disabled';
	} else {
		for (var i = 0; i < request.dirs.length; i++) {
			select.append($('<option>', {
				text: decodeString(request.dirs[i].label) + " (" + request.dirs[i].dir + ")",
				value: request.dirs[i].dir
			}));
		}
	}
	console.log("DIRS");

	// events
	$('#save').click(function (e) {
		console.log(request);
		console.log(select);
		chrome.extension.sendMessage({ 'url': request.url, 'dir': select.val() });
		window.close();
	});

	$('#cancel').click(function (e) {
		window.close();
	});
});
