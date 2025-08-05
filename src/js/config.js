document.addEventListener("DOMContentLoaded", () => {
	chrome.storage.local.remove(["apiUrl", "filters", "assertions"]);

	document.getElementById("save-url").addEventListener("click", () => {
		const url = document.getElementById("input-url").value;
		const isValidUrl = validateUrl(url);

		if (!isValidUrl) return;

		document.getElementById("actual-url").textContent = `Checking URL: ${url}`;
		chrome.storage.local.set({ apiUrl: url });
		url.value = "";
	});

	document.getElementById("add-filter-button").addEventListener("click", () => {
		const key = document.getElementById("filter-field").value;
		const value = document.getElementById("filter-value").value;

		if (key && value) {
			const filter = { key, value };

			chrome.storage.local.get("filters", (data) => {
				const filters = JSON.parse(data.filters || "[]");
				filters.push(filter);
				chrome.storage.local.set({ filters: JSON.stringify(filters) });

				renderElement(
					"filters-panel",
					"../templates/filters.mustache",
					{
						filters: filters,
					},
					addFilterListeners
				);
			});
			resetInputs(["filter-field", "filter-value"]);
		}
	});

	document
		.getElementById("add-assertion-button")
		.addEventListener("click", async () => {
			const key = document.getElementById("assertion-field").value;
			const type = document.getElementById("assertion-type").value;

			if (!key) return;

			let values = {
				assertion: type,
				label: type.split(/(?=[A-Z])/).join(" "),
			};

			if (type === "equalsTo") {
				const assertionValue = document.getElementById("assertion-value").value;
				if (!assertionValue) return;

				values = {
					...values,
					value: assertionValue,
				};
			}

			const assertion = { key, values };

			chrome.storage.local.get(["assertions"], (data) => {
				let assertions;
				try {
					assertions =
						typeof data.assertions === "string"
							? JSON.parse(data.assertions || "[]")
							: Array.isArray(data.assertions)
							? data.assertions
							: [];
				} catch (e) {
					assertions = [];
				}

				const found = assertions.findIndex(
					(item) => item.key === assertion.key
				);

				if (found !== -1) {
					assertions[found].values = assertion.values;
				} else {
					assertions.push(assertion);
				}
				chrome.storage.local.set({ assertions: JSON.stringify(assertions) });

				renderElement(
					"results-panel",
					"../templates/table.mustache",
					{
						rows: assertions,
					},
					addTableListeners
				);
			});
			resetInputs(["assertion-field", "assertion-type", "assertion-value"]);
		});

	document
		.getElementById("assertion-type")
		.addEventListener("change", function () {
			const valueInput = document.getElementById("assertion-value");
			valueInput.style.display = this.value === "equalsTo" ? "" : "none";
		});

	document.getElementById("add-query-button").addEventListener("click", () => {
		const queryParams = document.getElementById("query-params").value;
		const url = validateUrl(queryParams);

		if (url) {
			const params = new URLSearchParams(url.search);
			const assertions = Array.from(params.entries()).map(([key, value]) => ({
				key,
				values: {
					assertion: "equalsTo",
					label: "Equals to",
					value,
				},
			}));

			chrome.storage.local.set({ assertions: JSON.stringify(assertions) });
			document.getElementById("query-params").value = "";

			renderElement(
				"results-panel",
				"../templates/table.mustache",
				{
					rows: assertions,
				},
				addTableListeners
			);

			resetInputs(["query-params"]);
		}
	});

	document
		.getElementById("select-method")
		.addEventListener("change", (event) => {
			const selectedValue = event.target.value;
			if (!selectedValue) return;

			Array.from(document.getElementsByClassName("config-section")).forEach(
				(section) => {
					section.classList.remove("active");
				}
			);

			document.getElementById(`add-${selectedValue}`).classList.add("active");
		});
});

function validateUrl(url) {
	try {
		const parsedUrl = new URL(url);
		return parsedUrl;
	} catch (e) {
		return false;
	}
}

async function renderElement(elementId, templatePath, data, callback) {
	try {
		if (!data) {
			document.getElementById(elementId).innerHTML = "";
			return;
		}

		const response = await fetch(templatePath);
		if (!response.ok) {
			throw new Error(`Failed to fetch template: ${response.statusText}`);
		}

		const template = await response.text();
		const rendered = Mustache.render(template, data);

		const element = document.getElementById(elementId);
		element.innerHTML = rendered;
		if (callback) callback();
	} catch (error) {
		console.error("Error rendering element:", error);
	}
}
function addTableListeners() {
	document.getElementById("clean-table").addEventListener("click", () => {
		Array.from(document.getElementsByClassName("table-results")).forEach(
			(tr) => {
				tr.classList.remove("success", "error");
			}
		);
	});

	Array.from(document.getElementsByClassName("remove-row")).forEach((btn) => {
		btn.addEventListener("click", (event) => {
			const key = event.target.dataset.key;
			removeRow(key);
		});
	});
}

function addFilterListeners() {
	Array.from(document.getElementsByClassName("filter-remove")).forEach(
		(btn) => {
			btn.addEventListener("click", (event) => {
				const key = event.target.dataset.key;
				removeFilter(key);
			});
		}
	);
}

function removeRow(key) {
	chrome.storage.local.get("assertions", (data) => {
		let assertions = JSON.parse(data.assertions || "[]");
		assertions = assertions.filter((assertion) => assertion.key !== key);

		chrome.storage.local.set({ assertions: JSON.stringify(assertions) }, () => {
			renderElement(
				"results-panel",
				"../templates/table.mustache",
				{
					rows: assertions,
				},
				addTableListeners
			);
		});
	});
}

function removeFilter(key) {
	chrome.storage.local.get("filters", (data) => {
		let filters = JSON.parse(data.filters || "[]");
		filters = filters.filter((filter) => {
			return !(filter.key === key);
		});

		chrome.storage.local.set({ filters: JSON.stringify(filters) }, () => {
			renderElement(
				"filters-panel",
				"../templates/filters.mustache",
				{
					filters: filters,
				},
				addFilterListeners
			);
		});
	});
}

function resetInputs(inputs = []) {
	inputs.forEach((input) => {
		const element = document.getElementById(input);
		if (element) {
			if (element.type === "text") {
				element.value = "";
			}
			if (element.type === "select-one") {
				element.selectedIndex = 0;
				element.dispatchEvent(new Event("change"));
			}
		}
	});
}
