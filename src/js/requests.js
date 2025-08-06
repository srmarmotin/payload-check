class Requests {
	constructor() {
		this.apiUrl = null;
		this.requestFinishedListener();
	}

	async requestFinishedListener() {
		chrome.devtools.network.onRequestFinished.addListener(async (request) => {
			this.apiUrl = "https://saa.paramountplus.com/";
			//this.apiUrl || (await Utils.getLocalStorage("apiUrl")).apiUrl;
			if (request.request && request.request.url && this.apiUrl) {
				if (request.request.url.startsWith(this.apiUrl)) {
					const url = new URL(request.request.url);
					const params = new URLSearchParams(url.search);

					let { filters } = await chrome.storage.local.get("filters");
					filters = filters ? JSON.parse(filters) : [];
					const matchesFilters = this.checkFilters(params, filters);

					if (matchesFilters) {
						await this.processAssertions(params, request.request.url);
					}
				}
			}
		});
	}

	checkFilters(params, filters) {
		if (!filters || filters.length === 0) {
			// If no filters are set, consider all requests as matching
			return true;
		}
		return filters.every((filter) => {
			const paramValue = params.get(filter.key);

			if (paramValue === null) {
				return false;
			}

			console.log("Checking request against filters:", filter, paramValue);
			return paramValue === filter.value || paramValue.includes(filter.value);
		});
	}

	async processAssertions(params) {
		let { assertions } = await chrome.storage.local.get("assertions");
		assertions = assertions ? JSON.parse(assertions) : [];

		if (assertions.length === 0) return;

		const results = assertions.map((assertion) => {
			const paramValue = params.get(assertion.key);

			const assertionType = assertion.values?.assertion || "notEmpty";
			const expectedValue = assertion.values?.value;

			let assertionResult = false;

			switch (assertionType) {
				case "notEmpty":
					assertionResult = paramValue !== null && paramValue !== "";
					break;
				case "equalsTo":
					assertionResult = paramValue === expectedValue;
					break;
				case "shouldntExist":
					assertionResult = paramValue === null;
					break;
				default:
					console.error("Unknown assertion type:", assertionType);
			}

			return {
				...assertion,
				result: assertionResult,
			};
		});

		Utils.renderElement(
			"results",
			"../templates/table.mustache",
			{
				rows: results,
			},
			null,
			"append"
		);
	}
}
