
// ============================================
// ClaimPro - Claim Processing System
// Data Management and LocalStorage
// ============================================

const STORAGE_KEYS = {
    claims: "claimpro_claims",
    documents: "claimpro_documents",
    reviews: "claimpro_reviews",
    settlements: "claimpro_settlements",
    users: "claimpro_users",
    currentUser: "claimpro_current_user"
};

// ============================================
// Sample Claims
// ============================================

const defaultClaims = [
    {
        id: 1,
        claimNumber: "CLM-2026-001",
        policyNumber: "POL-2026-001",
        claimantName: "John Smith",
        email: "john@example.com",
        phone: "9876543210",
        incidentDate: "2026-06-15",
        claimType: "Health",
        amount: 25000,
        description: "Medical claim for hospitalization and treatment.",
        status: "Under Review",
        filedDate: "2026-06-20",
        documents: [],
        history: [
            {
                status: "Filed",
                date: "2026-06-20",
                note: "Claim submitted successfully."
            },
            {
                status: "Under Review",
                date: "2026-06-21",
                note: "Claim forwarded for review."
            }
        ],
        reviewerComments: ""
    },
    {
        id: 2,
        claimNumber: "CLM-2026-002",
        policyNumber: "POL-2026-002",
        claimantName: "Sarah Johnson",
        email: "sarah@example.com",
        phone: "9876543211",
        incidentDate: "2026-06-10",
        claimType: "Auto",
        amount: 15000,
        description: "Vehicle damage claim following a road accident.",
        status: "Filed",
        filedDate: "2026-06-22",
        documents: [],
        history: [
            {
                status: "Filed",
                date: "2026-06-22",
                note: "Claim submitted successfully."
            }
        ],
        reviewerComments: ""
    },
    {
        id: 3,
        claimNumber: "CLM-2026-003",
        policyNumber: "POL-2026-003",
        claimantName: "Michael Brown",
        email: "michael@example.com",
        phone: "9876543212",
        incidentDate: "2026-05-18",
        claimType: "Home",
        amount: 45000,
        description: "Home insurance claim for property damage.",
        status: "Approved",
        filedDate: "2026-05-25",
        documents: [],
        history: [
            {
                status: "Filed",
                date: "2026-05-25",
                note: "Claim submitted successfully."
            },
            {
                status: "Under Review",
                date: "2026-05-26",
                note: "Claim verification started."
            },
            {
                status: "Approved",
                date: "2026-05-28",
                note: "Claim approved after verification."
            }
        ],
        reviewerComments: "Documents verified successfully."
    },
    {
        id: 4,
        claimNumber: "CLM-2026-004",
        policyNumber: "POL-2026-004",
        claimantName: "Emily Davis",
        email: "emily@example.com",
        phone: "9876543213",
        incidentDate: "2026-05-12",
        claimType: "Life",
        amount: 50000,
        description: "Life insurance claim submitted for policy processing.",
        status: "Rejected",
        filedDate: "2026-05-16",
        documents: [],
        history: [
            {
                status: "Filed",
                date: "2026-05-16",
                note: "Claim submitted successfully."
            },
            {
                status: "Rejected",
                date: "2026-05-18",
                note: "Required policy conditions were not satisfied."
            }
        ],
        reviewerComments: "Policy conditions could not be verified."
    },
    {
        id: 5,
        claimNumber: "CLM-2026-005",
        policyNumber: "POL-2026-005",
        claimantName: "David Wilson",
        email: "david@example.com",
        phone: "9876543214",
        incidentDate: "2026-06-01",
        claimType: "Travel",
        amount: 12000,
        description: "Travel insurance claim for cancelled flight expenses.",
        status: "Pending",
        filedDate: "2026-06-05",
        documents: [],
        history: [
            {
                status: "Filed",
                date: "2026-06-05",
                note: "Claim submitted successfully."
            },
            {
                status: "Pending",
                date: "2026-06-06",
                note: "Additional verification is required."
            }
        ],
        reviewerComments: ""
    },
    {
        id: 6,
        claimNumber: "CLM-2026-006",
        policyNumber: "POL-2026-006",
        claimantName: "Olivia Martin",
        email: "olivia@example.com",
        phone: "9876543215",
        incidentDate: "2026-04-15",
        claimType: "Health",
        amount: 18000,
        description: "Health insurance reimbursement for medical expenses.",
        status: "Settled",
        filedDate: "2026-04-20",
        documents: [],
        history: [
            {
                status: "Filed",
                date: "2026-04-20",
                note: "Claim submitted successfully."
            },
            {
                status: "Approved",
                date: "2026-04-22",
                note: "Claim approved."
            },
            {
                status: "Settled",
                date: "2026-04-25",
                note: "Settlement payment processed."
            }
        ],
        reviewerComments: "Approved and paid."
    }
];

// ============================================
// Sample Documents
// ============================================

const defaultDocuments = [
    {
        id: 1,
        claimId: 1,
        name: "Medical Report",
        fileName: "medical-report.pdf",
        fileType: "application/pdf",
        uploadDate: "2026-06-20",
        dataUrl: ""
    },
    {
        id: 2,
        claimId: 2,
        name: "Vehicle Damage Photo",
        fileName: "vehicle-damage.jpg",
        fileType: "image/jpeg",
        uploadDate: "2026-06-22",
        dataUrl: ""
    },
    {
        id: 3,
        claimId: 3,
        name: "Property Assessment",
        fileName: "property-assessment.pdf",
        fileType: "application/pdf",
        uploadDate: "2026-05-25",
        dataUrl: ""
    }
];

// ============================================
// Sample Reviews
// ============================================

const defaultReviews = [
    {
        id: 1,
        claimId: 1,
        reviewer: "Admin",
        comments: "Medical documents are being verified.",
        status: "Under Review",
        date: "2026-06-21"
    },
    {
        id: 2,
        claimId: 3,
        reviewer: "Admin",
        comments: "All required documents verified.",
        status: "Approved",
        date: "2026-05-28"
    }
];

// ============================================
// Sample Settlements
// ============================================

const defaultSettlements = [
    {
        id: 1,
        claimId: 6,
        settlementAmount: 18000,
        paymentDate: "2026-04-25",
        paymentStatus: "Paid",
        notes: "Settlement successfully processed."
    }
];

// ============================================
// Demo Users
// ============================================

const defaultUsers = [
    {
        id: 1,
        name: "Admin User",
        email: "admin@claimpro.com",
        password: "admin123",
        role: "admin"
    },
    {
        id: 2,
        name: "Demo Customer",
        email: "user@claimpro.com",
        password: "user123",
        role: "customer"
    }
];

// ============================================
// LocalStorage Helper Functions
// ============================================

function getStoredData(key, defaultValue = []) {
    try {
        const storedData = localStorage.getItem(key);

        if (storedData === null) {
            return defaultValue;
        }

        const parsedData = JSON.parse(storedData);

        return parsedData;
    } catch (error) {
        console.error("Error reading LocalStorage:", error);
        return defaultValue;
    }
}

function saveStoredData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Error saving LocalStorage:", error);
        alert("Unable to save data. Browser storage may be full.");
        return false;
    }
}

// ============================================
// Initialize Application Data
// ============================================

function initializeStorage() {
    const dataDefaults = [
        [STORAGE_KEYS.claims, defaultClaims],
        [STORAGE_KEYS.documents, defaultDocuments],
        [STORAGE_KEYS.reviews, defaultReviews],
        [STORAGE_KEYS.settlements, defaultSettlements]
    ];

    dataDefaults.forEach(([key, defaultData]) => {
        if (localStorage.getItem(key) === null) {
            saveStoredData(key, defaultData);
        }
    });

    // Preserve existing users while ensuring demo accounts exist.
    let users = getStoredData(STORAGE_KEYS.users, []);

    defaultUsers.forEach(defaultUser => {
        const exists = users.some(
            user => user.email.toLowerCase() === defaultUser.email.toLowerCase()
        );

        if (!exists) {
            users.push(defaultUser);
        }
    });

    saveStoredData(STORAGE_KEYS.users, users);
}

// ============================================
// Global Data Access Functions
// ============================================

function getClaims() {
    return getStoredData(STORAGE_KEYS.claims, []);
}

function saveClaims(claims) {
    return saveStoredData(STORAGE_KEYS.claims, claims);
}

function getDocuments() {
    return getStoredData(STORAGE_KEYS.documents, []);
}

function saveDocuments(documents) {
    return saveStoredData(STORAGE_KEYS.documents, documents);
}

function getReviews() {
    return getStoredData(STORAGE_KEYS.reviews, []);
}

function saveReviews(reviews) {
    return saveStoredData(STORAGE_KEYS.reviews, reviews);
}

function getSettlements() {
    return getStoredData(STORAGE_KEYS.settlements, []);
}

function saveSettlements(settlements) {
    return saveStoredData(STORAGE_KEYS.settlements, settlements);
}

function getUsers() {
    return getStoredData(STORAGE_KEYS.users, []);
}

function saveUsers(users) {
    return saveStoredData(STORAGE_KEYS.users, users);
}

// ============================================
// Utility Functions
// ============================================

function generateClaimNumber() {
    const claims = getClaims();

    const nextNumber = claims.length + 1;

    return `CLM-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`;
}

function generateId(items) {
    if (!items.length) {
        return 1;
    }

    return Math.max(...items.map(item => Number(item.id) || 0)) + 1;
}

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);
}

// ============================================
// Start Data Initialization
// ============================================

initializeStorage();

console.log("ClaimPro data initialized successfully.");
