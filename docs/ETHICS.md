# RAALE – Data Ethics & Synthetic Data Declaration

## 1. Zero Real Patient Data Policy
RAALE is strictly designed and configured to operate in a synthetic demonstration environment. 

> [!IMPORTANT]
> **NO REAL PATIENT DATA HAS BEEN COLLECTED, STORED, OR PROCESSED.**

## 2. Synthetic Data Specifications
All data records generated in `data/raale.db` use deterministic pseudorandom generation with fixed random seeds (`seed(42)`).

Identifiers follow strict synthetic formatting:
- Patients: `PATIENT-TEST-00001` through `PATIENT-TEST-00500`
- Events: `EVT-DEMO-001`, `EVT-00010` ... `EVT-10024`
- Orders: `ORD-0001`
- Sources: `LAB_V1`, `LAB_V2`, `RADIOLOGY_LEGACY`, `RADIOLOGY_V2`, `PHARMACY_LEGACY`, `ADMISSION_V1`, `BILLING_V1`

## 3. Patient Privacy & Compliance Alignment
- No Personally Identifiable Information (PII) or Protected Health Information (PHI) is present.
- No real medical medical record numbers (MRNs), social security numbers, real names, addresses, emails, or phone numbers are collected or required.
- The platform satisfies HIPAA/GDPR demonstration safety requirements by using 100% synthetic mock datasets.
