class Navigation {
	constructor() {
		this.currentResultIndex = 0;
		this.resultsHistory = 1;
		this.isNavigationInitialized = false;
	}

	initializeNavigation() {
		Utils.getElement("prev-result")?.addEventListener("click", () => {
			this.navigateToPrevious();
		});
		Utils.getElement("next-result")?.addEventListener("click", () => {
			this.navigateToNext();
		});
	}

	removeNavigationListeners() {
		Utils.getElement("prev-result")?.removeEventListener("click");
		Utils.getElement("next-result")?.removeEventListener("click");
	}

	navigateToPrevious() {
		if (this.currentResultIndex > 0) {
			this.currentResultIndex--;
			this.showResultAtIndex(this.currentResultIndex);
		}
	}

	navigateToNext() {
		if (this.currentResultIndex < this.resultsHistory - 1) {
			this.currentResultIndex++;
			this.showResultAtIndex(this.currentResultIndex);
		}
	}

	showResultAtIndex(index) {
		const allTables = Utils.getElement("result-table", null, "class");
		allTables.forEach((table) => {
			table.style.display = "none";
		});

		this.resultsHistory = allTables.length;

		const targetTable = document.querySelector(
			`.result-table[data-result-index="${index}"]`
		);
		if (targetTable) {
			targetTable.style.display = "block";
		}

		if (!this.isNavigationInitialized) {
			this.initializeNavigation();
			this.isNavigationInitialized = true;
		}

		this.currentResultIndex = index;
		this.resultsHistory = allTables.length;
		this.updateNavigationButtons();
	}

	updateNavigationButtons() {
		const prevBtn = Utils.getElement("prev-result");
		const nextBtn = Utils.getElement("next-result");
		const currentInfo = Utils.getElement("nav-current");

		if (prevBtn) {
			prevBtn.classList.toggle("disabled", this.currentResultIndex <= 0);
		}
		if (nextBtn) {
			nextBtn.classList.toggle(
				"disabled",
				this.currentResultIndex >= this.resultsHistory - 1
			);
		}
		if (currentInfo) {
			currentInfo.textContent = `${this.currentResultIndex + 1} / ${
				this.resultsHistory
			}`;
		}
	}
}
