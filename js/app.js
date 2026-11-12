
document.addEventListener("DOMContentLoaded", () => {
    // =========================================
    // CLAIMPRO - MAIN APPLICATION
    // ADMIN-ONLY VERSION
    // =========================================

    const $ = (id) => document.getElementById(id);

    let selectedClaimId = null;

    const ADMIN_EMAIL = "admin@claimpro.com";
    const ADMIN_PASSWORD = "admin123";

    const pageInfo = {
        dashboard: ["Dashboard", "Welcome to your claim management workspace."],
        "file-claim": ["File a Claim", "Submit a new insurance claim."],
        claims: ["Claims", "Search and manage insurance claims."],
        "claim-detail": ["Claim Details", "View complete claim information."],
        review: ["Review & Approval", "Review claims and make decisions."],
        settlement: ["Settlement", "Manage approved claim payments."],
        documents: ["Documents", "Manage claim-related documents."],
        reports: ["Reports", "View claim statistics and reports."],
        auth: ["Admin Login", "Sign in to your ClaimPro administrator account."]
    };

    // =========================================
    // GENERAL HELPERS
    // =========================================

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);
    }

    function showToast(message, type = "success") {
        const toast = $("toast");
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast show ${type}`;

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    function statusBadge(status) {
        const cssClass = String(status || "")
            .toLowerCase()
            .replace(/\s+/g, "-");

        return `<span class="status-badge ${escapeHTML(cssClass)}">${escapeHTML(status)}</span>`;
    }

    function safeDate(value) {
        if (!value) return "—";

        const date = new Date(value + (String(value).length === 10 ? "T00:00:00" : ""));

        if (Number.isNaN(date.getTime())) {
            return escapeHTML(value);
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function getClaim(id) {
        return getClaims().find(
            claim => String(claim.id) === String(id)
        );
    }

    function addHistory(claim, status, note) {
        if (!Array.isArray(claim.history)) {
            claim.history = [];
        }

        claim.history.push({
            status,
            date: getTodayDate(),
            note
        });
    }

    function getEmptyRow(message, columns) {
        return `<tr><td colspan="${columns}" class="empty-message">${escapeHTML(message)}</td></tr>`;
    }

    // =========================================
    // ADMIN ACCOUNT SECURITY
    // =========================================

    function enforceAdminOnly() {
        // Keep only the configured Admin account.
        const adminAccount = {
            id: 1,
            name: "Admin User",
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: "admin"
        };

        saveStoredData(STORAGE_KEYS.users, [adminAccount]);

        // Remove any existing non-admin session.
        const currentUser = getStoredData(STORAGE_KEYS.currentUser, null);

        if (
            currentUser &&
            (
                currentUser.email?.toLowerCase() !== ADMIN_EMAIL ||
                currentUser.role !== "admin"
            )
        ) {
            localStorage.removeItem(STORAGE_KEYS.currentUser);
        }

        // Hide registration form.
        if ($("registerForm")) {
            $("registerForm").style.display = "none";
        }

        // Hide common registration toggle controls if present.
        document.querySelectorAll(
            '[data-auth-tab="register"], [data-tab="register"], .register-tab, .show-register'
        ).forEach(element => {
            element.style.display = "none";
        });
    }

    enforceAdminOnly();

    // =========================================
    // NAVIGATION
    // =========================================

    function navigateTo(page) {
        if (!pageInfo[page]) {
            page = "dashboard";
        }

        // Only Admin can access application pages.
        const currentUser = getStoredData(STORAGE_KEYS.currentUser, null);

        const isAdmin = currentUser &&
            currentUser.email?.toLowerCase() === ADMIN_EMAIL &&
            currentUser.role === "admin";

        if (page !== "auth" && !isAdmin) {
            page = "auth";
            showToast("Please log in as Admin to continue.", "error");
        }

        document.querySelectorAll(".page-section").forEach(section => {
            section.classList.toggle("active", section.id === page);
        });

        document.querySelectorAll(".nav-link[data-page]").forEach(link => {
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

        window.location.hash = page;
    }

    document.addEventListener("click", event => {
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

    window.addEventListener("hashchange", () => {
        const page = window.location.hash.replace("#", "");

        if (pageInfo[page]) {
            navigateTo(page);
        }
    });

    $("mobileMenuBtn")?.addEventListener("click", () => {
        $("sidebar")?.classList.toggle("open");
    });

    // =========================================
    // THEME
    // =========================================

    function applyTheme(theme) {
        document.body.classList.toggle("dark-mode", theme === "dark");

        const icon = $("themeToggle")?.querySelector("i");

        if (icon) {
            icon.className = theme === "dark"
                ? "fas fa-sun"
                : "fas fa-moon";
        }
    }

    applyTheme(localStorage.getItem("claimpro_theme") || "light");

    $("themeToggle")?.addEventListener("click", () => {
        const theme = document.body.classList.contains("dark-mode")
            ? "light"
            : "dark";

        localStorage.setItem("claimpro_theme", theme);
        applyTheme(theme);
    });

    // =========================================
    // USER INFORMATION
    // =========================================

    function updateUserInterface() {
        const user = getStoredData(STORAGE_KEYS.currentUser, null);

        const isAdmin = user &&
            user.email?.toLowerCase() === ADMIN_EMAIL &&
            user.role === "admin";

        if ($("topUserName")) {
            $("topUserName").textContent = isAdmin ? "Admin User" : "Guest User";
        }

        if ($("topUserRole")) {
            $("topUserRole").textContent = isAdmin ? "Administrator" : "Guest";
        }

        if ($("userAvatar")) {
            $("userAvatar").textContent = isAdmin ? "A" : "G";
        }

        if ($("logoutBtn")) {
            $("logoutBtn").style.display = isAdmin ? "" : "none";
        }
    }

    // =========================================
    // DASHBOARD
    // =========================================

    function renderDashboard() {
        const claims = getClaims();
        const settlements = getSettlements();

        const total = claims.length;
        const underReview = claims.filter(c => c.status === "Under Review").length;
        const approved = claims.filter(c => c.status === "Approved").length;
        const pending = claims.filter(c => ["Pending", "Filed"].includes(c.status)).length;
        const rejected = claims.filter(c => c.status === "Rejected").length;

        const settledAmount = settlements.reduce(
            (sum, item) => sum + Number(item.settlementAmount || 0),
            0
        );

        if ($("totalClaims")) $("totalClaims").textContent = total;
        if ($("underReviewClaims")) $("underReviewClaims").textContent = underReview;
        if ($("approvedClaims")) $("approvedClaims").textContent = approved;
        if ($("pendingClaims")) $("pendingClaims").textContent = pending;
        if ($("rejectedClaims")) $("rejectedClaims").textContent = rejected;

        if ($("totalSettlements")) {
            $("totalSettlements").textContent = formatCurrency(settledAmount);
        }

        const recent = [...claims]
            .sort((a, b) => Number(b.id) - Number(a.id))
            .slice(0, 5);

        if ($("recentClaimsTable")) {
            $("recentClaimsTable").innerHTML = recent.length
                ? recent.map(claim => `
                    <tr>
                        <td>${escapeHTML(claim.claimNumber)}</td>
                        <td>${escapeHTML(claim.claimantName)}</td>
                        <td>${escapeHTML(claim.claimType)}</td>
                        <td>${formatCurrency(claim.amount)}</td>
                        <td>${statusBadge(claim.status)}</td>
                    </tr>
                `).join("")
                : getEmptyRow("No claims submitted yet.", 5);
        }

        const statuses = [
            "Filed",
            "Pending",
            "Under Review",
            "Approved",
            "Rejected",
            "Settled"
        ];

        if ($("claimStatusSummary")) {
            $("claimStatusSummary").innerHTML = statuses.map(status => {
                const count = claims.filter(c => c.status === status).length;
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

    // =========================================
    // CLAIM FILING
    // =========================================

    if ($("filedDate")) {
        $("filedDate").value = getTodayDate();
    }

    $("claimForm")?.addEventListener("submit", event => {
        event.preventDefault();

        try {
            const claimantName = $("claimantName").value.trim();
            const policyNumber = $("policyNumber").value.trim();
            const email = $("claimEmail").value.trim();
            const phone = $("claimPhone").value.trim();
            const claimType = $("claimType").value;
            const incidentDate = $("incidentDate").value;
            const amount = Number($("claimAmount").value);
            const description = $("claimDescription").value.trim();

            if (
                !claimantName ||
                !policyNumber ||
                !email ||
                !claimType ||
                !incidentDate ||
                !description
            ) {
                showToast("Please fill in all required fields.", "error");
                return;
            }

            if (!Number.isFinite(amount) || amount <= 0) {
                showToast("Please enter a valid claim amount.", "error");
                return;
            }

            if (new Date(incidentDate + "T00:00:00") > new Date(getTodayDate() + "T23:59:59")) {
                showToast("Incident date cannot be in the future.", "error");
                return;
            }

            const claims = getClaims();

            const newClaim = {
                id: generateId(claims),
                claimNumber: generateClaimNumber(),
                policyNumber,
                claimantName,
                email,
                phone,
                incidentDate,
                claimType,
                amount,
                description,
                status: "Filed",
                filedDate: getTodayDate(),
                documents: [],
                history: [{
                    status: "Filed",
                    date: getTodayDate(),
                    note: "Claim submitted successfully."
                }],
                reviewerComments: ""
            };

            claims.push(newClaim);

            const saved = saveClaims(claims);

            if (!saved) {
                showToast("Unable to save claim. Please try again.", "error");
                return;
            }

            selectedClaimId = newClaim.id;

            $("claimForm").reset();

            if ($("filedDate")) {
                $("filedDate").value = getTodayDate();
            }

            renderDashboard();
            renderClaims();

            showToast(`Claim ${newClaim.claimNumber} submitted successfully!`);

            navigateTo("claims");

        } catch (error) {
            console.error("Claim submission error:", error);
            showToast("Something went wrong while submitting the claim.", "error");
        }
    });

    $("claimForm")?.addEventListener("reset", () => {
        setTimeout(() => {
            if ($("filedDate")) {
                $("filedDate").value = getTodayDate();
            }
        }, 0);
    });

    // =========================================
    // CLAIM LIST, SEARCH AND FILTER
    // =========================================

    function renderClaims() {
        const claims = getClaims();

        const search = ($("claimSearch")?.value || "")
            .toLowerCase()
            .trim();

        const status = $("statusFilter")?.value || "";
        const type = $("typeFilter")?.value || "";

        const filtered = claims.filter(claim => {
            const matchesSearch = [
                claim.claimNumber,
                claim.claimantName,
                claim.policyNumber
            ].some(value =>
                String(value || "").toLowerCase().includes(search)
            );

            return matchesSearch &&
                (!status || claim.status === status) &&
                (!type || claim.claimType === type);
        });

        if ($("claimsTableBody")) {
            $("claimsTableBody").innerHTML = filtered.length
                ? filtered.map(claim => `
                    <tr>
                        <td>${escapeHTML(claim.claimNumber)}</td>
                        <td>${escapeHTML(claim.claimantName)}</td>
                        <td>${escapeHTML(claim.policyNumber)}</td>
                        <td>${escapeHTML(claim.claimType)}</td>
                        <td>${formatCurrency(claim.amount)}</td>
                        <td>${safeDate(claim.filedDate)}</td>
                        <td>${statusBadge(claim.status)}</td>
                        <td>
                            <button class="icon-btn" data-action="view-claim" data-id="${escapeHTML(claim.id)}" title="View claim">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `).join("")
                : getEmptyRow("No matching claims found.", 8);
        }

        if ($("claimsEmptyState")) {
            $("claimsEmptyState").style.display = filtered.length ? "none" : "block";
        }
    }

    $("claimSearch")?.addEventListener("input", renderClaims);
    $("statusFilter")?.addEventListener("change", renderClaims);
    $("typeFilter")?.addEventListener("change", renderClaims);

    // =========================================
    // CLAIM DETAILS
    // =========================================

    function renderClaimDetail() {
        const container = $("claimDetailContent");
        if (!container) return;

        const claim = getClaim(selectedClaimId);

        if (!claim) {
            container.innerHTML = `
                <div class="empty-state">
                    Select a claim from the Claims page to view its details.
                </div>
            `;
            return;
        }

        const history = Array.isArray(claim.history) ? claim.history : [];

        const documents = getDocuments().filter(
            doc => String(doc.claimId) === String(claim.id)
        );

        container.innerHTML = `
            <div class="claim-detail-header">
                <div>
                    <h3>${escapeHTML(claim.claimNumber)}</h3>
                    <p>${escapeHTML(claim.claimantName)}</p>
                </div>
                ${statusBadge(claim.status)}
            </div>

            <div class="detail-grid">
                <div><span>Policy Number</span><strong>${escapeHTML(claim.policyNumber)}</strong></div>
                <div><span>Claim Type</span><strong>${escapeHTML(claim.claimType)}</strong></div>
                <div><span>Claim Amount</span><strong>${formatCurrency(claim.amount)}</strong></div>
                <div><span>Incident Date</span><strong>${safeDate(claim.incidentDate)}</strong></div>
                <div><span>Filed Date</span><strong>${safeDate(claim.filedDate)}</strong></div>
                <div><span>Email</span><strong>${escapeHTML(claim.email)}</strong></div>
                <div><span>Phone</span><strong>${escapeHTML(claim.phone || "—")}</strong></div>
            </div>

            <div class="detail-description">
                <h4>Incident Description</h4>
                <p>${escapeHTML(claim.description)}</p>
            </div>

            <div class="detail-description">
                <h4>Documents</h4>
                ${documents.length
                    ? `<ul>${documents.map(doc => `<li>${escapeHTML(doc.name)}</li>`).join("")}</ul>`
                    : "<p>No documents uploaded.</p>"
                }
            </div>

            <div class="detail-description">
                <h4>Processing History</h4>
                ${history.length
                    ? `<div class="timeline">${history.map(item => `
                        <div class="timeline-item">
                            <strong>${escapeHTML(item.status)}</strong>
                            <p>${escapeHTML(item.note)}</p>
                            <small>${safeDate(item.date)}</small>
                        </div>
                    `).join("")}</div>`
                    : "<p>No history available.</p>"
                }
            </div>

            <div class="detail-description">
                <h4>Reviewer Comments</h4>
                <p>${escapeHTML(claim.reviewerComments || "No reviewer comments yet.")}</p>
            </div>

            <div class="detail-actions">
                <button class="secondary-btn" data-go="claims">Back to Claims</button>
                <button class="primary-btn" data-action="go-review" data-id="${escapeHTML(claim.id)}">Review Claim</button>
            </div>
        `;
    }

    // =========================================
    // REVIEW AND APPROVAL
    // =========================================

    function renderReviews() {
        const body = $("reviewTableBody");
        if (!body) return;

        const claims = getClaims().filter(claim =>
            ["Filed", "Pending", "Under Review"].includes(claim.status)
        );

        body.innerHTML = claims.length
            ? claims.map(claim => `
                <tr>
                    <td>${escapeHTML(claim.claimNumber)}</td>
                    <td>${escapeHTML(claim.claimantName)}</td>
                    <td>${escapeHTML(claim.claimType)}</td>
                    <td>${formatCurrency(claim.amount)}</td>
                    <td>${statusBadge(claim.status)}</td>
                    <td>
                        <button class="primary-btn" data-action="review-claim" data-id="${escapeHTML(claim.id)}">
                            Review
                        </button>
                    </td>
                </tr>
            `).join("")
            : getEmptyRow("No claims waiting for review.", 6);

        if ($("reviewEmptyState")) {
            $("reviewEmptyState").style.display = claims.length ? "none" : "block";
        }
    }

    function reviewClaim(id) {
        const claims = getClaims();

        const claim = claims.find(
            item => String(item.id) === String(id)
        );

        if (!claim) {
            showToast("Claim not found.", "error");
            return;
        }

        const decision = prompt(
            `Review ${claim.claimNumber}\n\nEnter one decision:\n1. Under Review\n2. Approved\n3. Rejected`,
            "Approved"
        );

        if (decision === null) return;

        const choices = {
            "1": "Under Review",
            "under review": "Under Review",
            "2": "Approved",
            "approved": "Approved",
            "3": "Rejected",
            "rejected": "Rejected"
        };

        const newStatus = choices[decision.trim().toLowerCase()];

        if (!newStatus) {
            showToast("Please enter 1, 2, or 3.", "error");
            return;
        }

        const comments = prompt("Enter review comments:", "") ?? "";

        claim.status = newStatus;
        claim.reviewerComments = comments;

        addHistory(
            claim,
            newStatus,
            comments || `Claim status changed to ${newStatus}.`
        );

        if (!saveClaims(claims)) {
            showToast("Unable to save claim status.", "error");
            return;
        }

        const reviews = getReviews();

        reviews.push({
            id: generateId(reviews),
            claimId: claim.id,
            reviewer: "Admin User",
            comments,
            status: newStatus,
            date: getTodayDate()
        });

        if (!saveReviews(reviews)) {
            showToast("Claim status saved, but review record could not be saved.", "error");
        }

        renderReviews();
        renderDashboard();
        renderClaims();
        renderSettlements();
        renderClaimDetail();
        renderReports();

        showToast(`Claim status successfully changed to ${newStatus}.`);
    }

    // =========================================
    // SETTLEMENT
    // =========================================

    function renderSettlements() {
        const claims = getClaims();
        const settlements = getSettlements();

        const settledCount = claims.filter(
            claim => claim.status === "Settled"
        ).length;

        const awaiting = claims.filter(
            claim => claim.status === "Approved"
        ).length;

        if ($("settledCount")) {
            $("settledCount").textContent = settledCount;
        }

        if ($("awaitingSettlement")) {
            $("awaitingSettlement").textContent = awaiting;
        }

        const body = $("settlementTableBody");
        if (!body) return;

        const eligible = claims.filter(
            claim => ["Approved", "Settled"].includes(claim.status)
        );

        body.innerHTML = eligible.length
            ? eligible.map(claim => {
                const settlement = settlements.find(
                    item => String(item.claimId) === String(claim.id)
                );

                return `
                    <tr>
                        <td>${escapeHTML(claim.claimNumber)}</td>
                        <td>${escapeHTML(claim.claimantName)}</td>
                        <td>${formatCurrency(settlement?.settlementAmount ?? claim.amount)}</td>
                        <td>${safeDate(settlement?.paymentDate)}</td>
                        <td>${escapeHTML(settlement?.paymentStatus || "Awaiting Payment")}</td>
                        <td>
                            ${claim.status === "Approved"
                                ? `<button class="primary-btn" data-action="settle-claim" data-id="${escapeHTML(claim.id)}">Settle</button>`
                                : statusBadge("Settled")
                            }
                        </td>
                    </tr>
                `;
            }).join("")
            : getEmptyRow("No approved claims available for settlement.", 6);

        if ($("settlementEmptyState")) {
            $("settlementEmptyState").style.display = eligible.length ? "none" : "block";
        }
    }

    function settleClaim(id) {
        const claims = getClaims();

        const claim = claims.find(
            item => String(item.id) === String(id)
        );

        if (!claim || claim.status !== "Approved") {
            showToast("Only approved claims can be settled.", "error");
            return;
        }

        const input = prompt(
            `Enter settlement amount for ${claim.claimNumber}:`,
            String(claim.amount)
        );

        if (input === null) return;

        const amount = Number(input);

        if (!Number.isFinite(amount) || amount <= 0 || amount > Number(claim.amount)) {
            showToast("Enter a valid amount not exceeding the claim amount.", "error");
            return;
        }

        const notes = prompt("Enter settlement notes:", "") ?? "";

        const settlements = getSettlements();

        const existingSettlement = settlements.find(
            item => String(item.claimId) === String(claim.id)
        );

        if (existingSettlement) {
            showToast("A settlement record already exists for this claim.", "error");
            return;
        }

        const newSettlement = {
            id: generateId(settlements),
            claimId: claim.id,
            settlementAmount: amount,
            paymentDate: getTodayDate(),
            paymentStatus: "Paid",
            notes
        };

        settlements.push(newSettlement);

        if (!saveSettlements(settlements)) {
            showToast("Unable to save settlement record.", "error");
            return;
        }

        claim.status = "Settled";

        addHistory(
            claim,
            "Settled",
            `Settlement processed for ${formatCurrency(amount)}.`
        );

        if (!saveClaims(claims)) {
            const updatedSettlements = getSettlements().filter(
                item => String(item.id) !== String(newSettlement.id)
            );

            saveSettlements(updatedSettlements);

            showToast("Unable to update claim status. Please try again.", "error");
            return;
        }

        renderSettlements();
        renderDashboard();
        renderClaims();
        renderReviews();
        renderClaimDetail();
        renderReports();

        showToast("Settlement completed. Claim status changed to Settled.");
    }

    // =========================================
    // DOCUMENT MANAGEMENT
    // =========================================

    function renderDocuments() {
        const body = $("documentsTableBody");
        if (!body) return;

        const documents = getDocuments();

        body.innerHTML = documents.length
            ? documents.map(doc => {
                const claim = getClaim(doc.claimId);

                return `
                    <tr>
                        <td>${escapeHTML(doc.name)}</td>
                        <td>${escapeHTML(claim?.claimNumber || "Unknown claim")}</td>
                        <td>${escapeHTML(doc.fileType || "File")}</td>
                        <td>${safeDate(doc.uploadDate)}</td>
                        <td>
                            ${doc.dataUrl
                                ? `<a class="secondary-btn" href="${escapeHTML(doc.dataUrl)}" download="${escapeHTML(doc.fileName || doc.name)}">Download</a>`
                                : "Unavailable"
                            }
                        </td>
                    </tr>
                `;
            }).join("")
            : getEmptyRow("No documents uploaded yet.", 5);

        if ($("documentsEmptyState")) {
            $("documentsEmptyState").style.display = documents.length ? "none" : "block";
        }
    }

    $("documentForm")?.addEventListener("submit", event => {
        event.preventDefault();

        const claimNumberInput = $("documentClaimId").value.trim();
        const name = $("documentName").value.trim();
        const file = $("documentFile").files[0];

        const claim = getClaims().find(item =>
            item.claimNumber.toLowerCase() === claimNumberInput.toLowerCase()
        );

        if (!claim) {
            showToast("Enter a valid Claim ID, such as CLM-2026-001.", "error");
            return;
        }

        if (!name || !file) {
            showToast("Please provide the document name and file.", "error");
            return;
        }

        if (file.size > 1024 * 1024) {
            showToast("Please choose a file smaller than 1 MB.", "error");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const documents = getDocuments();

            documents.push({
                id: generateId(documents),
                claimId: claim.id,
                name,
                fileName: file.name,
                fileType: file.type || "Unknown",
                uploadDate: getTodayDate(),
                dataUrl: reader.result
            });

            if (saveDocuments(documents)) {
                $("documentForm").reset();
                renderDocuments();
                renderClaimDetail();
                showToast("Document uploaded successfully.");
            } else {
                showToast("Unable to save document.", "error");
            }
        };

        reader.onerror = () => {
            showToast("Unable to read the selected file.", "error");
        };

        reader.readAsDataURL(file);
    });

    // =========================================
    // REPORTS
    // =========================================

    function renderReports() {
        const claims = getClaims();
        const total = claims.length;

        const approved = claims.filter(claim =>
            ["Approved", "Settled"].includes(claim.status)
        ).length;

        const amount = claims.reduce(
            (sum, claim) => sum + Number(claim.amount || 0),
            0
        );

        if ($("reportTotalClaims")) {
            $("reportTotalClaims").textContent = total;
        }

        if ($("approvalRate")) {
            $("approvalRate").textContent =
                `${total ? Math.round(approved / total * 100) : 0}%`;
        }

        if ($("reportTotalAmount")) {
            $("reportTotalAmount").textContent = formatCurrency(amount);
        }

        const statuses = [
            "Filed",
            "Pending",
            "Under Review",
            "Approved",
            "Rejected",
            "Settled"
        ];

        if ($("reportsChart")) {
            $("reportsChart").innerHTML = statuses.map(status => {
                const count = claims.filter(c => c.status === status).length;
                const percentage = total ? count / total * 100 : 0;

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

    // =========================================
    // CSV EXPORT
    // =========================================

    $("exportCSVBtn")?.addEventListener("click", () => {
        const claims = getClaims();

        if (!claims.length) {
            showToast("No claims available to export.", "error");
            return;
        }

        const columns = [
            "claimNumber",
            "policyNumber",
            "claimantName",
            "claimType",
            "incidentDate",
            "amount",
            "status",
            "filedDate"
        ];

        const csvEscape = value => {
            let text = String(value ?? "");

            if (/^[=+\-@]/.test(text)) {
                text = "'" + text;
            }

            return `"${text.replace(/"/g, '""')}"`;
        };

        const csv = [
            columns.join(","),
            ...claims.map(claim =>
                columns.map(column => csvEscape(claim[column])).join(",")
            )
        ].join("\r\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "claimpro-claims-report.csv";
        link.click();

        URL.revokeObjectURL(url);

        showToast("CSV report exported successfully.");
    });

    $("printReportBtn")?.addEventListener("click", () => {
        window.print();
    });

    // =========================================
    // ADMIN LOGIN ONLY
    // =========================================

    $("loginForm")?.addEventListener("submit", event => {
        event.preventDefault();

        const email = $("loginEmail").value.trim().toLowerCase();
        const password = $("loginPassword").value;

        // Only the configured Admin credentials are accepted.
        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            showToast("Invalid Admin email or password.", "error");
            return;
        }

        const adminUser = {
            id: 1,
            name: "Admin User",
            email: ADMIN_EMAIL,
            role: "admin"
        };

        saveStoredData(STORAGE_KEYS.currentUser, adminUser);

        // Ensure the users list contains only Admin.
        saveStoredData(STORAGE_KEYS.users, [{
            id: 1,
            name: "Admin User",
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: "admin"
        }]);

        $("loginForm").reset();

        updateUserInterface();

        showToast("Welcome, Admin User!");
        navigateTo("dashboard");
    });

    // =========================================
    // REGISTRATION DISABLED
    // =========================================

    $("registerForm")?.addEventListener("submit", event => {
        event.preventDefault();
        showToast("Registration is disabled. Only Admin can access ClaimPro.", "error");
    });

    // =========================================
    // LOGOUT
    // =========================================

    $("logoutBtn")?.addEventListener("click", () => {
        localStorage.removeItem(STORAGE_KEYS.currentUser);

        updateUserInterface();

        showToast("You have logged out successfully.");

        navigateTo("auth");
    });

    // =========================================
    // ACTION BUTTONS
    // =========================================

    document.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

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

    // =========================================
    // INITIAL APPLICATION LOAD
    // =========================================

    updateUserInterface();

    renderDashboard();
    renderClaims();
    renderClaimDetail();
    renderReviews();
    renderSettlements();
    renderDocuments();
    renderReports();

    const currentUser = getStoredData(STORAGE_KEYS.currentUser, null);

    const isAdmin = currentUser &&
        currentUser.email?.toLowerCase() === ADMIN_EMAIL &&
        currentUser.role === "admin";

    const startingPage = window.location.hash.replace("#", "");

    if (isAdmin) {
        navigateTo(pageInfo[startingPage] ? startingPage : "dashboard");
    } else {
        navigateTo("auth");
    }

    console.log("ClaimPro Admin-only application loaded successfully.");
});
