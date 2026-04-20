import React from 'react';

export const PrivacyPolicy = () => {
    return (
        <div className="pt-32 pb-24 px-6 max-w-[800px] mx-auto min-h-screen">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 tracking-tight">Privacy Policy</h1>
            
            <div className="space-y-8 text-zinc-400 leading-relaxed text-lg">
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">1. Data Collection</h2>
                    <p>PharmaTrace collects essential data to ensure supply chain integrity. This includes:</p>
                    <ul className="list-disc pl-5 mt-4 space-y-2">
                        <li><strong className="text-zinc-300">User Accounts:</strong> Name, role (Manufacturer, Distributor, Pharmacy), company name, and contact information.</li>
                        <li><strong className="text-zinc-300">Scan Logs:</strong> Timestamps and cryptographic signatures generated during QR code scans.</li>
                        <li><strong className="text-zinc-300">Location Data:</strong> GPS coordinates collected during product handoffs for geo-fencing validation.</li>
                        <li><strong className="text-zinc-300">Device Information:</strong> Basic device identifiers used during the scanning process to detect fraudulent activities.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">2. Data Usage</h2>
                    <p>The collected data is exclusively used to maintain a secure cryptographic ledger. Applications include:</p>
                    <ul className="list-disc pl-5 mt-4 space-y-2">
                        <li><strong className="text-zinc-300">Supply Chain Verification:</strong> Validating the origin and transit path of pharmaceutical batches.</li>
                        <li><strong className="text-zinc-300">Fraud Detection:</strong> Identifying anomalies such as impossible transit speeds or cloned QR codes.</li>
                        <li><strong className="text-zinc-300">Network Security:</strong> Monitoring platform health and preventing unauthorized access attempts.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">3. Data Retention</h2>
                    <p>Transaction logs and cryptographic signatures are retained permanently on the immutable ledger for audit and compliance purposes. Personal user data is retained as long as the account is active, and is securely archived for a minimum of 7 years post-termination to comply with global pharmaceutical tracking regulations.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Sharing</h2>
                    <p>PharmaTrace does not sell user data. Data is only shared with authorized regulatory bodies (e.g., FDA, EMA) upon legal request, or with verified supply chain participants strictly for the purpose of validating product authenticity along the chain of custody.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">5. User Rights</h2>
                    <p>Users maintain the right to:</p>
                    <ul className="list-disc pl-5 mt-4 space-y-2">
                        <li>Access a copy of their submitted personal data.</li>
                        <li>Request correction of inaccurate organizational details.</li>
                        <li>Request account deletion (Note: immutable ledger entries regarding product scans cannot be deleted to preserve supply chain integrity, but personally identifiable information will be anonymized).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">6. Contact Information</h2>
                    <p>For any privacy-related concerns or data requests, please contact our Data Protection Officer at <a href="mailto:privacy@pharmatrace.com" className="text-blue-400 hover:underline">privacy@pharmatrace.com</a>.</p>
                </section>
            </div>
        </div>
    );
};
