document.addEventListener("DOMContentLoaded", () => {
	document.getElementById("saveUrl").addEventListener("click", () => {
		const url = document.getElementById("urlInput").value;
		if (url) {
			document.getElementById("urlActual").textContent = `Checking URL: ${url}`;
			chrome.storage.local.set({ apiUrl: url });
		}
	});

	document.getElementById("addQueryButton").addEventListener("click", () => {
		const queryString = document.getElementById("queryList").value;
		if (queryString) {
			const url = validateUrl(queryString);
			if (url) {
				const params = new URLSearchParams(url.search);

				const queryData = Array.from(params.entries()).map(([key, value]) => ({
					key: key,
					values: {
						assertion: "equalsTo",
						value: value,
					},
				}));

				const queryDataString = JSON.stringify(queryData);
				chrome.storage.local.set({ assertions: queryDataString });

				renderElement(
					"filters",
					"table.mustache",
					{
						rows: queryData,
					},
					listenForAssertionSelect
				);
			}
		}
	});

	function listenForAssertionSelect() {
		Array.from(document.getElementsByClassName("assertion-select")).forEach(
			(select) => {
				select.addEventListener("change", (event) => {
					const key = event.target.dataset.key;
					const assertion = event.target.value;

					chrome.storage.local.get("assertions", (data) => {
						const assertions = JSON.parse(data.assertions || "[]");
						const updatedAssertions = assertions.map((item) => {
							if (item.key === key) {
								return {
									...item,
									values: { ...item.values, assertion },
								};
							}
							return item;
						});
						chrome.storage.local.set({
							assertions: JSON.stringify(updatedAssertions),
						});
					});
				});
			}
		);
	}

	function validateUrl(url) {
		try {
			const parsedUrl = new URL(url);
			return parsedUrl;
		} catch (e) {
			return false;
		}
	}

	function renderElement(target, fileTpl, data, callback) {
		fetch(fileTpl)
			.then((response) => response.text())
			.then((template) => {
				const rendered = Mustache.render(template, data);
				document.getElementById(target).innerHTML = rendered;

				if (callback) {
					callback();
				}
			});
	}
});
