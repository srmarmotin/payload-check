class Config {
	static ASSERTION_TYPES = {
		notEmpty: "Not Empty",
		equalsTo: "Equals to",
		shouldntExist: "Shouldn't Exist",
	};

	constructor() {
		this.apiUrl = null;
		this.filters = [];
		this.assertions = [];

		Utils.resetLocalStorage(["apiUrl", "filters", "assertions"]);

		this.addUrlListener();
		this.addFilterListener();
		this.addAssertionListener();
		this.assertionTypeListener();
		this.addQueryListener();
		this.addMethodListener();

		this.addFilterListeners = this.addFilterListeners.bind(this);
		this.addTableListeners = this.addTableListeners.bind(this);
	}

	addMethodListener() {
		Utils.getElement("select-method").addEventListener("change", (event) => {
			const selectedValue = event.target.value;
			if (!selectedValue) return;

			Utils.getElement("config-section", null, "class").forEach((section) => {
				section.classList.remove("active");
			});

			Utils.getElement(`add-${selectedValue}`).classList.add("active");
		});
	}

	addUrlListener() {
		Utils.getElement("save-url").addEventListener("click", () => {
			const url = Utils.getElement("input-url", "value");
			const isValidUrl = Utils.validateUrl(url);

			if (!isValidUrl) return;

			Utils.getElement("actual-url").textContent = `Checking URL: ${url}`;
			Utils.setLocalStorage({ apiUrl: url });

			Utils.getElement("input-url").value = "";
		});
	}

	addFilterListener() {
		Utils.getElement("add-filter-button").addEventListener("click", () => {
			const key = Utils.getElement("filter-field", "value");
			const value = Utils.getElement("filter-value", "value");

			if (key && value) {
				const filter = { key, value };

				Utils.getLocalStorage("filters", (data) => {
					const filters = JSON.parse(data.filters || "[]");
					filters.push(filter);
					Utils.setLocalStorage({ filters: JSON.stringify(filters) });

					Utils.renderElement(
						"filters-panel",
						Utils.TEMPLATES.filters,
						{
							filters: filters,
						},
						this.addFilterListeners
					);
				});
				this.resetInputs(["filter-field", "filter-value"]);
			}
		});
	}

	addAssertionListener() {
		Utils.getElement("add-assertion-button").addEventListener(
			"click",
			async () => {
				const key = Utils.getElement("assertion-field", "value");
				const type = Utils.getElement("assertion-type", "value");

				if (!key) return;

				let values = {
					assertion: type,
					label: Config.ASSERTION_TYPES[type],
				};

				// If the assertion type is "equalsTo", we need to get the value to compare against
				if (type === "equalsTo") {
					const assertionValue = Utils.getElement("assertion-value", "value");
					if (!assertionValue) return;

					values = {
						...values,
						value: assertionValue,
					};
				}

				const assertion = { key, values };

				Utils.getLocalStorage(["assertions"], (data) => {
					const assertions = JSON.parse(data.assertions || "[]");

					const found = assertions.findIndex(
						(item) => item.key === assertion.key
					);

					// If the assertion already exists, update it
					if (found !== -1) {
						assertions[found].values = assertion.values;
					} else {
						assertions.push(assertion);
					}
					Utils.setLocalStorage({ assertions: JSON.stringify(assertions) });

					Utils.renderElement(
						"results-panel",
						Utils.TEMPLATES.table,
						{
							rows: assertions,
						},
						this.addTableListeners
					);
				});
				this.resetInputs([
					"assertion-field",
					"assertion-type",
					"assertion-value",
				]);
			}
		);
	}

	assertionTypeListener() {
		Utils.getElement("assertion-type").addEventListener("change", (e) => {
			const selectedType = e.target.value;
			const input = Utils.getElement("assertion-value");
			input.style.display = selectedType === "equalsTo" ? "" : "none";
		});
	}

	addQueryListener() {
		Utils.getElement("add-query-button").addEventListener("click", () => {
			const queryParams = Utils.getElement("query-params", "value");
			const url = Utils.validateUrl(queryParams);

			if (url) {
				const params = new URLSearchParams(url.search);
				const assertions = Array.from(params.entries()).map(([key, value]) => ({
					key,
					values: {
						assertion: "equalsTo",
						label: Config.ASSERTION_TYPES.equalsTo,
						value,
					},
				}));

				Utils.setLocalStorage({ assertions: JSON.stringify(assertions) });
				Utils.getElement("query-params").value = "";

				Utils.renderElement(
					"results-panel",
					Utils.TEMPLATES.table,
					{
						rows: assertions,
					},
					this.addTableListeners
				);

				this.resetInputs(["query-params"]);
			}
		});
	}

	addTableListeners() {
		Utils.getElement("remove-row", null, "class").forEach((btn) => {
			btn.removeEventListener("click", () => {});
		});

		Utils.getElement("remove-row", null, "class").forEach((btn) => {
			btn.addEventListener("click", (event) => {
				const key = event.target.dataset.key;
				this.removeRow(key);
			});
		});
	}

	addFilterListeners() {
		Utils.getElement("filter-remove", null, "class").forEach((btn) => {
			btn.addEventListener("click", (event) => {
				const key = event.target.dataset.key;
				this.removeFilter(key);
			});
		});
	}

	removeRow(key) {
		Utils.getLocalStorage("assertions", (data) => {
			let assertions = JSON.parse(data.assertions || "[]");
			assertions = assertions.filter((assertion) => assertion.key !== key);

			const rows = assertions.length ? assertions : {};

			Utils.setLocalStorage({ assertions: JSON.stringify(assertions) }, () => {
				Utils.renderElement(
					"results-panel",
					Utils.TEMPLATES.table,
					rows,
					this.addTableListeners
				);
			});
		});
	}

	removeFilter(key) {
		Utils.getLocalStorage("filters", (data) => {
			let filters = JSON.parse(data.filters || "[]");
			filters = filters.filter((filter) => {
				return !(filter.key === key);
			});

			Utils.setLocalStorage({ filters: JSON.stringify(filters) }, () => {
				Utils.renderElement(
					"filters-panel",
					Utils.TEMPLATES.filters,
					{
						filters: filters,
					},
					this.addFilterListeners
				);
			});
		});
	}

	resetInputs(inputs = []) {
		inputs.forEach((input) => {
			const element = Utils.getElement(input);
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
}

document.addEventListener("DOMContentLoaded", () => {
	const config = new Config();
	const requests = new Requests();
});
