export const MOCK_PRODUCT = {
    id: "PROD-88219-X",
    name: "Amoxicillin 500mg",
    manufacturer: "PharmaCorp Global Ltd.",
    batchNumber: "BATCH-2024-001",
    serialNumber: "SN-99882211",
    mfgDate: "2025-09-01",
    expDate: "2027-09-01",
};

export const MOCK_EVENTS = [
    {
        stage: "Distribution",
        handler: "MedLogistics Inc.",
        location: "Regional Hub, Chicago, IL",
        timestamp: "2025-10-15 08:30:00",
        notes: "Received in good condition. Temperature logs verified.",
    },
    {
        stage: "Manufacturing",
        handler: "PharmaCorp Global Ltd.",
        location: "Production Facility #4, Basel, Switzerland",
        timestamp: "2025-09-01 14:00:00",
        notes: "Batch produced and quality checked. Released for shipping.",
    },
];
