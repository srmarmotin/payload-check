class Utils {
	static TEMPLATES = {
		filters: "../templates/filters.mustache",
		table: "../templates/results.mustache",
	};

	static setLocalStorage(items = {}, callback) {
		chrome.storage.local.set(items, callback);
	}

	static async getLocalStorage(items = {}, callback) {
		return await chrome.storage.local.get(items, callback);
	}

	static resetLocalStorage(items = []) {
		chrome.storage.local.remove(items);
	}

	static getElement(elementId, property = null, by = "id") {
		switch (by) {
			case "id":
				return property
					? document.getElementById(elementId)?.[property]
					: document.getElementById(elementId);
			case "class":
				return Array.from(document.getElementsByClassName(elementId));
			case "tag":
				return property
					? document.getElementsByTagName(elementId)?.[0]?.[property]
					: document.getElementsByTagName(elementId)?.[0];
			default:
				return null;
		}
	}

	static validateUrl(url) {
		try {
			const parsedUrl = new URL(url);
			return parsedUrl;
		} catch (e) {
			return false;
		}
	}

	static async renderElement(
		elementId,
		templatePath,
		data,
		callback,
		insertMode = "innerHtml"
	) {
		try {
			if (
				!data ||
				(Array.isArray(data) && data.length === 0) ||
				(typeof data === "object" &&
					data !== null &&
					Object.keys(data).length === 0)
			) {
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
			if (!element) {
				throw new Error(`Element with ID ${elementId} not found`);
			}

			if (insertMode === "innerHtml") {
				element.innerHTML = rendered;
			} else if (insertMode === "append") {
				element.insertAdjacentHTML("beforeend", rendered);
			}

			if (callback) callback();
		} catch (error) {
			console.error("Error rendering element:", error);
		}
	}
}
