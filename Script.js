class InventoryWebsite {
    constructor() {
        this.apiUrl = 'http://127.0.0.1:5000/api/inventory'; 
        this.products = [];
        this.categories = new Set();
        this.init();
    }

    async init() {
        await this.loadInventory();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    async loadInventory() {
        try {
            this.showLoading();
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error(response.status);

            this.products = await response.json();
            this.updateCategories();
            this.render();
            this.updateLastUpdated();
        } catch (err) {
            console.error(err);
            this.showError("Unable to load inventory");
        } finally {
            this.hideLoading();
        }
    }

    updateCategories() {
        this.categories.clear();
        this.products.forEach(p => p.category && this.categories.add(p.category));
        this.updateCategoryFilter();
    }

    updateCategoryFilter() {
        const filter = document.getElementById("categoryFilter");
        while (filter.children.length > 1) filter.removeChild(filter.lastChild);

        this.categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            filter.appendChild(opt);
        });
    }

    render() {
        this.updateSummaryCards();
        this.renderTable();
    }

    updateSummaryCards() {
        document.getElementById("totalProducts").textContent = this.products.length;

        const totalQty = this.products.reduce(
            (sum, p) => sum + Number(p.quantity || 0), 0
        );

        document.getElementById("totalQuantity").textContent = totalQty;
        document.getElementById("totalValue").textContent = "—";
    }

    renderTable() {
        const body = document.getElementById("tableBody");
        const search = document.getElementById("searchInput").value.toLowerCase();
        const category = document.getElementById("categoryFilter").value;

        body.innerHTML = "";

        this.products
            .filter(p =>
                (!search ||
                    p.name.toLowerCase().includes(search) ||
                    (p.supplier || "").toLowerCase().includes(search)) &&
                (!category || p.category === category)
            )
            .forEach(p => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><strong>${this.escapeHtml(p.name)}</strong></td>
                    <td>${this.escapeHtml(p.category)}</td>
                    <td>${p.quantity}</td>
                    <td>${this.escapeHtml(p.supplier || "N/A")}</td>
                    <td>${this.escapeHtml(p.Status || "N/A")}</td>
                    <td>${this.formatDate(p.date_added)}</td>
                `;
                body.appendChild(row);
            });
    }

    setupEventListeners() {
        document.getElementById("refreshBtn").onclick = () => this.loadInventory();
        document.getElementById("searchInput").oninput = () => this.renderTable();
        document.getElementById("categoryFilter").onchange = () => this.renderTable();
    }

    startAutoRefresh() {
        setInterval(() => this.loadInventory(), 30000);
    }

    updateLastUpdated() {
        document.getElementById("lastUpdated").textContent =
            `Last updated: ${new Date().toLocaleTimeString()}`;
    }

    showLoading() {
        document.getElementById("loading").style.display = "block";
    }

    hideLoading() {
        document.getElementById("loading").style.display = "none";
    }

    showError(msg) {
        alert(msg);
    }

    escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, m =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
        );
    }

    formatDate(d) {
        if (!d) return "N/A";
        const dt = new Date(d);
        return dt.toLocaleDateString() + " " + dt.toLocaleTimeString();
    }
}

document.addEventListener("DOMContentLoaded", () => new InventoryWebsite());
