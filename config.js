document.addEventListener("DOMContentLoaded", () => {
	chrome.storage.local.remove(["apiUrl", "filters", "assertions"]);

	document.getElementById("saveUrl").addEventListener("click", () => {
		const url = document.getElementById("urlInput").value;
		if (url) {
			document.getElementById("urlActual").textContent = `Checking URL: ${url}`;
			chrome.storage.local.set({ apiUrl: url });
		}
	});

	document.getElementById("addFilter").addEventListener("click", () => {
		const key = document.getElementById("filterField").value;
		const value = document.getElementById("filterValue").value;

		if (key && value) {
			const filter = { key, value };

			chrome.storage.local.get("filters", (data) => {
				const filters = JSON.parse(data.filters || "[]");
				filters.push(filter);
				chrome.storage.local.set({ filters: JSON.stringify(filters) });
			});

			renderElement("filters", "filters.mustache", { filters: [filter] });
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

				chrome.storage.local.set({ assertions: JSON.stringify(queryData) });
				document.getElementById("queryList").value = "";

				renderElement(
					"assertions",
					"table.mustache",
					{
						rows: queryData,
					},
					addTableListeners
				);
			}
		}
	});

	document
		.getElementById("methodSelect")
		.addEventListener("change", function () {
			const selectedValue = this.value;

			Array.from(document.getElementsByClassName("filter-section")).forEach(
				(section) => {
					section.classList.remove("active");
				}
			);

			document.getElementById(selectedValue).classList.add("active");
		});

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

	function addTableListeners() {
		document.getElementById("cleanTable").addEventListener("click", () => {
			Array.from(document.getElementsByClassName("table-results")).forEach(
				(tr) => {
					tr.classList.remove("success", "error");
				}
			);
		});
	}
});
