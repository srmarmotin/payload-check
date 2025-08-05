chrome.devtools.network.onRequestFinished.addListener(async (request) => {
	const { apiUrl } = await chrome.storage.local.get("apiUrl");
	console.log("Request finished:", apiUrl);

	if (request.request && request.request.url && apiUrl) {
		if (request.request.url.startsWith(apiUrl)) {
			const url = new URL(request.request.url);
			const params = new URLSearchParams(url.search);

			let { filters } = await chrome.storage.local.get("filters");
			filters = filters ? JSON.parse(filters) : [];
			const matchesFilters = checkRequestAgainstFilters(params, filters);

			if (matchesFilters) {
				processAssertions(params);
			}
		}
	}
});

function checkRequestAgainstFilters(params, filters) {
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
		// Check if the parameter value matches the filter value
		// You can modify this logic based on your filtering requirements
		return paramValue === filter.value || paramValue.includes(filter.value);
	});
}

async function processAssertions(params) {
	let { assertions } = await chrome.storage.local.get("assertions");
	assertions = assertions ? JSON.parse(assertions) : [];

	assertions.forEach((assertion) => {
		const paramValue = params.get(assertion.key);
		console.log("Processing assertion:", assertion, "Param Value:", paramValue);
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
				console.warn("Unknown assertion type:", assertionType);
		}
		const row = document.querySelector(`tr[data-row="${assertion.key}"]`);
		console.log("Row:", row, "Assertion Result:", assertionResult);
		if (row) {
			if (assertionResult) {
				row.classList.add("success");
				row.classList.remove("error");
				// Remove hover listeners if they exist
				removeErrorHoverListeners(row);
			} else {
				row.classList.add("error");
				row.classList.remove("success");
				// Add hover listeners and store error data
				addErrorHoverListeners(row, expectedValue, paramValue, assertionType);
			}
		}
	});
}

/**
 * Add hover listeners to error rows for popup functionality
 * @param {HTMLElement} row - The table row element
 * @param {string} expectedValue - The expected value for the assertion
 * @param {string} receivedValue - The actual received value
 * @param {string} assertionType - The type of assertion
 */
function addErrorHoverListeners(
	row,
	expectedValue,
	receivedValue,
	assertionType
) {
	// Remove existing listeners first
	removeErrorHoverListeners(row);

	// Store error data on the row for easy access
	row._errorData = {
		expected: expectedValue,
		received: receivedValue,
		assertionType: assertionType,
	};

	// Create hover functions
	const showPopup = (event) => {
		const popup = document.getElementById("error-popup");
		if (popup && row._errorData) {
			// Update popup content
			const expectedSpan = popup.querySelector(".expected-value");
			const receivedSpan = popup.querySelector(".received-value");

			if (expectedSpan && receivedSpan) {
				expectedSpan.textContent = formatValueForDisplay(
					row._errorData.expected,
					row._errorData.assertionType
				);
				receivedSpan.textContent = formatValueForDisplay(
					row._errorData.received,
					row._errorData.assertionType
				);
			}

			// Position popup relative to the row
			const rowRect = row.getBoundingClientRect();
			popup.style.left = `${rowRect.left + rowRect.width / 2}px`;
			popup.style.top = `${rowRect.bottom + 5}px`;
			popup.style.transform = "translateX(-50%)";
			popup.style.display = "block";
		}
	};

	const hidePopup = () => {
		const popup = document.getElementById("error-popup");
		if (popup) {
			popup.style.display = "none";
		}
	};

	// Store function references for removal
	row._showPopup = showPopup;
	row._hidePopup = hidePopup;

	// Add event listeners
	row.addEventListener("mouseenter", showPopup);
	row.addEventListener("mouseleave", hidePopup);
}

/**
 * Remove hover listeners from a row
 * @param {HTMLElement} row - The table row element
 */
function removeErrorHoverListeners(row) {
	if (row._showPopup) {
		row.removeEventListener("mouseenter", row._showPopup);
		row._showPopup = null;
	}
	if (row._hidePopup) {
		row.removeEventListener("mouseleave", row._hidePopup);
		row._hidePopup = null;
	}
	if (row._errorData) {
		row._errorData = null;
	}
}

/**
 * Format a value for display in the popup
 * @param {any} value - The value to format
 * @param {string} assertionType - The type of assertion
 * @returns {string} - Formatted value for display
 */
function formatValueForDisplay(value, assertionType) {
	if (assertionType === "shouldntExist" && value === null) {
		return "(parameter should not exist)";
	}

	if (value === null) {
		return "(null/missing)";
	}

	if (value === "") {
		return "(empty string)";
	}

	if (value === undefined) {
		return "(undefined)";
	}

	return `"${value}"`;
}
