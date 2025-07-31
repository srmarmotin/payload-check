chrome.devtools.network.onRequestFinished.addListener((request) => {
	if (request.request && request.request.url) {
		const url = new URL(request.request.url);
		const params = Array.from(url.searchParams.entries())
			.map(([key, value]) => `${key}: ${value}`)
			.join("\n");
		const out = document.getElementById("output");
		if (params) {
			out.textContent += `Query Params:\n${params}\n\n`;
		}
	}
});
