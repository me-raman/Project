import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const Compliance = () => {
    return (
        <div className="pt-32 pb-24 px-6 max-w-[800px] mx-auto min-h-screen">
            <a href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8 group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
            </a>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 tracking-tight">Compliance & Security</h1>
            
            <div className="space-y-8 text-zinc-400 leading-relaxed text-lg">
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">1. Regulatory Standards Followed</h2>
                    <p>PharmaTrace is engineered to help pharmaceutical stakeholders meet and exceed stringent global regulatory requirements, including:</p>
                    <ul className="list-disc pl-5 mt-4 space-y-2">
                        <li><strong className="text-zinc-300">World Health Organization (WHO):</strong> Guidelines on the operation of tracking and tracing systems for medical products.</li>
                        <li><strong className="text-zinc-300">U.S. FDA Drug Supply Chain Security Act (DSCSA):</strong> Meeting requirements for interoperable, electronic tracing of products at the package level.</li>
                        <li><strong className="text-zinc-300">EU Falsified Medicines Directive (FMD):</strong> Ensuring end-to-end verification and point-of-dispense authentication.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">2. Data Security Compliance</h2>
                    <p>To protect sensitive supply chain data and ensure the authenticity of the verification process, our platform employs state-of-the-art security measures:</p>
                    <ul className="list-disc pl-5 mt-4 space-y-2">
                        <li><strong className="text-zinc-300">Encryption Standards:</strong> All data in transit is secured via TLS 1.3, and data at rest is encrypted using AES-256 standards.</li>
                        <li><strong className="text-zinc-300">Cryptographic Signatures:</strong> Every QR code utilizes advanced hashing algorithms (SHA-256) combined with unique digital signatures to prevent cloning.</li>
                        <li><strong className="text-zinc-300">Immutable Ledger:</strong> Transactions are recorded on an append-only distributed ledger preventing retroactive manipulation.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">3. Audit Trail Capabilities</h2>
                    <p>PharmaTrace provides a comprehensive, tamper-evident audit trail for every single scanned unit. The system logs the handler identity, precise GPS coordinates, timestamp, and verification status at every step of the supply chain journey, ensuring complete transparency for regulatory audits.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">4. Enabling Business Compliance</h2>
                    <p>We empower manufacturers and logistics partners to easily fulfill their legal reporting obligations. Our automated reporting tools aggregate scan data to instantly generate compliance documentation required for cross-border shipping and local health authority inspections.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">5. Certifications</h2>
                    <p>Our infrastructure holds key industry certifications including ISO/IEC 27001 (Information Security Management) and is regularly subjected to third-party penetration testing and compliance audits to guarantee the highest level of systemic integrity.</p>
                </section>
            </div>
        </div>
    );
};
