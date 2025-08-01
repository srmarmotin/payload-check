async function renderFilters() {
	try {
		const filters = await getFiltersFromStorage();
		const template = await loadFiltersTemplate();
		const rendered = Mustache.render(template, { filters: filters });
		document.getElementById("filters").innerHTML = rendered;
		addFilterRemoveListeners();
	} catch (error) {
		console.error("Error rendering filters:", error);
	}
}

function addFilterRemoveListeners() {
	const removeButtons = document.querySelectorAll(".filter-remove");
	removeButtons.forEach((button) => {
		button.addEventListener("click", function () {
			const filterKey = this.getAttribute("data-key");
			removeFilter(filterKey);
		});
	});
}

async function getFiltersFromStorage() {
	// This is a placeholder - you'll need to implement based on your Chrome storage structure
	// Example structure:
	return chrome.storage.local.get("filters", (data) => {
		return JSON.parse(data.filters || "[]");
	});
}

// Function to remove a filter
async function removeFilter(key) {
	try {
		// Remove from Chrome storage (implement based on your storage structure)
		await removeFilterFromStorage(key);

		// Re-render filters
		await renderFilters();
	} catch (error) {
		console.error("Error removing filter:", error);
	}
}

// Function to remove filter from Chrome storage (implement based on your storage structure)
async function removeFilterFromStorage(key) {
	// This is a placeholder - implement based on your Chrome storage structure
	console.log("Removing filter with key:", key);
}
