document.addEventListener("DOMContentLoaded", () => {
	document.getElementById("saveUrl").addEventListener("click", () => {
		const url = document.getElementById("urlInput").value;
		if (url) {
			document.getElementById("urlActual").value = url;
			chrome.storage.local.set({ apiUrl: url });
		}
	});
});
