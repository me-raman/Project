import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const TermsOfService = () => {
    return (
        <div className="pt-32 pb-24 px-6 max-w-[800px] mx-auto min-h-screen">
            <a href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8 group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
            </a>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 tracking-tight">Terms of Service</h1>
            
            <div className="space-y-8 text-zinc-400 leading-relaxed text-lg">
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                    <p>By accessing or using the PharmaTrace platform ("Platform"), you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not access the Platform or use our cryptographic verification services.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">2. Platform Usage Rules</h2>
                    <p>Usage of the Platform is strictly regulated based on your verified role:</p>
                    <ul className="list-disc pl-5 mt-4 space-y-2">
                        <li><strong className="text-zinc-300">Manufacturers:</strong> Must accurately register all valid production batches and generate corresponding cryptographic signatures.</li>
                        <li><strong className="text-zinc-300">Distributors:</strong> Must log all handoffs and accurately record location data to maintain the chain of custody.</li>
                        <li><strong className="text-zinc-300">Pharmacies:</strong> Must execute final verification scans before dispensing medication to patients.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">3. Prohibited Activities</h2>
                    <p>To ensure the integrity of the global pharmaceutical supply chain, the following activities are strictly prohibited:</p>
                    <ul className="list-disc pl-5 mt-4 space-y-2">
                        <li>Tampering with, copying, or attempting to clone PharmaTrace cryptographic QR codes.</li>
                        <li>Submitting false location data or attempting to bypass geo-fencing restrictions.</li>
                        <li>Unauthorized access to the immutable ledger or attempting to manipulate transaction history.</li>
                        <li>Using the platform to distribute unverified, counterfeit, or recalled medications.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">4. Liability Limitations</h2>
                    <p>PharmaTrace provides a cryptographic verification tool. We do not manufacture, distribute, or dispense pharmaceutical products. PharmaTrace shall not be held liable for physical damages, health complications, or losses arising from the use of products verified or unverified through the Platform. Our liability is strictly limited to the technical functionality of the tracking ledger.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">5. Account Termination</h2>
                    <p>PharmaTrace reserves the right to suspend or instantly terminate any account found engaging in prohibited activities, failing compliance audits, or demonstrating anomalous transit behavior as flagged by our AI systems. Terminated entities will be permanently blacklisted from the network.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">6. Governing Law</h2>
                    <p>These Terms shall be governed and construed in accordance with international commercial law and the regulatory frameworks of the jurisdictions in which the verified medicines are distributed, without regard to conflict of law provisions.</p>
                </section>
            </div>
        </div>
    );
};
