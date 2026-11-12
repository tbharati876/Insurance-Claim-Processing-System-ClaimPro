
document.addEventListener("DOMContentLoaded", () => {
    // ---------------------------------------
    // DOM ELEMENTS AND APPLICATION STATE
    // ---------------------------------------

    const $ = (id) => document.getElementById(id);

    let selectedClaimId = null;
    let currentPage = "dashboard";

    const pageInfo = {
        dashboard: ["Dashboard", "Overview of your claim processing activity"],
        "file-claim": ["File a Claim", "Submit a new insurance claim"],
        claims: ["Claims", "View and manage all insurance claims"],
        "claim-detail": ["Claim Details", "View complete information about a claim"],
        review: ["Review & Approval", "Review submitted claims and make decisions"],
        settlement: ["Settlement", "Manage approved claim settlements"],
        documents: ["Documents", "Manage claim-related documents"],
        reports: ["Reports", "View claim statistics and reports"],
        login: ["Login", "Sign in to your ClaimPro account"],
        register: ["Register", "Create a ClaimPro account"]
    };

    // ---------------------------------------
    // GENERAL HELPERS
    // ---------------------------------------

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };
            return entities[character];
        });
    }

    function showToast(message, type = "success") {
        const toast = $("toast");
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast show ${type}`;

        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    function getStatusClass(status) {
        return String(status || "")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-");
    }

    function statusBadge(status) {
        return `<span class="status-badge ${escapeHTML(getStatusClass(status))}">${escapeHTML(status)}</span>`;
    }

    function getClaimById(id) {
        return getClaims().find((claim) => String(claim.id) === String(id));
    }

    function addHistory(claim, message) {
        if (!Array.isArray(claim.history)) {
            claim.history = [];
        }

        claim.history.push({
            date: new Date().toISOString(),
            message
        });
    }

    function safeDate(value) {
        if (!value) return "—";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return escapeHTML(value);

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function emptyRow(message, columns) {
        return `<tr><td colspan="${columns}" class="empty-message">${escapeHTML(message)}</td></tr>`;
    }

    function updateUserInterface() {
        const user = getStoredData(STORAGE_KEYS.currentUser, null);

        if ($("topUserName")) {
            $("topUserName").textContent = user ? user.name : "Guest User";
        }

        if ($("topUserRole")) {
            $("topUserRole").textContent = user ? user.role : "Guest";
        }

        if ($("userAvatar")) {
            $("userAvatar").textContent = user
                ? (user.name || "U").charAt(0).toUpperCase()
                : "G";
        }

        if ($("logoutBtn")) {
            $("logoutBtn").style.display = user ? "" : "none";
        }
    }

    // ---------------------------------------
    // NAVIGATION
    // ---------------------------------------

    function navigateTo(page) {
        if (!pageInfo[page]) page = "dashboard";

        currentPage = page;

        document.querySelectorAll(".page-section").forEach((section) => {
            section.classList.toggle("active", section.id === page);
        });

        document.querySelectorAll("[data-page]").forEach((link) => {
            link.classList.toggle("active", link.dataset.page === page);
        });

        if ($("pageTitle")) {
            $("pageTitle").textContent = pageInfo[page][0];
        }

        if ($("pageSubtitle")) {
            $("pageSubtitle").textContent = pageInfo[page][1];
        }

        $("sidebar")?.classList.remove("open");

        if (page === "dashboard") renderDashboard();
        if (page === "claims") renderClaims();
        if (page === "claim-detail") renderClaimDetail();
        if (page === "review") renderReviews();
        if (page === "settlement") renderSettlements();
        if (page === "documents") renderDocuments();
        if (page === "reports") renderReports();
    }

    document.addEventListener("click", (event) => {
        const pageLink = event.target.closest("[data-page]");
        const goLink = event.target.closest("[data-go]");

        if (pageLink) {
            event.preventDefault();
            navigateTo(pageLink.dataset.page);
            return;
        }

        if (goLink) {
            event.preventDefault();
            navigateTo(goLink.dataset.go);
        }
    });

    $("mobileMenuBtn")?.addEventListener("click", () => {
        $("sidebar")?.classList.toggle("open");
    });

    // ---------------------------------------
    // THEME
    // ---------------------------------------

    function applyTheme(theme) {
        document.body.classList.toggle("dark-mode", theme === "dark");

        const icon = $("themeToggle")?.querySelector("i");
        if (icon) {
            icon.className = theme === "dark"
                ? "fas fa-sun"
                : "fas fa-moon";
        }
    }

    const savedTheme = localStorage.getItem("claimpro_theme") || "light";
    applyTheme(savedTheme);

    $("themeToggle")?.addEventListener("click", () => {
        const nextTheme = document.body.classList.contains("dark-mode")
            ? "light"
            : "dark";

        localStorage.setItem("claimpro_theme", nextTheme);
        applyTheme(nextTheme);
    });

    // ---------------------------------------
    // DASHBOARD
    // ---------------------------------------

    function renderDashboard() {
        const claims = getClaims();

        const total = claims.length;
        const underReview = claims.filter((c) => c.status === "Under Review").length;
        const approved = claims.filter((c) => c.status === "Approved").length;
        const pending = claims.filter((c) => c.status === "Pending" || c.status === "Filed").length;
        const rejected = claims.filter((c) => c.status === "Rejected").length;
        const settled = claims.filter((c) => c.status === "Settled").length;

        if ($("totalClaims")) $("totalClaims").textContent = total;
        if ($("underReviewClaims")) $("underReviewClaims").textContent = underReview;
        if ($("approvedClaims")) $("approvedClaims").textContent = approved;
        if ($("pendingClaims")) $("pendingClaims").textContent = pending;
        if ($("rejectedClaims")) $("rejectedClaims").textContent = rejected;
        if ($("totalSettlements")) $("totalSettlements").textContent = settled;

        const recent = [...claims].reverse().slice(0, 5);

        if ($("recentClaimsTable")) {
            $("recentClaimsTable").innerHTML = recent.length
                ? recent.map((claim) => `
                    <tr>
                        <td>${escapeHTML(claim.claim_number)}</td>
                        <td>${escapeHTML(claim.claimant_name)}</td>
                        <td>${escapeHTML(claim.claim_type)}</td>
                        <td>${formatCurrency(Number(claim.amount) || 0)}</td>
                        <td>${statusBadge(claim.status)}</td>
                        <td>
                            <button class="btn-icon" data-action="view-claim" data-id="${escapeHTML(claim.id)}" title="View claim">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `).join("")
                : emptyRow("No claims available yet.", 6);
        }

        if ($("claimStatusSummary")) {
            const statuses = ["Filed", "Pending", "Under Review", "Approved", "Rejected", "Settled"];

            $("claimStatusSummary").innerHTML = statuses.map((status) => {
                const count = claims.filter((claim) => claim.status === status).length;
                const percentage = total ? (count / total) * 100 : 0;

                return `
                    <div class="status-summary-item">
                        <div class="status-summary-info">
                            <span>${escapeHTML(status)}</span>
                            <strong>${count}</strong>
                        </div>
                        <div class="progress-track">
                            <div class="progress-bar" style="width:${percentage}%"></div>
                        </div>
                    </div>
                `;
            }).join("");
        }
    }

    // ---------------------------------------
    // FILE A CLAIM
    // ---------------------------------------

    $("filedDate") && ($("filedDate").value = getTodayDate());

    $("claimForm")?.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = $("claimantName")?.value.trim();
        const policy = $("policyNumber")?.value.trim();
        const email = $("claimEmail")?.value.trim();
        const phone = $("claimPhone")?.value.trim();
        const type = $("claimType")?.value;
        const incidentDate = $("incidentDate")?.value;
        const amount = Number($("claimAmount")?.value);
        const description = $("claimDescription")?.value.trim();

        if (!name || !policy || !email || !type || !incidentDate || !description) {
            showToast("Please complete all required fields.", "error");
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            showToast("Please enter a valid claim amount.", "error");
            return;
        }

        const claim = {
            id: generateId(),
            claim_number: generateClaimNumber(),
            policy_number: policy,
            claimant_name: name,
            email,
            phone,
            incident_date: incidentDate,
            claim_type: type,
            amount,
            description,
            status: "Filed",
            filed_date: getTodayDate(),
            history: [{
                date: new Date().toISOString(),
                message: "Claim filed successfully"
            }]
        };

        const claims = getClaims();
        claims.push(claim);
        saveClaims(claims);

        $("claimForm").reset();
        if ($("filedDate")) $("filedDate").value = getTodayDate();

        selectedClaimId = claim.id;

        renderDashboard();
        renderClaims();
        showToast(`Claim ${claim.claim_number} filed successfully.`);
        navigateTo("claims");
    });

    // ---------------------------------------
    // CLAIM LIST, SEARCH AND FILTER
    // ---------------------------------------

    function renderClaims() {
        const search = ($("claimSearch")?.value || "").toLowerCase().trim();
        const status = $("statusFilter")?.value || "";
        const type = $("typeFilter")?.value || "";

        const filtered = getClaims().filter((claim) => {
            const matchesSearch = [
                claim.claim_number,
                claim.claimant_name,
                claim.policy_number
            ].some((value) => String(value || "").toLowerCase().includes(search));

            const matchesStatus = !status || claim.status === status;
            const matchesType = !type || claim.claim_type === type;

            return matchesSearch && matchesStatus && matchesType;
        });

        if ($("claimsTableBody")) {
            $("claimsTableBody").innerHTML = filtered.length
                ? filtered.map((claim) => `
                    <tr>
                        <td>${escapeHTML(claim.claim_number)}</td>
                        <td>${escapeHTML(claim.claimant_name)}</td>
                        <td>${escapeHTML(claim.policy_number)}</td>
                        <td>${escapeHTML(claim.claim_type)}</td>
                        <td>${formatCurrency(Number(claim.amount) || 0)}</td>
                        <td>${safeDate(claim.filed_date)}</td>
                        <td>${statusBadge(claim.status)}</td>
                        <td>
                            <button class="btn-icon" data-action="view-claim" data-id="${escapeHTML(claim.id)}" title="View details">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `).join("")
                : emptyRow("No matching claims found.", 8);
        }

        if ($("claimsEmptyState")) {
            $("claimsEmptyState").style.display = filtered.length ? "none" : "block";
        }
    }

    $("claimSearch")?.addEventListener("input", renderClaims);
    $("statusFilter")?.addEventListener("change", renderClaims);
    $("typeFilter")?.addEventListener("change", renderClaims);

    // ---------------------------------------
    // CLAIM DETAILS
    // ---------------------------------------

    function renderClaimDetail() {
        const container = $("claimDetailContent");
        if (!container) return;

        const claim = getClaimById(selectedClaimId);

        if (!claim) {
            container.innerHTML = `<div class="empty-state">Select a claim to view its details.</div>`;
            return;
        }

        const history = Array.isArray(claim.history) ? claim.history : [];
        const documents = getDocuments().filter(
            (document) => String(document.claim_id) === String(claim.id)
        );

        container.innerHTML = `
            <div class="claim-detail-header">
                <div>
                    <h3>${escapeHTML(claim.claim_number)}</h3>
                    <p>${escapeHTML(claim.claimant_name)}</p>
                </div>
                ${statusBadge(claim.status)}
            </div>

            <div class="detail-grid">
                <div><span>Policy Number</span><strong>${escapeHTML(claim.policy_number)}</strong></div>
                <div><span>Claim Type</span><strong>${escapeHTML(claim.claim_type)}</strong></div>
                <div><span>Claim Amount</span><strong>${formatCurrency(Number(claim.amount) || 0)}</strong></div>
                <div><span>Incident Date</span><strong>${safeDate(claim.incident_date)}</strong></div>
                <div><span>Filed Date</span><strong>${safeDate(claim.filed_date)}</strong></div>
                <div><span>Email</span><strong>${escapeHTML(claim.email || "—")}</strong></div>
                <div><span>Phone</span><strong>${escapeHTML(claim.phone || "—")}</strong></div>
            </div>

            <div class="detail-description">
                <h4>Claim Description</h4>
                <p>${escapeHTML(claim.description)}</p>
            </div>

            <div class="detail-description">
                <h4>Claim Documents</h4>
                ${documents.length
                    ? `<ul>${documents.map((doc) => `<li>${escapeHTML(doc.document_name || doc.fileName || "Document")}</li>`).join("")}</ul>`
                    : "<p>No documents attached.</p>"
                }
            </div>

            <div class="detail-description">
                <h4>Claim History</h4>
                ${history.length
                    ? `<div class="timeline">${history.map((item) => `
                        <div class="timeline-item">
                            <strong>${escapeHTML(item.message)}</strong>
                            <small>${safeDate(item.date)}</small>
                        </div>
                    `).join("")}</div>`
                    : "<p>No history available.</p>"
                }
            </div>

            <div class="detail-actions">
                <button class="btn btn-secondary" data-go="claims">Back to Claims</button>
                <button class="btn btn-primary" data-action="go-review" data-id="${escapeHTML(claim.id)}">Review Claim</button>
            </div>
        `;
    }

    // ---------------------------------------
    // REVIEW AND APPROVAL
    // ---------------------------------------

    function renderReviews() {
        const body = $("reviewTableBody");
        if (!body) return;

        const claims = getClaims().filter((claim) =>
            ["Filed", "Pending", "Under Review"].includes(claim.status)
        );

        body.innerHTML = claims.length
            ? claims.map((claim) => `
                <tr>
                    <td>${escapeHTML(claim.claim_number)}</td>
                    <td>${escapeHTML(claim.claimant_name)}</td>
                    <td>${escapeHTML(claim.claim_type)}</td>
                    <td>${formatCurrency(Number(claim.amount) || 0)}</td>
                    <td>${statusBadge(claim.status)}</td>
                    <td>
                        <button class="btn btn-small btn-secondary" data-action="review-claim" data-id="${escapeHTML(claim.id)}">Review</button>
                    </td>
                </tr>
            `).join("")
            : emptyRow("There are no claims awaiting review.", 6);

        if ($("reviewEmptyState")) {
            $("reviewEmptyState").style.display = claims.length ? "none" : "block";
        }
    }

    function reviewClaim(id) {
        const claim = getClaimById(id);
        if (!claim) return;

        const decision = window.prompt(
            `Review ${claim.claim_number}\n\nEnter one decision:\n1. Under Review\n2. Approved\n3. Rejected`,
            "Approved"
        );

        if (decision === null) return;

        const normalized = decision.trim().toLowerCase();

        const decisions = {
            "1": "Under Review",
            "under review": "Under Review",
            "2": "Approved",
            "approved": "Approved",
            "3": "Rejected",
            "rejected": "Rejected"
        };

        const newStatus = decisions[normalized];

        if (!newStatus) {
            showToast("Please enter Under Review, Approved or Rejected.", "error");
            return;
        }

        const comments = window.prompt("Enter review comments:", "") ?? "";

        claim.status = newStatus;
        addHistory(claim, `Claim ${newStatus.toLowerCase()}: ${comments || "No comments added"}`);

        const reviews = getReviews();
        reviews.push({
            id: generateId(),
            claim_id: claim.id,
            reviewer: getStoredData(STORAGE_KEYS.currentUser, null)?.name || "Admin",
            comments,
            status: newStatus,
            date: getTodayDate()
        });

        saveReviews(reviews);
        saveClaims(getClaims());

        renderReviews();
        renderDashboard();
        renderClaims();

        showToast(`Claim status updated to ${newStatus}.`);
    }

    // ---------------------------------------
    // SETTLEMENT
    // ---------------------------------------

    function renderSettlements() {
        const claims = getClaims();
        const settlements = getSettlements();

        const settled = settlements.length;
        const approvedClaims = claims.filter((claim) => claim.status === "Approved");
        const awaiting = approvedClaims.length;

        if ($("settledCount")) $("settledCount").textContent = settled;
        if ($("awaitingSettlement")) $("awaitingSettlement").textContent = awaiting;

        const body = $("settlementTableBody");
        if (!body) return;

        const eligibleClaims = claims.filter((claim) =>
            ["Approved", "Settled"].includes(claim.status)
        );

        body.innerHTML = eligibleClaims.length
            ? eligibleClaims.map((claim) => {
                const settlement = settlements.find(
                    (item) => String(item.claim_id) === String(claim.id)
                );

                return `
                    <tr>
                        <td>${escapeHTML(claim.claim_number)}</td>
                        <td>${escapeHTML(claim.claimant_name)}</td>
                        <td>${formatCurrency(Number(claim.amount) || 0)}</td>
                        <td>${settlement ? formatCurrency(Number(settlement.settlement_amount) || 0) : "—"}</td>
                        <td>${settlement ? safeDate(settlement.payment_date) : "—"}</td>
                        <td>${statusBadge(claim.status)}</td>
                        <td>
                            ${claim.status === "Approved"
                                ? `<button class="btn btn-small btn-primary" data-action="settle-claim" data-id="${escapeHTML(claim.id)}">Settle</button>`
                                : `<span class="text-muted">Completed</span>`
                            }
                        </td>
                    </tr>
                `;
            }).join("")
            : emptyRow("No approved claims available for settlement.", 7);

        if ($("settlementEmptyState")) {
            $("settlementEmptyState").style.display = eligibleClaims.length ? "none" : "block";
        }
    }

    function settleClaim(id) {
        const claim = getClaimById(id);
        if (!claim || claim.status !== "Approved") return;

        const amountInput = window.prompt(
            `Enter settlement amount for ${claim.claim_number}:`,
            String(claim.amount)
        );

        if (amountInput === null) return;

        const amount = Number(amountInput);

        if (!Number.isFinite(amount) || amount <= 0) {
            showToast("Enter a valid settlement amount.", "error");
            return;
        }

        if (amount > Number(claim.amount)) {
            showToast("Settlement amount cannot exceed the claim amount.", "error");
            return;
        }

        const notes = window.prompt("Enter settlement notes:", "") ?? "";

        const settlements = getSettlements();
        settlements.push({
            id: generateId(),
            claim_id: claim.id,
            settlement_amount: amount,
            payment_date: getTodayDate(),
            payment_status: "Paid",
            notes
        });

        saveSettlements(settlements);

        claim.status = "Settled";
        addHistory(claim, `Claim settled for ${formatCurrency(amount)}`);
        saveClaims(getClaims());

        renderSettlements();
        renderDashboard();
        renderClaims();

        showToast("Settlement recorded successfully.");
    }

    // ---------------------------------------
    // DOCUMENT MANAGEMENT
    // ---------------------------------------

    function renderDocuments() {
        const body = $("documentsTableBody");
        if (!body) return;

        const documents = getDocuments();
        const claims = getClaims();

        if ($("documentClaimId")) {
            const currentValue = $("documentClaimId").value;

            $("documentClaimId").innerHTML =
                `<option value="">Select a claim</option>` +
                claims.map((claim) => `
                    <option value="${escapeHTML(claim.id)}">${escapeHTML(claim.claim_number)} - ${escapeHTML(claim.claimant_name)}</option>
                `).join("");

            if (currentValue && claims.some((claim) => String(claim.id) === currentValue)) {
                $("documentClaimId").value = currentValue;
            }
        }

        body.innerHTML = documents.length
            ? documents.map((document) => {
                const claim = getClaimById(document.claim_id);
                const fileUrl = document.dataUrl || "";

                return `
                    <tr>
                        <td>${escapeHTML(document.document_name || document.fileName || "Document")}</td>
                        <td>${escapeHTML(claim?.claim_number || "Unknown claim")}</td>
                        <td>${escapeHTML(document.file_type || "File")}</td>
                        <td>${safeDate(document.upload_date)}</td>
                        <td>
                            ${fileUrl
                                ? `<a class="btn btn-small btn-secondary" href="${escapeHTML(fileUrl)}" download="${escapeHTML(document.fileName || document.document_name || "document")}">Download</a>`
                                : `<span class="text-muted">Unavailable</span>`
                            }
                        </td>
                    </tr>
                `;
            }).join("")
            : emptyRow("No documents uploaded yet.", 5);

        if ($("documentsEmptyState")) {
            $("documentsEmptyState").style.display = documents.length ? "none" : "block";
        }
    }

    $("documentForm")?.addEventListener("submit", (event) => {
        event.preventDefault();

        const claimId = $("documentClaimId")?.value;
        const name = $("documentName")?.value.trim();
        const file = $("documentFile")?.files?.[0];

        if (!claimId || !name || !file) {
            showToast("Select a claim and provide a document name and file.", "error");
            return;
        }

        if (!getClaimById(claimId)) {
            showToast("The selected claim could not be found.", "error");
            return;
        }

        // LocalStorage is not suitable for large files.
        if (file.size > 1024 * 1024) {
            showToast("Please upload a file smaller than 1 MB for this demo.", "error");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const documents = getDocuments();

            documents.push({
                id: generateId(),
                claim_id: claimId,
                document_name: name,
                fileName: file.name,
                file_type: file.type || "Unknown",
                upload_date: getTodayDate(),
                dataUrl: reader.result
            });

            try {
                saveDocuments(documents);
                $("documentForm").reset();
                renderDocuments();
                showToast("Document uploaded successfully.");
            } catch (error) {
                console.error(error);
                showToast("Storage is full. Try a smaller file.", "error");
            }
        };

        reader.onerror = () => {
            showToast("Unable to read the selected file.", "error");
        };

        reader.readAsDataURL(file);
    });

    // ---------------------------------------
    // REPORTS
    // ---------------------------------------

    function renderReports() {
        const claims = getClaims();
        const total = claims.length;

        const approved = claims.filter((claim) =>
            ["Approved", "Settled"].includes(claim.status)
        ).length;

        const totalAmount = claims.reduce(
            (sum, claim) => sum + (Number(claim.amount) || 0),
            0
        );

        if ($("reportTotalClaims")) {
            $("reportTotalClaims").textContent = total;
        }

        if ($("approvalRate")) {
            $("approvalRate").textContent =
                `${total ? Math.round((approved / total) * 100) : 0}%`;
        }

        if ($("reportTotalAmount")) {
            $("reportTotalAmount").textContent = formatCurrency(totalAmount);
        }

        const chart = $("reportsChart");

        if (chart) {
            const statuses = ["Filed", "Pending", "Under Review", "Approved", "Rejected", "Settled"];

            chart.innerHTML = statuses.map((status) => {
                const count = claims.filter((claim) => claim.status === status).length;
                const percentage = total ? (count / total) * 100 : 0;

                return `
                    <div class="chart-row">
                        <div class="chart-label">
                            <span>${escapeHTML(status)}</span>
                            <strong>${count}</strong>
                        </div>
                        <div class="chart-track">
                            <div class="chart-bar" style="width:${percentage}%"></div>
                        </div>
                    </div>
                `;
            }).join("");
        }
    }

    // ---------------------------------------
    // CSV EXPORT
    // ---------------------------------------

    $("exportCSVBtn")?.addEventListener("click", () => {
        const claims = getClaims();

        if (!claims.length) {
            showToast("There are no claims to export.", "error");
            return;
        }

        const columns = [
            "claim_number",
            "policy_number",
            "claimant_name",
            "claim_type",
            "incident_date",
            "amount",
            "status",
            "filed_date"
        ];

        const csvCell = (value) => {
            let text = String(value ?? "");

            // Prevent spreadsheet formula injection.
            if (/^[=+\-@]/.test(text)) {
                text = "'" + text;
            }

            return `"${text.replace(/"/g, '""')}"`;
        };

        const rows = [
            columns.join(","),
            ...claims.map((claim) =>
                columns.map((column) => csvCell(claim[column])).join(",")
            )
        ];

        const blob = new Blob([rows.join("\r\n")], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "claimpro-claims-report.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
        showToast("CSV report exported successfully.");
    });

    $("printReportBtn")?.addEventListener("click", () => {
        window.print();
    });

    // ---------------------------------------
    // LOGIN
    // ---------------------------------------

    $("loginForm")?.addEventListener("submit", (event) => {
        event.preventDefault();

        const email = $("loginEmail")?.value.trim().toLowerCase();
        const password = $("loginPassword")?.value;

        const user = getUsers().find((item) =>
            String(item.email).toLowerCase() === email &&
            item.password === password
        );

        if (!user) {
            showToast("Invalid email or password.", "error");
            return;
        }

        saveStoredData(STORAGE_KEYS.currentUser, {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        });

        updateUserInterface();
        $("loginForm").reset();
        showToast(`Welcome, ${user.name}!`);
        navigateTo("dashboard");
    });

    // ---------------------------------------
    // REGISTER
    // ---------------------------------------

    $("registerForm")?.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = $("registerName")?.value.trim();
        const email = $("registerEmail")?.value.trim().toLowerCase();
        const password = $("registerPassword")?.value;

        if (!name || !email || !password) {
            showToast("Please complete all registration fields.", "error");
            return;
        }

        if (password.length < 6) {
            showToast("Password must contain at least 6 characters.", "error");
            return;
        }

        const users = getUsers();

        if (users.some((user) => String(user.email).toLowerCase() === email)) {
            showToast("An account with this email already exists.", "error");
            return;
        }

        const newUser = {
            id: generateId(),
            name,
            email,
            password,
            role: "customer"
        };

        users.push(newUser);
        saveUsers(users);

        saveStoredData(STORAGE_KEYS.currentUser, {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        });

        $("registerForm").reset();
        updateUserInterface();

        showToast("Account created successfully.");
        navigateTo("dashboard");
    });

    // ---------------------------------------
    // LOGOUT
    // ---------------------------------------

    $("logoutBtn")?.addEventListener("click", () => {
        localStorage.removeItem(STORAGE_KEYS.currentUser);
        updateUserInterface();
        showToast("You have been logged out.");
        navigateTo("login");
    });

    // ---------------------------------------
    // TABLE ACTIONS
    // ---------------------------------------

    document.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-action]");
        if (!actionButton) return;

        const action = actionButton.dataset.action;
        const id = actionButton.dataset.id;

        if (action === "view-claim") {
            selectedClaimId = id;
            navigateTo("claim-detail");
        }

        if (action === "review-claim") {
            reviewClaim(id);
        }

        if (action === "settle-claim") {
            settleClaim(id);
        }

        if (action === "go-review") {
            selectedClaimId = id;
            navigateTo("review");
        }
    });

    // ---------------------------------------
    // INITIALIZE APPLICATION
    // ---------------------------------------

    updateUserInterface();
    renderDashboard();
    renderClaims();
    renderClaimDetail();
    renderReviews();
    renderSettlements();
    renderDocuments();
    renderReports();

    const initialPage = window.location.hash.replace("#", "");
    navigateTo(pageInfo[initialPage] ? initialPage : "dashboard");
});
