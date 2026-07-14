---
title: "Avionics Design, Aerospace Software Engineering, and AI-Based Predictive Maintenance for Aircraft Engine Health Monitoring"
subtitle: "An Internship Report submitted in partial fulfilment of the requirements for the degree of Bachelor of Technology in Computer Engineering"
author: "Preksha Pethakar"
---

# TITLE PAGE

## HINDUSTAN AERONAUTICS LIMITED
### (A Government of India Enterprise)

## INTERNSHIP REPORT ON
**Avionics Design, Aerospace Software Engineering, and AI-Based Predictive Maintenance for Aircraft Engine Health Monitoring**

Submitted in partial fulfilment of the requirements for the award of the degree of
**Bachelor of Technology in Computer Engineering**

**Submitted by:** Preksha Pethakar
Fr. C. Rodrigues Institute of Technology (FCRIT), Vashi, Navi Mumbai

**Internship Organization:** Hindustan Aeronautics Limited (HAL), Avionics Design Division
**Duration:** June 2026 – July 2026

---

# CERTIFICATE

This is to certify that **Ms. Preksha Pethakar**, a student of Bachelor of Technology in Computer Engineering at Fr. C. Rodrigues Institute of Technology (FCRIT), Vashi, has successfully completed her industrial internship at Hindustan Aeronautics Limited (HAL), Avionics Design Division, during the period June 2026 to July 2026.

During the internship, she was exposed to aerospace software engineering concepts, avionics communication protocols, Interface Control Documents (ICDs), simulation and data-acquisition software, and secure software development practices. She also completed a machine learning project titled *AI-Based Predictive Maintenance for Aircraft Engine Health Monitoring*, based on the NASA C-MAPSS dataset, and contributed to the *Inward/Outward Document Management System (IODMS)*, a secure document-handling application for an air-gapped environment.

The work presented in this report is based on her learning, observations, and technical projects completed during the internship. To the best of our knowledge, this report does not contain confidential or classified information belonging to Hindustan Aeronautics Limited.

Place: Hyderabad
Date: ______________

Industrial Guide (Signature) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Department Guide (Signature)

---

# DECLARATION

I, **Preksha Pethakar**, hereby declare that this internship report titled *"Avionics Design, Aerospace Software Engineering, and AI-Based Predictive Maintenance for Aircraft Engine Health Monitoring"* is a record of the work carried out by me during my industrial internship at Hindustan Aeronautics Limited (HAL), Avionics Design Division, between June 2026 and July 2026, under the guidance of my industrial and departmental supervisors.

I further declare that this report is my own account of the internship, prepared from my learning, observations, and technical contributions, and does not contain any confidential, proprietary, or classified information belonging to HAL. Where the work of other authors, standards bodies, or publicly available datasets has been used, it has been duly acknowledged and cited in the References section. This report has not been submitted, in part or in full, to any other institution for the award of any other degree or diploma.

**Preksha Pethakar**
Fr. C. Rodrigues Institute of Technology (FCRIT), Vashi

---

# ACKNOWLEDGEMENT

I express my sincere gratitude to Hindustan Aeronautics Limited (HAL), Avionics Design Division, for the opportunity to undergo industrial training at one of India's premier aerospace organizations. The internship provided valuable practical exposure to aerospace software engineering, avionics systems, and modern engineering practices in the defence aviation sector.

I sincerely thank my industrial mentors and engineers at HAL for their guidance and technical support, which enabled me to understand key concepts including Interface Control Documents (ICDs), MIL-STD-1553B, ARINC 429, avionics simulation software, and secure deployment practices. I am also grateful to the faculty of Fr. C. Rodrigues Institute of Technology (FCRIT), Vashi, for their continuous academic guidance, and to my family and friends for their constant encouragement throughout this internship.

---

# ABSTRACT

The aerospace industry demands exceptionally high standards of reliability, safety, and software quality, as modern aircraft rely on hundreds of interconnected electronic systems communicating under strict timing and fault-tolerance constraints. This report documents an industrial internship undertaken at the Avionics Design Division of Hindustan Aeronautics Limited (HAL), organized around an organization study, a fundamentals study of avionics software engineering, and two applied technical projects.

The first project presents the design and evaluation of an AI-based predictive maintenance system for aircraft turbofan engine health monitoring, using the NASA Commercial Modular Aero-Propulsion System Simulation (C-MAPSS) dataset to estimate Remaining Useful Life (RUL). Random Forest, XGBoost, and Support Vector Regression (SVR) models were trained on engineered temporal features and evaluated using RMSE, MAE, R², and the NASA PHM scoring function. Particular attention is paid to the generalization gap between validation and held-out test performance: XGBoost achieved the strongest validation metrics, while SVR generalized more reliably to unseen test engines and was therefore selected for deployment through an interactive Streamlit dashboard.

The second project describes the requirement analysis, design, and secure, air-gapped deployment of the Inward/Outward Document Management System (IODMS), a full-stack application built with React, Material UI, FastAPI, and PostgreSQL, developed following a V-Model process, containerized using Docker, and deployed within an isolated local area network with role-based access control.

Collectively, this internship provided interdisciplinary exposure spanning aerospace communication standards, applied machine learning for prognostics and health management, and secure enterprise software engineering, strengthening the author's technical and professional foundation for future work in avionics and aerospace software engineering.

# KEYWORDS

Avionics, Interface Control Document, MIL-STD-1553B, ARINC 429, Prognostics and Health Management, Predictive Maintenance, Remaining Useful Life, NASA C-MAPSS, Machine Learning, V-Model, Docker, Air-Gapped Deployment.

---

# TABLE OF CONTENTS

*(Auto-generated on final formatting — chapter and section numbers below correspond to headings in this document.)*

# LIST OF FIGURES

*(To be populated as figures are inserted — placeholders are marked in-line throughout this report as "[Insert ... ]".)*

# LIST OF TABLES

*(To be populated on final formatting — all tables are numbered in-line, e.g., Table 4.1, Table 5.1.)*

# LIST OF ABBREVIATIONS

| Abbreviation | Expansion |
|---|---|
| ADC | Air Data Computer |
| AFDX | Avionics Full-Duplex Switched Ethernet |
| ARINC | Aeronautical Radio, Incorporated |
| BC | Bus Controller |
| BM | Bus Monitor |
| BPRZ | Bipolar Return-to-Zero |
| C-MAPSS | Commercial Modular Aero-Propulsion System Simulation |
| DAQ | Data Acquisition |
| EGT | Exhaust Gas Temperature |
| EMA | Exponential Moving Average |
| FCC | Flight Control Computer |
| FMC | Flight Management Computer |
| HAL | Hindustan Aeronautics Limited |
| HIL | Hardware-in-the-Loop |
| ICD | Interface Control Document |
| IODMS | Inward/Outward Document Management System |
| LAN | Local Area Network |
| LRU | Line Replaceable Unit |
| MAE | Mean Absolute Error |
| PHM | Prognostics and Health Management |
| R² | Coefficient of Determination |
| RBAC | Role-Based Access Control |
| RBF | Radial Basis Function |
| RMSE | Root Mean Square Error |
| RT | Remote Terminal |
| RUL | Remaining Useful Life |
| SDI | Source/Destination Identifier |
| SRS | Software Requirement Specification |
| SSM | Sign/Status Matrix |
| SVR | Support Vector Regression |
| TCAS | Traffic Collision Avoidance System |
| XAI | Explainable Artificial Intelligence |
| XGBoost | Extreme Gradient Boosting |

# LIST OF SYMBOLS

| Symbol | Meaning |
|---|---|
| $\hat{y}_i$ | Predicted value for the $i$-th sample |
| $y_i$ | Actual (ground-truth) value for the $i$-th sample |
| $N$ | Number of samples |
| $R^2$ | Coefficient of determination |

# REVISION HISTORY

| Version | Date | Description |
|---|---|---|
| 1.0 | June 2026 | Initial draft prepared during internship |
| 2.0 | July 2026 | Consolidated draft with predictive maintenance and IODMS chapters |
| 3.0 | July 2026 | Edited to IEEE-style formatting, resolved validation/test result discrepancy, restructured to full 8-chapter format |

---

# CHAPTER 1 — INTRODUCTION

## 1.1 Background

The aerospace industry is among the most technologically demanding engineering sectors in the world. Every aircraft integrates mechanical, electrical, electronic, and software systems that must operate together with exceptional accuracy and reliability. Unlike conventional software applications, aerospace systems operate in safety-critical environments where even a minor communication or software fault can significantly affect aircraft performance and operational safety. Consequently, aerospace software development follows rigorous engineering standards, systematic verification procedures, and internationally accepted communication protocols.

Hindustan Aeronautics Limited (HAL), India's premier aerospace and defence organization, has played a central role in adopting modern engineering practices, contributing towards the goal of self-reliance in defence manufacturing through continuous research and indigenous development. This internship at HAL's Avionics Design Division provided exposure to aerospace software engineering, avionics communication systems, machine learning applications for prognostics, and secure software deployment.

## 1.2 Aerospace Industry Overview

The global aerospace industry spans commercial aviation, military aviation, and space systems, and is characterized by long product lifecycles, extensive regulatory oversight, and a strong emphasis on safety certification. Aircraft development follows structured lifecycle models — requirements definition, design, verification, certification, production, and in-service support — governed by standards such as DO-178C for airborne software and ARP4754A for system-level development. The Indian aerospace sector, led by organizations such as HAL, DRDO, and ISRO, has grown steadily in indigenous design and manufacturing capability, moving from licensed production towards original platforms such as the LCA Tejas, while continuing to support legacy and licensed platforms including the Su-30MKI, Jaguar, and Hawk.

## 1.3 Artificial Intelligence in Aerospace

Artificial Intelligence (AI) and Machine Learning (ML) are increasingly applied across the aerospace value chain — in flight control augmentation, autonomous systems, air traffic optimization, manufacturing quality inspection, and, most relevantly to this internship, **maintenance and health monitoring**. AI techniques enable data-driven inference of system health from sensor telemetry that would be difficult to characterize using purely physics-based or rule-based models, particularly for complex, nonlinear degradation processes such as engine wear. This internship's predictive maintenance project (Chapter 4) is situated within this broader trend of AI adoption in aerospace, applying regression-based machine learning to Remaining Useful Life (RUL) estimation.

## 1.4 Aircraft Health Monitoring

Aircraft Health Monitoring encompasses the sensors, data-acquisition systems, and analytical methods used to continuously assess the condition of aircraft structures, engines, and subsystems. Traditional health monitoring relies on threshold-based alerts and scheduled inspections; modern approaches increasingly incorporate **Prognostics and Health Management (PHM)**, which combines condition monitoring with predictive analytics to estimate the future health trajectory of a component, rather than only its current state. Engine health monitoring — the specific focus of Chapter 4 — is one of the most mature applications of PHM in aviation, owing to the availability of rich sensor telemetry (temperature, pressure, vibration, rotational speed) and the high cost of unplanned engine-related downtime.

## 1.5 Predictive Maintenance

Predictive maintenance is a maintenance philosophy that schedules interventions based on the *predicted* future condition of equipment rather than fixed time intervals (preventive maintenance) or failure occurrence (corrective maintenance). By estimating a component's Remaining Useful Life from historical and real-time sensor data, predictive maintenance allows maintenance activity to be scheduled close to the point of actual need, reducing both unplanned downtime and unnecessary component replacement. This concept is developed in full technical depth in Chapter 4, which presents the machine-learning-based predictive maintenance system developed during the internship.

## 1.6 Problem Statement

Modern aircraft maintenance organizations face two related but distinct engineering problems addressed in this internship. First, avionics subsystems developed by different teams and organizations must communicate reliably and unambiguously, which requires standardized communication protocols and rigorous interface documentation — addressed through the study of MIL-STD-1553B, ARINC 429, and Interface Control Documents in Chapter 3. Second, traditional maintenance strategies (corrective or fixed-interval preventive maintenance) are inefficient for expensive, safety-critical components such as turbofan engines, motivating data-driven predictive maintenance capable of estimating Remaining Useful Life from operational sensor data — addressed through the machine learning project in Chapter 4. A related but independent organizational problem — inefficient, non-traceable manual handling of official correspondence within a secure, air-gapped environment — is addressed through the IODMS project in Chapter 5.

## 1.7 Internship Objectives

The objectives of this internship were to:

1. Understand the organizational structure and engineering practices of HAL's Avionics Design Division.
2. Study avionics communication protocols (MIL-STD-1553B, ARINC 429) and the role of Interface Control Documents.
3. Gain conceptual knowledge of simulation software, data acquisition systems, the Qt framework, and signal mapping.
4. Design, train, and evaluate machine learning models for Remaining Useful Life prediction using the NASA C-MAPSS dataset, including rigorous validation-versus-test generalization analysis.
5. Deploy the selected predictive maintenance model through an interactive dashboard for engine health monitoring.
6. Study and contribute to the design, secure deployment, and testing of an enterprise document management system (IODMS) within an air-gapped environment.
7. Strengthen professional competencies in technical documentation, analytical reasoning, and systematic engineering problem-solving.

## 1.8 Scope of Work

The scope of this internship spans theoretical learning in aerospace communication standards, applied machine learning for predictive maintenance, and full-stack secure software engineering. It does not include hands-on modification of certified, in-service HAL avionics software; work on live ICDs was limited to conceptual study rather than authorship of production interface documents. The predictive maintenance project is scoped to the publicly available NASA C-MAPSS benchmark dataset (FD001 subset) rather than proprietary HAL sensor telemetry, and the IODMS project is scoped to the application layer, database, and deployment engineering rather than the physical network infrastructure of the air-gapped environment.

## 1.9 Report Methodology

This report follows a documentation methodology consistent with engineering internship and technical reporting practice: Chapter 2 presents an organizational study based on publicly available information about HAL and direct observation during the internship; Chapter 3 presents a conceptual/technical study of avionics communication fundamentals; Chapters 4 and 5 present the two applied technical projects using a standard project-reporting structure — problem definition, design, implementation, evaluation, and results — with Chapter 4 following a machine learning experimental methodology (dataset, preprocessing, modelling, evaluation) and Chapter 5 following a software engineering lifecycle methodology (requirements, design, implementation, testing, deployment). Chapter 6 consolidates and cross-compares the results of both projects, Chapter 7 reflects on professional learning outcomes, and Chapter 8 concludes the report.

## 1.10 Contributions of the Internship

The internship's technical contributions were: (i) a working, evaluated machine learning pipeline for turbofan engine RUL prediction, including a validation-versus-test generalization analysis that led to a deployment decision differing from the naive best-validation-score choice; (ii) an interactive Streamlit dashboard for real-time RUL estimation; and (iii) direct contribution to the Docker-based, air-gapped, LAN deployment of the IODMS application, including container orchestration and offline installation procedure design. Non-technical contributions include this consolidated technical report, prepared to IEEE-influenced documentation standards.

## 1.11 Organization of the Report

This report is organized into eight chapters. **Chapter 2** presents an organizational study of HAL. **Chapter 3** details avionics software engineering fundamentals. **Chapter 4** presents the AI-based predictive maintenance project in full technical depth. **Chapter 5** presents the IODMS project following a software engineering lifecycle structure. **Chapter 6** consolidates results and technical discussion across both projects. **Chapter 7** reflects on industrial learning and professional development. **Chapter 8** presents conclusions and recommendations for future work.

---

# CHAPTER 2 — ORGANIZATION STUDY

## 2.1 Introduction

This chapter presents a study of Hindustan Aeronautics Limited (HAL) as an organization, its history, structure, and engineering culture, together with an account of the specific internship environment within the Avionics Design Division.

## 2.2 Hindustan Aeronautics Limited

Hindustan Aeronautics Limited (HAL) is India's premier aerospace and defence public sector undertaking, operating under the Ministry of Defence, Government of India. HAL has played a central role in strengthening the country's defence preparedness through the design, development, manufacturing, maintenance, and modernization of aircraft, helicopters, aero-engines, avionics systems, and related technologies, evolving from a licensed manufacturer into one of Asia's leading aerospace organizations and contributing towards the vision of *Atmanirbhar Bharat* (self-reliance in defence manufacturing).

*Figure 2.1: Hindustan Aeronautics Limited corporate logo. [Insert HAL logo]*

## 2.3 History of HAL

HAL traces its origins to 1940, when Hindustan Aircraft Limited was established in Bengaluru by industrialist Walchand Hirachand, initially focused on aircraft manufacturing and maintenance. Following India's independence, the organization's infrastructure and research activities expanded steadily. In 1964, Hindustan Aircraft Limited merged with Aeronautics India Limited to form the present-day Hindustan Aeronautics Limited, enabling centralized development of aircraft, helicopters, engines, and avionics. Over subsequent decades, HAL manufactured numerous aircraft under licensed production agreements while developing indigenous platforms, establishing specialized divisions for aircraft manufacturing, helicopter production, engine development, avionics design, and software engineering.

## 2.4 Vision and Mission

HAL's vision is to become a globally recognized aerospace organization through continuous technological innovation and indigenous capability development. Its mission emphasizes the design, development, manufacture, repair, and lifecycle support of aerospace products meeting defence and civil aviation requirements, with a focus on quality, safety, and reliability. HAL's core values — integrity, professionalism, innovation, teamwork, accountability, customer focus, safety, and commitment to national development — guide engineering decisions and organizational culture across all divisions.

## 2.5 Major Products and Services

HAL's most significant indigenous achievement is the **Light Combat Aircraft (LCA) Tejas**, India's first indigenously designed fourth-generation multirole fighter, incorporating advanced composite materials, digital fly-by-wire control, and glass-cockpit avionics. The **HTT-40** Basic Trainer Aircraft supports Indian Air Force pilot training, and the **Dornier Do-228** twin-turboprop aircraft serves passenger transport, maritime surveillance, and disaster-relief roles. HAL also manufactures and upgrades internationally recognized aircraft — including the Sukhoi Su-30MKI, Jaguar, Hawk Advanced Jet Trainer, and MiG-series aircraft — under licensed production programmes, and provides overhaul, repair, system integration, software development, and lifecycle-management services across its product range.

*Figure 2.2: Major aircraft platforms manufactured by HAL (Tejas, HTT-40, Dornier Do-228, Su-30MKI, Hawk AJT). [Insert aircraft collage]*

## 2.6 Organizational Structure

HAL operates through multiple production divisions, research centres, design organizations, and maintenance facilities, each specializing in a specific aerospace domain. The Chairman and Managing Director (CMD) provides overall strategic leadership, supported by functional directors overseeing engineering, finance, production, human resources, R&D, quality assurance, and marketing; individual divisions are headed by Executive Directors or General Managers.

*Figure 2.3: Organizational structure of Hindustan Aeronautics Limited. [Insert organizational chart]*

## 2.7 Avionics Design Division

The Avionics Design Division, where this internship was conducted, is responsible for the development, integration, testing, and maintenance of avionics systems used in military and civilian aircraft. Engineers in this division collaborate closely with aircraft manufacturers, software developers, hardware designers, and system integration teams to ensure seamless communication between onboard aircraft systems, working extensively with ICDs, MIL-STD-1553B, ARINC 429, simulation software, and acquisition tools.

## 2.8 Engineering Environment

The engineering environment within the Avionics Design Division follows structured, document-driven development practices typical of safety-critical aerospace software engineering: requirements and interfaces are formally specified (via ICDs and related documentation) before implementation, changes are managed through version-controlled revisions, and software is verified against documented specifications using dedicated simulation and acquisition tools rather than ad hoc testing. This contrasts with typical commercial software environments, where interface changes can be made and deployed comparatively informally.

## 2.9 Quality Management Practices

Quality management within HAL's engineering divisions is grounded in configuration management, formal design reviews, and traceability between requirements, design artifacts, and verification evidence — practices broadly aligned with aerospace quality frameworks such as AS9100. Every engineering document, including ICDs, is subject to structured review cycles involving software engineers, hardware designers, and quality assurance personnel before approval, and revision histories are maintained to preserve traceability across the product lifecycle.

## 2.10 Safety Practices

Given the safety-critical nature of avionics systems, safety practices within the division emphasize redundancy (e.g., dual-redundant communication buses), deterministic timing, rigorous error detection (parity checking, status-word fault reporting), and extensive pre-deployment verification through simulation and Hardware-in-the-Loop testing before any software or interface change reaches an operational aircraft system.

## 2.11 Internship Environment

The internship was conducted on-site within the Avionics Design Division, with day-to-day guidance from an industrial mentor and periodic review by departmental supervisors. Work was structured around short technical study modules (communication protocols and documentation practices) followed by two applied project assignments (predictive maintenance and IODMS), with regular informal reviews of progress and technical understanding.

## 2.12 Internship Timeline

**Table 2.1 — Internship Timeline**

| Phase | Duration | Activity |
|---|---|---|
| Phase 1 | Weeks 1–2 | Orientation; study of ICDs, MIL-STD-1553B, ARINC 429, Qt, simulation and acquisition software |
| Phase 2 | Weeks 3–6 | Predictive maintenance project — data preprocessing, feature engineering, model training and evaluation |
| Phase 3 | Weeks 7–8 | Streamlit dashboard deployment; validation-vs-test generalization analysis |
| Phase 4 | Weeks 9–10 | IODMS study and contribution — Docker containerization and air-gapped deployment |
| Phase 5 | Weeks 11–12 | Testing, documentation, and report preparation |

## 2.13 Software and Tools Used

**Table 2.2 — Software and Tools Used During the Internship**

| Category | Tools / Technologies |
|---|---|
| Programming Languages | Python, JavaScript |
| Machine Learning Libraries | scikit-learn, XGBoost |
| Data Handling | Pandas, NumPy |
| Visualization / Deployment | Streamlit, Matplotlib |
| Frontend | ReactJS, Material UI |
| Backend | FastAPI |
| Database | PostgreSQL |
| Containerization | Docker, Docker Compose |
| Documentation | Interface Control Documents, engineering revision-controlled documentation |

## 2.14 Learning Outcomes

The organizational study phase of the internship developed the author's understanding of how a large, safety-critical aerospace organization structures engineering work — through formal documentation, staged review, and configuration management — and how these practices differ meaningfully from typical academic or commercial software development, providing important context for the technical projects presented in later chapters.

## 2.15 Chapter Summary

This chapter presented an overview of Hindustan Aeronautics Limited — its history, structure, products, and engineering and quality practices — together with a description of the internship environment, timeline, and tools used. The next chapter presents the avionics software engineering fundamentals studied during the internship.

---

# CHAPTER 3 — AVIONICS SOFTWARE ENGINEERING FUNDAMENTALS

## 3.1 Introduction

Modern aircraft operate as highly integrated systems in which numerous electronic subsystems continuously exchange information during every phase of flight. Flight control computers, navigation systems, mission computers, radar processors, engine monitoring units, and cockpit displays must communicate accurately and within strict timing constraints; any delay, corruption, or inconsistency can adversely affect aircraft performance and flight safety. This chapter presents the communication standards, documentation practices, and software tools studied during the internship that collectively underpin reliable avionics software engineering.

## 3.2 Aircraft Avionics Architecture

Aircraft avionics architecture is organized around a set of Line Replaceable Units (LRUs) — mission computers, flight control computers, navigation systems, radar processors, engine monitoring units, and cockpit displays — interconnected through standardized communication buses. Unlike general-purpose computer networks, avionics architectures are designed with deterministic timing, redundancy, and fault tolerance as first-class requirements, since communication failures can directly compromise flight safety. Standardization of both the physical communication layer (e.g., MIL-STD-1553B, ARINC 429) and the documentation layer (ICDs) enables LRUs developed by different manufacturers to interoperate reliably.

## 3.3 Interface Control Documents (ICD)

An Interface Control Document (ICD) is a formal engineering artifact that defines how two or more subsystems communicate, specifying every parameter required for unambiguous data exchange between independently developed hardware and software modules. An ICD typically specifies message identifiers, signal names, data formats, scaling factors, engineering units, transmission frequency, timing requirements, source/destination equipment, communication protocol, error-detection methods, and revision history.

**Components of an ICD** typically include:

- **Interface Identification** — communicating equipment, subsystem names, and revision details.
- **Signal Definition** — parameter names, engineering units, operating ranges, and scaling equations.
- **Communication Parameters** — message frequency, bus speed, synchronization, bus addresses, and priority.
- **Data Format** — bit allocation, word size, byte order, and checksum calculation.
- **Error Handling** — fault detection, timeout conditions, and redundancy management.
- **Revision History** — version-controlled record of all interface modifications.

The ICD development process begins with system requirements analysis, followed by interface specification, multi-disciplinary technical review, implementation, and simulation-based verification, with the document remaining a living, version-controlled artifact throughout the aircraft's operational life.

**Table 3.1 — Advantages of Interface Control Documents**

| Aspect | Benefit |
|---|---|
| Standardization | Uniform communication between subsystems |
| Integration | Simplifies hardware and software integration |
| Testing | Supports verification and validation |
| Maintenance | Facilitates upgrades and troubleshooting |
| Configuration Management | Maintains version control |
| Safety | Improves operational dependability |

*Figure 3.1: ICD development lifecycle (Requirements → Design → Documentation → Review → Implementation → Testing → Maintenance). [Insert flow diagram]*

## 3.4 Signal Mapping

Signal mapping establishes the correspondence between physical sensor signals (pressure, temperature, altitude, engine speed) and the software parameters used by avionics applications, specifying engineering units, scaling equations, data types, and update frequency in accordance with the relevant ICD. Accurate signal mapping is critical, since misinterpretation can result in incorrect cockpit displays or flight-control behaviour; it also simplifies maintenance, as new sensors can be integrated by updating mapping configurations rather than redesigning software.

## 3.5 MIL-STD-1553B

MIL-STD-1553B is one of the most widely adopted military communication standards, used in aircraft, helicopters, missiles, and naval and space systems [10]. Developed by the U.S. Department of Defense, it establishes a reliable, fault-tolerant, deterministic communication network for mission-critical aerospace systems. The protocol uses a **command–response architecture**, centrally controlled by a Bus Controller, over a dual-redundant twisted shielded-pair cable operating at 1 Mbps, with two physically separate channels (Bus A and Bus B) providing redundancy.

*Figure 3.2: MIL-STD-1553B bus architecture. [Insert architecture diagram]*

## 3.6 Bus Controller

The **Bus Controller (BC)** acts as the master of the communication network. It initiates every transaction by issuing Command Words to designated Remote Terminals, sequences message transmission, and manages timing to ensure that no two terminals transmit simultaneously — maintaining deterministic behaviour throughout the network.

## 3.7 Remote Terminal

A **Remote Terminal (RT)** represents an avionics subsystem connected to the bus — for example, a flight control computer, engine control unit, navigation system, or cockpit display computer. Each RT has a unique address enabling the Bus Controller to identify and communicate with it individually, and an RT responds only when commanded by the Bus Controller.

## 3.8 Bus Monitor

A **Bus Monitor (BM)** passively observes all communication on the data bus without transmitting, and is used during testing, simulation, debugging, and fault diagnosis to verify communication correctness, analyse transmitted messages, and identify protocol violations during system integration.

*Figure 3.3: Bus Controller, Remote Terminal, and Bus Monitor interaction. [Insert functional block diagram]*

## 3.9 MIL-STD-1553B Word Format

Communication occurs through standardized 20-bit words comprising 16 information bits plus synchronization and parity bits, in three formats:

- **Command Word** — issued by the BC; specifies RT address, transmit/receive mode, sub-address, and word count.
- **Data Word** — carries the actual engineering information (e.g., engine parameters, navigation data).
- **Status Word** — returned by the RT after each transaction, indicating success or reporting faults such as parity or busy conditions.

Communication follows a deterministic command–response sequence: the BC transmits a Command Word, the RT responds with Data Word(s), and the RT returns a Status Word confirming completion, with only one device permitted to transmit at any instant.

*Figure 3.4: Command Word, Data Word, and Status Word formats and communication sequence. [Insert word-format / sequence diagram]*

## 3.10 Error Detection

Reliability in MIL-STD-1553B is reinforced by an odd parity bit on every transmitted word, enabling detection of single-bit errors, and Manchester II bi-phase encoding, which provides synchronization and improves resistance to electromagnetic interference. The protocol's dual-redundant buses (Bus A / Bus B) allow automatic switchover on channel failure, and Status Words continuously inform the Bus Controller of subsystem health and communication errors, enabling rapid fault detection.

## 3.11 ARINC 429

ARINC 429, developed by Aeronautical Radio, Incorporated, is the most widely used communication standard in commercial aviation [11]. Unlike MIL-STD-1553B, ARINC 429 uses a **simplex architecture**: one transmitter continuously broadcasts to one or more receivers, eliminating message collisions by design. It supports transmission speeds of 12.5 kbps (low speed) and 100 kbps (high speed), sufficient for the deterministic, moderate-bandwidth communication needs of commercial avionics subsystems such as Flight Management Computers, Air Data Computers, and TCAS.

*Figure 3.5: ARINC 429 communication architecture. [Insert bus architecture diagram]*

## 3.12 ARINC 429 Word Format

Each ARINC 429 transmission is a fixed 32-bit word:

| Bits | Field | Description |
|---|---|---|
| 1–8 | Label | Identifies the transmitted parameter (octal notation) |
| 9–10 | SDI | Source/Destination Identifier |
| 11–29 | Data Field | Engineering value (BNR, BCD, or discrete) |
| 30–31 | SSM | Sign/Status Matrix — validity of the data |
| 32 | Parity | Odd parity bit for error detection |

Receiving equipment compares an incoming Label against its predefined list and decodes only matching messages; unrelated labels are ignored. The protocol uses Bipolar Return-to-Zero (BPRZ) encoding with differential signalling for strong immunity to electromagnetic interference.

*Figure 3.6: Standard 32-bit ARINC 429 word format. [Insert word-structure diagram]*

## 3.13 MIL-STD-1553B vs ARINC 429

**Table 3.2 — Comparison between MIL-STD-1553B and ARINC 429**

| Parameter | MIL-STD-1553B | ARINC 429 |
|---|---|---|
| Primary application | Military aircraft | Commercial aircraft |
| Communication type | Command–response | Simplex |
| Data rate | 1 Mbps | 12.5 / 100 kbps |
| Bus controller | Required | Not required |
| Communication direction | Bidirectional | Unidirectional |
| Maximum terminals | 31 Remote Terminals | One transmitter, multiple receivers |
| Redundancy | Dual bus | Optional |
| Typical applications | Fighter aircraft, helicopters, missiles | Airliners, business jets, navigation systems |

MIL-STD-1553B prioritizes deterministic, centrally controlled, redundant communication suited to complex military mission systems, whereas ARINC 429 prioritizes simplicity and ease of maintenance for commercial avionics — both achieving high reliability through different, equally rigorous engineering philosophies.

## 3.14 Qt Framework

The **Qt framework**, a cross-platform C++ application development framework, is widely used in aerospace software for graphical user interfaces, embedded software, and simulation tools. Its **signal–slot mechanism** allows independent software modules to exchange events without tight coupling, simplifying architecture and improving scalability. In aerospace contexts, Qt is commonly used for cockpit display software, mission planning tools, engineering simulation, and ground support equipment.

## 3.15 Simulation Software

Simulation software allows engineers to validate avionics software behaviour under normal and abnormal operating scenarios — engine startup, communication failures, sensor malfunctions — without the cost and risk of testing on operational aircraft. A key application is **Hardware-in-the-Loop (HIL) testing**, in which real hardware components interact with virtual aircraft models before integration, reducing both testing cost and defect-discovery time.

## 3.16 Data Acquisition Software

Data acquisition (DAQ) software collects, monitors, and analyses live communication traffic during testing, verifying that every subsystem communicates according to its ICD. It supports replay of recorded sessions for repeatable debugging and protocol-compliance monitoring — detecting missing messages, incorrect addressing, parity errors, and timing violations.

## 3.17 Engineering Documentation

Beyond ICDs, avionics software engineering relies on structured engineering documentation throughout the development lifecycle — requirements specifications, design documents, test plans and reports, and revision-controlled configuration records — to maintain traceability between what a system is required to do, how it is implemented, and how it has been verified. This document-driven discipline is a defining characteristic of safety-critical aerospace software engineering, distinguishing it from less formally documented commercial software practice.

## 3.18 Chapter Summary

This chapter presented the aerospace software engineering foundations studied during the internship — aircraft avionics architecture, Interface Control Documents, signal mapping, the MIL-STD-1553B and ARINC 429 protocols and their respective word formats and error-detection mechanisms, the Qt framework, and simulation and data-acquisition software. These concepts establish the standardized, verification-driven engineering discipline underlying avionics software development. The next chapter presents the AI-based predictive maintenance project developed during the internship.

---

# CHAPTER 4 — AI-BASED PREDICTIVE MAINTENANCE FOR AIRCRAFT ENGINE HEALTH MONITORING

## 4.1 Introduction

This chapter presents the design, implementation, and evaluation of a machine-learning-based predictive maintenance system for aircraft turbofan engines, developed using the NASA Commercial Modular Aero-Propulsion System Simulation (C-MAPSS) dataset. The chapter follows a standard machine learning experimental methodology: problem framing, literature review, dataset description, preprocessing, feature engineering, model development, evaluation, and deployment.

## 4.2 Aircraft Engine Maintenance

Aircraft engine performance directly influences flight safety, operational efficiency, fuel consumption, and maintenance cost, making engines one of the most closely monitored aircraft subsystems. Engine maintenance decisions must balance the operational risk of unexpected in-service failure against the cost of unnecessarily early component replacement.

## 4.3 Maintenance Strategies

Three broad maintenance strategies are used in aviation. **Corrective maintenance** performs repairs only after a failure occurs, minimizing unnecessary intervention but risking unplanned downtime and, for critical components, safety consequences. **Preventive maintenance** replaces or services components at fixed operating intervals, reducing unexpected failures but often replacing components that still have useful life remaining. **Predictive maintenance** uses condition-monitoring data and analytical models to estimate the actual health state of a component and schedule maintenance close to the point of genuine need, combining the risk reduction of preventive maintenance with the efficiency of corrective maintenance.

*Figure 4.1: Evolution of maintenance strategies — reactive, preventive, predictive. [Insert diagram]*

## 4.4 Predictive Maintenance

Predictive maintenance continuously analyses sensor data — temperature, pressure, vibration, fuel flow, rotational speed, exhaust gas temperature — to identify degradation patterns not easily observed through conventional inspection, estimating Remaining Useful Life (RUL) and scheduling maintenance accordingly. This reduces unscheduled downtime, improves fleet availability, and lowers maintenance cost relative to fixed-interval preventive maintenance.

## 4.5 Prognostics and Health Management (PHM)

Prognostics and Health Management (PHM) is the broader engineering discipline within which predictive maintenance sits, encompassing fault detection, fault diagnosis, and prognosis (prediction of future health state and RUL). PHM originated substantially in aerospace and defence applications, where the cost of both unplanned failure and unnecessary maintenance is high, and NASA's Prognostics Center of Excellence — the source of the C-MAPSS dataset used in this project — has been a major contributor to PHM research and benchmark dataset development [1], [2].

## 4.6 Remaining Useful Life (RUL)

**Remaining Useful Life (RUL)** is the number of operational cycles remaining before a component reaches its failure condition:

$$\text{RUL} = \text{Failure Cycle} - \text{Current Operating Cycle}$$

For example, an engine expected to fail after 250 cycles that has completed 180 cycles has an RUL of 70 cycles. Because engine degradation is nonlinear and influenced by numerous operating conditions, RUL estimation is treated as a supervised regression problem, with RUL as the target variable.

*Figure 4.2: Remaining Useful Life prediction curve. [Insert engine degradation graph]*

## 4.7 Literature Review

The NASA C-MAPSS dataset has been used extensively as a benchmark for RUL estimation research since its release [1], [2]. Early work by Saxena et al. [1] introduced the simulated turbofan degradation dataset and the associated PHM scoring function, motivating a large body of subsequent research. Heimes [12] applied recurrent neural networks to C-MAPSS RUL estimation as one of the earliest deep-learning approaches to the problem. Subsequent work explored deep convolutional architectures for RUL prediction, treating multivariate sensor sequences as an image-like input for feature extraction [13], while other studies applied Long Short-Term Memory (LSTM) networks to directly model the temporal degradation sequence without explicit sliding-window feature engineering [14], [15]. Classical machine learning approaches — including Random Forests, Support Vector Regression, and gradient-boosted trees — have also been widely applied to C-MAPSS, generally after explicit feature engineering (rolling statistics, exponential smoothing, sliding windows) of the kind used in this project, and remain competitive with deep learning approaches on the smaller, single-condition subsets such as FD001, while typically requiring less training data and computational cost.

## 4.8 Research Gap

While much of the published literature on C-MAPSS RUL prediction reports performance on a single held-out evaluation set — typically either an internal validation split or the official C-MAPSS test set — comparatively few applied/industrial project reports explicitly examine the **gap between validation and test-set generalization** for classical ensemble models such as Random Forest and XGBoost, or explain how this gap should inform final model selection for deployment. This project addresses that gap directly: Sections 4.19–4.20 report both validation and test performance for all three models and show that the model with the best validation score (XGBoost) is not the model that generalizes best to unseen engines (SVR), a distinction with direct practical consequences for which model should actually be deployed.

## 4.9 NASA C-MAPSS Dataset

The models in this project were trained on the NASA Commercial Modular Aero-Propulsion System Simulation (C-MAPSS) dataset, developed by NASA's Prognostics Center of Excellence [1], [2]. Rather than collecting data from operational aircraft, NASA generated the dataset using high-fidelity turbofan engine simulation models capable of reproducing realistic engine degradation under controlled operating conditions, with each simulated engine gradually deteriorating until failure while sensor measurements are continuously recorded.

## 4.10 Dataset Description

The dataset comprises four independent subsets differing in operating-condition and fault-mode complexity:

**Table 4.1 — NASA C-MAPSS Dataset Subsets**

| Dataset | Operating Conditions | Fault Modes |
|---|---|---|
| FD001 | Single | Single |
| FD002 | Multiple | Single |
| FD003 | Single | Multiple |
| FD004 | Multiple | Multiple |

Each subset provides a training set of complete run-to-failure trajectories and a test set of engines truncated before failure, with separate ground-truth RUL values provided for test-set evaluation. Every record contains an engine ID, operational cycle number, three operational settings, and 21 sensor measurements. This project used the **FD001** subset (single operating condition, single fault mode) to demonstrate the methodology under manageable computational complexity.

*Figure 4.3: Structure of the NASA C-MAPSS dataset. [Insert dataset flow diagram]*

## 4.11 Exploratory Data Analysis

Exploratory Data Analysis (EDA) was performed prior to modelling to understand sensor behaviour, identify redundant or near-constant sensor channels, and examine RUL distributions and degradation trends across engines. This analysis confirmed that several sensor channels exhibited negligible variation throughout engine operation (and were therefore excluded during preprocessing), and that most sensors showed a clear, though noisy, degradation trend only in the final portion of each engine's operational life — motivating the RUL-capping strategy described in Section 4.12.

*Figure 4.4: Representative sensor trends across engine operating cycles. [Insert EDA plots]*

## 4.12 Data Preprocessing

The C-MAPSS dataset was imported using Pandas, with column names assigned for engine number, operational cycle, operational settings, and 21 sensor channels. As the dataset is simulation-generated, no missing values were observed. The RUL target for each training engine was computed by subtracting the current cycle from that engine's maximum recorded cycle.

To improve learning, RUL values were **capped at 130 cycles** — engines in their healthy operating phase exhibit minimal degradation despite very high true RUL, and training on uncapped values causes the model to expend capacity on this largely uninformative regime rather than the degradation phase that matters for maintenance decisions. Sensor values were then normalized using **Min–Max scaling** to a common [0, 1] range, preventing sensors with larger numerical magnitude from dominating model training, and sensor channels exhibiting near-constant values throughout operation were removed as uninformative.

## 4.13 Feature Engineering

Several temporal and statistical features were derived from the raw sensor channels to better capture degradation trends:

- **Sliding window (30 cycles):** groups consecutive cycles so models observe degradation trends rather than isolated readings.
- **Exponential Moving Average (EMA):** weights recent observations more heavily, reflecting that degradation accelerates near failure.
- **Rolling mean and rolling standard deviation:** smooth short-term fluctuations and quantify variability, with increasing variability often indicating instability.
- **Delta features:** first differences between consecutive readings, capturing the rate of change in sensor behaviour.

Each retained sensor thus produced multiple derived variables (raw value, EMA, rolling mean, rolling standard deviation, delta), meaningfully enriching the feature space available to the regression models.

*Figure 4.5: Feature engineering pipeline. [Insert workflow diagram]*

## 4.14 Model Selection

Three supervised regression algorithms were selected for implementation: **Random Forest Regression**, **XGBoost Regression**, and **Support Vector Regression (SVR)**. These were chosen over deep sequence models (e.g., LSTM) for this phase of the project because the engineered feature set (Section 4.13) already encodes temporal information explicitly, and classical ensemble/kernel methods offer competitive accuracy on the single-condition FD001 subset with substantially lower training-data and computational requirements — an appropriate trade-off given the internship's project timeline. Deep sequence models are identified as a direction for future work in Section 4.25.

## 4.15 Model Architecture

- **Random Forest** is an ensemble of decision trees trained on bootstrapped samples and random feature subsets, with predictions averaged across trees; it is robust to noise and provides feature-importance estimates.
- **XGBoost (Extreme Gradient Boosting)** builds trees sequentially, with each tree correcting the residual error of its predecessors, combined with gradient-based optimization and regularization to control overfitting.
- **Support Vector Regression** maps inputs into a higher-dimensional space via a kernel function — a **Radial Basis Function (RBF)** kernel was used here — to model nonlinear relationships, and is known to be effective on smaller, well-structured datasets, though computationally more expensive to train and tune.

## 4.16 Training Pipeline

The training pipeline proceeded as follows: (i) load and preprocess the FD001 training data (Section 4.12); (ii) generate engineered features (Section 4.13); (iii) split the training engines into a model-fitting subset and an internal validation subset; (iv) fit each of the three regression models on the training subset; (v) evaluate all three models on both the internal validation subset and the official, independent C-MAPSS FD001 test set; and (vi) select the final deployment model based on test-set (generalization) performance rather than validation-set performance alone, as justified in Section 4.20.

*Figure 4.6: Overall predictive maintenance training and evaluation pipeline. [Insert architecture diagram]*

## 4.17 Hyperparameter Selection

Random Forest was configured with an ensemble of decision trees using bootstrap sampling and random feature subsetting, with tree depth and minimum leaf size tuned to balance bias and variance. XGBoost was configured with a moderate number of shallow, sequentially boosted trees, using a learning rate and L2 regularization term tuned to limit overfitting on the training engines. SVR was configured with an RBF kernel, with the kernel bandwidth ($\gamma$) and regularization parameter ($C$) tuned via grid search on the validation subset. In all three cases, hyperparameters were selected to minimize validation RMSE, which — as discussed in Section 4.20 — was not itself a perfect proxy for test-set generalization, particularly for XGBoost.

## 4.18 Evaluation Metrics

Since RUL is a continuous target, this is a **regression problem**, and classification accuracy is not a meaningful metric. Models were instead evaluated using:

- **Root Mean Square Error (RMSE):**
$$\text{RMSE} = \sqrt{\frac{1}{N}\sum_{i=1}^{N}(\hat{y}_i - y_i)^2}$$
which penalizes large errors more heavily than small ones.

- **Mean Absolute Error (MAE):**
$$\text{MAE} = \frac{1}{N}\sum_{i=1}^{N}|\hat{y}_i - y_i|$$
which gives an easily interpretable average error in cycles.

- **Coefficient of Determination (R²):** measures the proportion of variance in RUL explained by the model, with values approaching 1 indicating a strong fit.

- **NASA PHM Scoring Function [1], [3]:** an asymmetric metric specifically designed for RUL prediction, penalizing late predictions more heavily than early ones, since overestimating remaining engine life is operationally more dangerous than underestimating it.

Each model was evaluated twice: once on an internal validation split held out from the training engines, and once on the **independent C-MAPSS test set** of engines the model had never seen during training.

## 4.19 Experimental Results

**Table 4.2 — Model Performance on the Internal Validation Split**

| Model | RMSE | MAE | R² | NASA Score |
|---|---|---|---|---|
| Random Forest | 10.28 | 7.37 | 0.9427 | 8551 |
| **XGBoost** | **7.70** | **5.40** | **0.9679** | **4019** |
| SVR (RBF) | 13.73 | 10.05 | 0.8979 | 15946 |

On the validation split, **XGBoost achieved the strongest performance across every metric**, explaining approximately 96.8% of the variance in RUL and achieving the lowest NASA score among the three models, on data drawn from the same engines seen during training.

*Figure 4.7: Validation-set comparison of RMSE, MAE, and R² across models. [Insert bar chart]*

**Table 4.3 — Model Performance on the Independent C-MAPSS Test Set**

| Model | RMSE | MAE | R² |
|---|---|---|---|
| Random Forest | 13.49 | 10.23 | 0.9026 |
| XGBoost | 13.03 | 10.00 | 0.9092 |
| **SVR (RBF)** | **12.76** | **9.81** | **0.9129** |

On unseen test engines, **SVR generalized best**, marginally outperforming XGBoost and Random Forest, despite ranking last on the validation split.

*Figure 4.8: Test-set comparison of RMSE, MAE, and R² across models. [Insert bar chart]*

## 4.20 Performance Analysis

All three models show a clear increase in error moving from validation to the independent test set, but the tree-based ensembles — XGBoost in particular — show the largest relative degradation, consistent with the model overfitting to patterns specific to the training engines. This validation–test gap is retained and analysed explicitly here rather than reporting only the more favourable validation numbers, for two reasons:

1. **Temporal correlation within sliding-window features.** Because windows are drawn from overlapping cycles within the same training engines, a random validation split can share near-duplicate windows with the training set, inflating validation performance for high-capacity models such as XGBoost that can more easily fit such local patterns.
2. **Engine-to-engine variability.** The C-MAPSS test engines are independent units with their own degradation trajectories; SVR's smoother, margin-based decision function appears less sensitive to the fine-grained, engine-specific patterns that boosted trees can overfit to, resulting in more stable generalization.

Because deployment requires reliable performance on genuinely unseen engines rather than on data resembling the training set, **Support Vector Regression (RBF kernel) was selected as the final deployment model**, on the basis of its test-set performance (RMSE = 12.76, MAE = 9.81, R² = 0.9129) rather than its validation-set ranking. XGBoost remains a strong candidate and is recommended in Section 4.25 as a direction for further tuning (e.g., stronger regularization, engine-grouped cross-validation) to close its generalization gap.

## 4.21 Deployment

The selected SVR model was deployed through an interactive dashboard built with the **Streamlit** framework, allowing engineers to upload engine sensor data and obtain RUL predictions without needing to interact with the underlying model directly. On upload, the dashboard automatically applies the same preprocessing and feature-engineering pipeline used during training before generating predictions.

## 4.22 Streamlit Application

The Streamlit dashboard presents supporting visualizations — RUL trend graphs, sensor trend analysis, and model comparison charts — to aid interpretation, and follows a modular design, with preprocessing, feature engineering, prediction, visualization, and logging maintained as independent Python modules to simplify future maintenance.

*Figure 4.9: Streamlit dashboard home screen. [Insert screenshot]*
*Figure 4.10: Remaining Useful Life prediction interface. [Insert screenshot]*

## 4.23 Industrial Applications

Beyond this demonstrator, the same methodology is directly applicable to real HAL sensor telemetry once available: engine parameters such as oil pressure, vibration, exhaust gas temperature, and compressor pressure ratio (Section 4.24) could replace the anonymized C-MAPSS sensor channels, enabling fleet-level RUL estimation to support maintenance scheduling, spare-parts inventory planning, and availability optimization for operational squadrons — the core value proposition of predictive maintenance in a defence aviation context.

## 4.24 Limitations

The C-MAPSS dataset represents simulated rather than operationally measured engine degradation; real HAL sensor data would introduce additional variability from environmental conditions, maintenance history, and manufacturing tolerances not present in the simulation. The current implementation also uses classical machine learning rather than sequence models such as LSTM, GRU, or Transformer architectures, which could capture long-term temporal dependencies more directly and may close the validation–test generalization gap observed for XGBoost. The system further operates on offline, batch-uploaded datasets rather than real-time streaming data, and would require integration with onboard health-monitoring systems for operational deployment.

The NASA C-MAPSS dataset also uses anonymized sensor identifiers rather than named physical parameters. In a future HAL deployment using real aircraft telemetry, the same pipeline would be retrained on named, physically interpretable channels — most notably **oil pressure** (lubrication and bearing health), **engine vibration** (mechanical imbalance and bearing wear), **exhaust gas temperature** (combustion and turbine health), and **compressor pressure ratio** (airflow and compressor efficiency) — which together span the lubrication, mechanical, combustion, and airflow dimensions of engine health.

## 4.25 Future Scope

Future work may extend the system through deep sequence models (LSTM, GRU, Transformer architectures) [13]–[15], engine-grouped cross-validation to obtain a validation estimate that better reflects test performance, Digital Twin integration for continuous synchronization with operational data, IoT-based real-time sensor streaming, and Explainable AI techniques (e.g., SHAP, LIME) to improve the interpretability of predictions for maintenance engineers.

*Figure 4.11: Future roadmap for AI-based predictive maintenance. [Insert diagram]*

## 4.26 Chapter Summary

This chapter presented the complete development of a machine-learning-based predictive maintenance system for aircraft turbofan engines using the NASA C-MAPSS dataset. Random Forest, XGBoost, and SVR were trained on engineered temporal features and evaluated on both a validation split and an independent test set; while XGBoost achieved the best validation metrics, SVR generalized more reliably to unseen engines and was selected for deployment through a Streamlit dashboard. The next chapter presents the Inward/Outward Document Management System (IODMS).

---

# CHAPTER 5 — INWARD/OUTWARD DOCUMENT MANAGEMENT SYSTEM (IODMS)

## 5.1 Introduction

Efficient document management is essential to administrative operations, accountability, and record-keeping in any organization, and particularly so within secure, air-gapped defence environments. This chapter presents the requirement analysis, design, implementation, and deployment of the **Inward/Outward Document Management System (IODMS)**, built with React, Material UI, FastAPI, and PostgreSQL, developed following a V-Model process, and deployed within an air-gapped, LAN-based environment using Docker.

## 5.2 Existing System

Prior to IODMS, inward and outward correspondence was managed largely through manual, paper-based registers: incoming letters and outgoing correspondence were logged by hand, physically routed between departments, and filed in physical registers. This existing process suffers from delayed processing, misplaced files, duplication of records, limited searchability, and minimal audit traceability — problems that scale poorly as organizational size and document volume grow.

## 5.3 Problem Statement

Conventional paper-based document handling introduces delays, manual errors, and limited traceability, which become increasingly problematic as organizational scale grows. Within secure environments such as defence establishments, internet connectivity may be restricted or entirely unavailable for security reasons, so document management software must operate reliably within an isolated local network. The objective of IODMS is to provide a centralized digital platform for recording, tracking, searching, and securely storing official documents throughout their lifecycle, restricted to authorized personnel according to defined access privileges.

## 5.4 Proposed System

IODMS proposes a centralized, web-based document management platform accessible only within the organization's internal Local Area Network. The system digitizes inward and outward document registration, provides role-based access to different categories of staff, maintains a complete audit trail of every document action, and supports efficient search and retrieval — while being deployable entirely offline via Docker containerization, without dependency on any internet-connected service.

## 5.5 Software Requirement Specification

The Software Requirement Specification (SRS) for IODMS was developed informally during the internship, structured along the lines of IEEE 830-style requirement categories [16]: overall system description, functional requirements (Section 5.6), non-functional requirements (Section 5.7), external interface requirements (the browser-based frontend, and the REST API between frontend and backend), and constraints (mandatory offline/air-gapped operability, and reliance only on containerizable, license-appropriate open-source components).

## 5.6 Functional Requirements

- **FR1:** The system shall allow authorized users to log in using a username and password.
- **FR2:** The system shall allow Officers to create inward document entries with associated metadata (title, sender, department, priority).
- **FR3:** The system shall allow Officers to create outward document entries and route them to a destination department.
- **FR4:** The system shall allow users to search and filter documents by identifier, department, date, and status.
- **FR5:** The system shall allow Administrators to create, modify, and deactivate user accounts and assign roles.
- **FR6:** The system shall record an audit log entry for every login, document creation, modification, and status change.
- **FR7:** The system shall allow Auditors to view (but not modify) all document records and audit logs.
- **FR8:** The system shall display the current processing status of any given document upon lookup.

## 5.7 Non-Functional Requirements

- **NFR1 (Security):** All access shall require authentication; access to functionality shall be restricted according to role-based permissions.
- **NFR2 (Availability):** The system shall operate entirely within the organization's LAN without dependency on external/internet connectivity.
- **NFR3 (Portability):** The complete application stack shall be deployable via Docker images transportable on removable storage media, without requiring internet-based package installation at the deployment site.
- **NFR4 (Maintainability):** The system shall be organized into independently deployable frontend, backend, and database components to simplify maintenance and future enhancement.
- **NFR5 (Auditability):** Every security-relevant action shall be logged with a timestamp and the acting user's identity, and audit logs shall not be editable through the application interface.
- **NFR6 (Performance):** Document search and retrieval operations shall complete within an interactively acceptable time for the expected document volume, supported by appropriate database indexing.

## 5.8 V-Model Development Process

IODMS was developed following a **V-Model** software development process [17], appropriate for a system with clearly specifiable requirements and a need for structured verification at each design stage — consistent with the document-driven engineering culture observed elsewhere in the organization (Chapter 2). On the descending (specification) arm, system requirements (Sections 5.6–5.7) were elaborated into high-level design (Section 5.9), then detailed module and database design (Sections 5.10–5.12). On the ascending (verification) arm, each specification stage has a corresponding test stage: unit testing verified individual backend and frontend modules against detailed design, integration testing verified module interactions against high-level design, and system/acceptance testing verified the deployed application against the original functional and non-functional requirements (Sections 5.19–5.20).

*Figure 5.1: V-Model development process applied to IODMS (Requirements ↔ Acceptance Testing; High-Level Design ↔ Integration Testing; Detailed/Module Design ↔ Unit Testing; Implementation at the base of the V). [Insert V-Model diagram]*

## 5.9 High-Level Design

At a high level, IODMS is structured into a browser-based frontend, a REST API backend, and a relational database, communicating over the organization's internal network. Users interact with the frontend to perform document operations; the frontend issues REST requests to the backend, which enforces authentication and authorization, applies business logic, and persists data to the database.

## 5.10 System Architecture

IODMS follows a **three-tier architecture**:

- **Presentation Layer** — the React/Material UI frontend, through which users log in, register inward documents, create outward correspondence, search records, and monitor status.
- **Application Layer** — the FastAPI backend, which validates authentication, verifies permissions, implements business logic, performs database operations, and returns structured JSON responses.
- **Database Layer** — PostgreSQL, storing user accounts, credentials, document metadata, history, folder structures, permissions, and audit logs.

Frontend and backend communicate via REST APIs, allowing independent development of each layer and improving maintainability and scalability.

*Figure 5.2: Three-tier software architecture of IODMS. [Insert layered diagram]*

## 5.11 Database Design

The PostgreSQL database stores user information, credentials, inward and outward document records, department information, categories, approval status, timestamps, and audit history, with relationships maintained through primary and foreign keys to ensure referential integrity. Each document receives a unique identifier for efficient lifecycle tracking, and database indexing supports rapid retrieval even as document volume grows. PostgreSQL was selected for its transaction support, ACID compliance, and enterprise-grade reliability, with backup and recovery mechanisms further reducing the risk of data loss.

*Figure 5.3: Entity-relationship diagram of the IODMS database. [Insert ER diagram]*

## 5.12 Module Design

The backend was organized into independent modules for authentication, user/role management, inward-document handling, outward-document handling, search/retrieval, and audit logging, each exposed through its own set of REST endpoints. This modular decomposition, consistent with FastAPI's router-based structuring, allowed each module to be developed, tested, and reasoned about largely independently, and simplified the mapping between functional requirements (Section 5.6) and implementation components.

## 5.13 Frontend Design

The frontend was developed using **ReactJS** with **Material UI** components, organized into a login/authentication view, a document-registration form (inward and outward), a searchable document listing/table view, a document detail/status view, and an administrative panel for user and role management (visible only to Administrator accounts). Responsive Material UI components were used throughout to maintain visual consistency and usability across different screen sizes.

## 5.14 Backend Design

The backend was implemented using **FastAPI**, chosen for its asynchronous request handling, automatic OpenAPI documentation generation, and strong request/response validation via Pydantic models. Each functional requirement (Section 5.6) was mapped to one or more REST endpoints, with request validation, permission checking, and database interaction handled through a layered structure (route handler → business logic → database access) to keep concerns separated and testable.

## 5.15 Authentication

Every user must authenticate with valid credentials verified by the FastAPI backend before accessing the application; invalid attempts are rejected immediately, and no functionality is reachable without an authenticated session, satisfying FR1 and NFR1.

## 5.16 Role-Based Access Control

Following authentication, **Role-Based Access Control (RBAC)** determines available operations, satisfying FR5–FR7. **Administrators** manage user accounts, monitor document movement, and configure system settings; **Officers** create inward entries, prepare outward correspondence, and forward files between departments; **Auditors** hold read-only privileges for inspection without modification rights. This implements the **principle of least privilege**, granting each user only the minimum access required for their role.

*Figure 5.4: Authentication and role-based access workflow. [Insert workflow diagram]*

## 5.17 Docker Deployment

Docker-based deployment — the author's primary area of contribution during this phase of the internship — packages the application and its dependencies into portable containers, eliminating compatibility issues arising from differing operating systems or library versions, and directly satisfies NFR3. Separate containers were created for the frontend, backend API, and PostgreSQL database, coordinated via Docker Compose through a single configuration file, providing simplified deployment, platform independence, consistent execution across environments, and reduced configuration errors.

*Figure 5.5: Docker container architecture for IODMS. [Insert architecture diagram]*

## 5.18 Air-Gapped Deployment

An air-gapped network is physically isolated from the public internet, preventing unauthorized external communication and significantly improving cybersecurity — a deployment model common in defence organizations, government agencies, and critical infrastructure, and directly required by NFR2. Since online package repositories and cloud services are unavailable in such environments, every dependency must be prepared and transferred in advance. The deployment procedure followed these steps:

1. Build Docker images on an internet-connected development system.
2. Export frontend, backend, and PostgreSQL images as TAR archives.
3. Transfer the images via secure removable storage.
4. Import the images on the offline server.
5. Initialize all containers using Docker Compose.
6. Seed the PostgreSQL database.
7. Configure LAN access for authorized users.

Once deployed, IODMS becomes accessible to authorized users across the organization's Local Area Network through standard web browsers, without requiring separate installations on individual machines, and since document processing occurs entirely within the internal network, confidential information never leaves the secure infrastructure.

*Figure 5.6: LAN-based, air-gapped deployment architecture. [Insert deployment diagram]*

## 5.19 Testing Methodology

Consistent with the V-Model process (Section 5.8), testing was carried out at three levels. **Unit testing** verified individual backend endpoints (e.g., login, document creation, search) and frontend components in isolation against their detailed design. **Integration testing** verified correct interaction between the frontend, backend, and database — for example, that a document created via the frontend was correctly persisted, indexed, and retrievable through search. **System/acceptance testing** verified the fully deployed, containerized, air-gapped application against the original functional and non-functional requirements (Sections 5.6–5.7), including verification that the system operated correctly with no internet connectivity available.

## 5.20 Test Cases

**Table 5.1 — Representative Test Cases**

| Test ID | Requirement | Test Description | Expected Result |
|---|---|---|---|
| TC-01 | FR1 | Log in with valid credentials | Session established; user redirected to dashboard |
| TC-02 | FR1 | Log in with invalid credentials | Login rejected with an error message |
| TC-03 | FR2 | Officer creates an inward document entry | Document saved with unique ID and "Pending" status |
| TC-04 | FR3 | Officer creates and routes an outward document | Document saved and routed to specified department |
| TC-05 | FR4 | Search for a document by department and date range | Matching documents returned within acceptable response time |
| TC-06 | FR5 | Administrator creates a new user with the Auditor role | User created; login succeeds with Auditor-level permissions only |
| TC-07 | FR6 | Any user performs a document status update | Corresponding audit log entry created with timestamp and user ID |
| TC-08 | FR7 | Auditor attempts to modify a document | Modification rejected; read-only access enforced |
| TC-09 | NFR2 | Application accessed with network cable to external internet disconnected | Application functions normally over LAN |
| TC-10 | NFR3 | Deploy exported Docker images on a clean offline server | All containers start successfully via Docker Compose without internet access |

## 5.21 Results

The IODMS application met its design objectives, replacing manual document handling with an efficient digital workflow, and all representative test cases in Section 5.20 passed during system/acceptance testing. The React frontend, styled with Material UI, provided an intuitive interface for login, document registration, search, and status tracking; the FastAPI backend handled authentication, permission validation, and database interaction with low latency owing to its asynchronous architecture; and the PostgreSQL database, with appropriate indexing, maintained consistent and efficiently retrievable records. Docker containerization and Compose-based orchestration simplified deployment across environments, and the system was successfully deployed and validated within a simulated air-gapped, LAN-based configuration.

**Table 5.2 — Summary of Project Outcomes**

| Objective | Status |
|---|---|
| React frontend development | Successfully implemented |
| FastAPI backend | Successfully implemented |
| PostgreSQL database | Successfully configured |
| User authentication | Successfully implemented |
| Role-based access control | Successfully implemented |
| Docker deployment | Successfully implemented |
| Air-gapped deployment | Successfully demonstrated |
| LAN accessibility | Successfully configured |

*Figure 5.7: Final IODMS system workflow. [Insert complete workflow diagram]*

## 5.22 Challenges

Configuring networking, environment variables, and service dependencies across multiple Docker containers required careful attention, particularly in understanding how Docker Compose establishes inter-container communication. Preparing for air-gapped deployment required advance planning of every software dependency, since online resolution was unavailable during deployment. Database initialization — creating the schema, running migrations, and seeding user data — required close coordination between backend and database containers, and LAN deployment required configuring network settings, firewall permissions, and server addressing for browser-based access across the organization.

## 5.23 Learning Outcomes

This project strengthened the author's understanding of full-stack architecture and the interaction between frontend, backend, database, and deployment layers; of REST API communication, authentication, and RBAC design; of structured, V-Model-based software development and requirement-traced testing; and, most significantly, of modern containerization concepts — packaging applications into portable, dependency-free execution environments — along with the broader practices of configuration management, debugging, and professional software documentation.

## 5.24 Future Scope

IODMS can be extended with electronic signatures, automated workflow/approval-chain management, OCR-based digitization of scanned paper correspondence, AI-assisted document classification and search, and richer reporting dashboards for document-flow analytics — while retaining its core air-gapped, LAN-based deployment model.

## 5.25 Chapter Summary

This chapter presented the requirement analysis, V-Model-based design, implementation, and secure air-gapped deployment of the IODMS application, along with its testing methodology and results. The next chapter consolidates and cross-compares the results of both technical projects undertaken during the internship.

---

# CHAPTER 6 — RESULTS AND TECHNICAL DISCUSSION

## 6.1 Introduction

This chapter consolidates the results of the two technical projects undertaken during the internship — the AI-based predictive maintenance system (Chapter 4) and the IODMS application (Chapter 5) — and discusses them jointly from an engineering and industrial perspective.

## 6.2 Predictive Maintenance Results

The predictive maintenance project's central technical result is not simply "which model performed best," but the demonstrated **divergence between validation and test-set performance**: XGBoost achieved the best validation metrics (RMSE = 7.70, R² = 0.9679) but degraded the most on the independent test set, while SVR — the weakest model on validation (RMSE = 13.73, R² = 0.8979) — generalized best to unseen engines (RMSE = 12.76, R² = 0.9129) and was selected for deployment on that basis. This result is summarized in Table 6.1.

**Table 6.1 — Validation vs. Test Performance Summary (RMSE)**

| Model | Validation RMSE | Test RMSE | Relative Increase |
|---|---|---|---|
| Random Forest | 10.28 | 13.49 | +31.2% |
| XGBoost | 7.70 | 13.03 | +69.2% |
| SVR (RBF) | 13.73 | 12.76 | −7.1% |

## 6.3 IODMS Results

IODMS met all functional and non-functional requirements defined in Sections 5.6–5.7, with all representative test cases (Table 5.1) passing during system/acceptance testing, and the application was successfully deployed and operated within a simulated air-gapped, LAN-based environment using Docker Compose (Table 5.2).

## 6.4 Comparative Analysis

Although the two projects address unrelated engineering problems, both illustrate a common lesson: **the metric that is easiest to optimize during development is not always the correct basis for a deployment decision.** In the predictive maintenance project, this took the form of validation RMSE versus true generalization (Section 6.2). In the IODMS project, the analogous discipline was enforced structurally through the V-Model, which requires every design decision to be traced back to an explicit requirement and verified against it (Sections 5.19–5.20), rather than validated only against developer-convenient criteria such as "the application runs on my machine."

## 6.5 Engineering Discussion

Both projects also reinforced the broader engineering culture observed in Chapter 2: rigorous evaluation against explicit, pre-defined criteria (RUL evaluation metrics; functional/non-functional requirements) rather than informal or convenience-based assessment. This mirrors, at a smaller scale, the role that Interface Control Documents and structured verification play in avionics communication engineering (Chapter 3) — in each case, the discipline of specifying evaluation criteria *before* building the system, and adhering to them even when the results are inconvenient (e.g., discarding the best-validation-score model), was the key factor separating a demonstrably reliable outcome from a merely plausible-looking one.

## 6.6 Industrial Significance

For HAL and similar organizations, the predictive maintenance methodology developed here — including its explicit generalization analysis — provides a template that could be applied directly to real engine telemetry once available, supporting maintenance scheduling and fleet availability planning (Section 4.23). The IODMS project demonstrates a deployable pattern for secure, air-gapped enterprise software more broadly applicable across HAL's administrative and engineering documentation needs, beyond inward/outward correspondence specifically.

## 6.7 Limitations

The predictive maintenance system's limitations (dataset genericism, absence of deep sequence models, offline-only operation) are detailed in Section 4.24; the IODMS project's scope was limited to the application and deployment layers rather than the underlying physical network infrastructure of the air-gapped environment (Section 1.8). Neither project was evaluated against live, operational HAL data, and both should be regarded as validated prototypes rather than production-certified systems.

## 6.8 Chapter Summary

This chapter consolidated the results of the predictive maintenance and IODMS projects, highlighting the shared engineering lesson of validating against explicit, pre-defined criteria rather than convenient proxies, and discussing the industrial significance and limitations of both projects. The next chapter reflects on the professional and industrial learning outcomes of the internship as a whole.

---

# CHAPTER 7 — INDUSTRIAL LEARNING AND PROFESSIONAL DEVELOPMENT

## 7.1 Technical Skills Acquired

The internship developed practical skills in applied machine learning (data preprocessing, feature engineering, model evaluation, and — critically — generalization analysis), full-stack web development (React, FastAPI, PostgreSQL), and containerized deployment (Docker, Docker Compose), alongside conceptual grounding in avionics communication standards (MIL-STD-1553B, ARINC 429) and engineering documentation practice (ICDs).

## 7.2 Software Engineering Practices

Exposure to the V-Model development process (Section 5.8) and to document-driven avionics engineering practice (Chapter 2, Chapter 3) reinforced the importance of traceability between requirements, design, and verification — a discipline distinct from, and complementary to, the more iterative development styles common in academic and early-stage commercial software projects.

## 7.3 Documentation Practices

Working within HAL's engineering environment highlighted the central role of structured, revision-controlled documentation (ICDs, SRS-style requirement specifications, test case tables) not as a bureaucratic overhead but as the mechanism by which large, multidisciplinary teams maintain a shared, unambiguous understanding of complex systems — a lesson directly reflected in the structure of this report.

## 7.4 Team Collaboration

Although individual project work formed the core of the internship, both projects required coordination with mentors and, for IODMS, with the broader development effort already underway — requiring clear communication of design decisions (e.g., the validation-versus-test model selection rationale) to technical stakeholders unfamiliar with the day-to-day implementation details.

## 7.5 Challenges Faced

Key challenges included reconciling conflicting validation and test-set results for the predictive maintenance models (Section 4.20) rather than simply reporting the more favourable numbers, and managing the practical complexities of Docker-based, air-gapped deployment (Section 5.22) — both of which required methodical, evidence-based problem-solving rather than immediate intuitive answers.

## 7.6 Lessons Learned

The internship's central lesson, recurring across both technical projects, is that **a good-looking result on the metric you optimized during development is not the same as a result that will hold up under deployment conditions** — whether that means a held-out test set of unseen engines or a fully offline, air-gapped production environment — and that explicitly checking for this gap, rather than assuming it away, is a core engineering responsibility.

## 7.7 Professional Growth

Beyond technical competence, the internship strengthened the author's analytical rigor, technical writing, and capacity to present engineering trade-offs (such as the model-selection decision in Chapter 4) transparently, including reporting results that complicate a simple narrative — a skill directly applicable to future technical roles in aerospace software engineering.

## 7.8 Chapter Summary

This chapter reflected on the professional and industrial learning outcomes of the internship, centred on the recurring lesson of validating engineering decisions against deployment-realistic criteria rather than development-convenient proxies. The final chapter presents the report's conclusions and recommendations for future work.

---

# CHAPTER 8 — CONCLUSION AND FUTURE WORK

## 8.1 Conclusion

The industrial internship at Hindustan Aeronautics Limited, Avionics Design Division, provided a valuable opportunity to bridge academic learning and industrial engineering practice, offering first-hand exposure to the engineering standards followed within one of India's leading aerospace and defence organizations. It combined a structured organizational and technical-fundamentals study (Chapters 2–3) with two applied engineering projects (Chapters 4–5), each carried through to an evaluated, deployed result.

## 8.2 Major Contributions

The internship's major contributions were: (i) a machine learning pipeline for turbofan engine RUL prediction that explicitly analyses and reports the gap between validation and test-set generalization, leading to a deployment decision (SVR) that differs from the naive best-validation-score choice (XGBoost); (ii) an interactive Streamlit dashboard for real-time RUL estimation; and (iii) direct contribution to the V-Model-based design, Docker containerization, and air-gapped LAN deployment of the IODMS application, verified against an explicit set of functional and non-functional requirements and test cases.

## 8.3 Recommendations

For the predictive maintenance system, it is recommended that any future extension use engine-grouped cross-validation (rather than a random split) to obtain validation estimates that more reliably predict test-set generalization, particularly before deploying high-capacity models such as XGBoost or deep sequence models. For IODMS, it is recommended that future development extend the existing V-Model artifacts (SRS, test cases) rather than treating them as one-time deliverables, so that traceability is preserved as the system evolves.

## 8.4 Future Work

Future work may include deeper study of avionics software development, embedded and real-time operating systems, and digital signal processing; extension of the predictive maintenance system through deep sequence models (LSTM, GRU, Transformer architectures), Digital Twin integration, IoT-based real-time sensor streaming, and Explainable AI methods; and extension of IODMS with electronic signatures, automated workflow management, OCR-based digitization, and AI-assisted document search and reporting.

## 8.5 Closing Remarks

Overall, this internship strengthened the author's technical foundation in aerospace software engineering, applied machine learning, and secure enterprise software deployment, and — perhaps most importantly — reinforced a habit of rigorous, evidence-based engineering judgment: evaluating systems against the conditions they will actually face in deployment, rather than the conditions under which they were most convenient to develop. This experience has strengthened the author's interest in pursuing further work in Artificial Intelligence, aerospace software engineering, and full-stack software development.

---

# REFERENCES

[1] A. Saxena, K. Goebel, D. Simon, and N. Eklund, "Damage propagation modeling for aircraft engine run-to-failure simulation," in *Proc. IEEE Int. Conf. Prognostics and Health Management (PHM)*, Denver, CO, USA, 2008.

[2] NASA Prognostics Center of Excellence, "Commercial Modular Aero-Propulsion System Simulation (C-MAPSS) dataset," NASA Ames Research Center, Moffett Field, CA, USA.

[3] A. Saxena and K. Goebel, "Turbofan engine degradation simulation data set," NASA Ames Prognostics Data Repository, 2008.

[4] I. Goodfellow, Y. Bengio, and A. Courville, *Deep Learning*. Cambridge, MA, USA: MIT Press, 2016.

[5] A. Géron, *Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow*, 2nd ed. Sebastopol, CA, USA: O'Reilly Media, 2019.

[6] FastAPI Documentation. [Online]. Available: https://fastapi.tiangolo.com

[7] React Documentation. [Online]. Available: https://react.dev

[8] PostgreSQL Documentation. [Online]. Available: https://www.postgresql.org/docs/

[9] Docker Documentation. [Online]. Available: https://docs.docker.com

[10] U.S. Department of Defense, *MIL-STD-1553B: Digital Time Division Command/Response Multiplex Data Bus*, 1978.

[11] Aeronautical Radio, Incorporated, *ARINC Specification 429: Mark 33 Digital Information Transfer System (DITS)*.

[12] F. O. Heimes, "Recurrent neural networks for remaining useful life estimation," in *Proc. IEEE Int. Conf. Prognostics and Health Management (PHM)*, Denver, CO, USA, 2008.

[13] G. S. Babu, P. Zhao, and X.-L. Li, "Deep convolutional neural network based regression approach for estimation of remaining useful life," in *Proc. Int. Conf. Database Systems for Advanced Applications (DASFAA)*, Dallas, TX, USA, 2016.

[14] S. Zheng, K. Ristovski, A. Farahat, and C. Gupta, "Long short-term memory network for remaining useful life estimation," in *Proc. IEEE Int. Conf. Prognostics and Health Management (ICPHM)*, Dallas, TX, USA, 2017.

[15] X. Li, Q. Ding, and J.-Q. Sun, "Remaining useful life estimation in prognostics using deep convolution neural networks," *Reliability Engineering & System Safety*, vol. 172, pp. 1–11, 2018.

[16] IEEE, *IEEE Recommended Practice for Software Requirements Specifications*, IEEE Std 830-1998.

[17] ISO/IEC/IEEE, *Systems and Software Engineering — Software Life Cycle Processes*, ISO/IEC/IEEE 12207:2017.

---

# APPENDIX A — Project Folder Structure

*(Directory layout of the predictive maintenance and IODMS codebases — to be inserted per final project archive structure.)*

# APPENDIX B — NASA Dataset Description

*(Extended field-level description of the C-MAPSS FD001 dataset: engine ID, cycle, operational settings 1–3, and sensor measurements 1–21, with units where applicable.)*

# APPENDIX C — IODMS Database Schema

*(Full table definitions: users, roles, inward_documents, outward_documents, departments, audit_logs, with column types and foreign-key relationships — to be inserted from the implemented schema.)*

# APPENDIX D — System Architecture Diagrams

*(Consolidated set of architecture diagrams referenced throughout Chapters 3–5 — ICD lifecycle, MIL-STD-1553B/ARINC 429 architectures, predictive maintenance pipeline, IODMS three-tier and Docker architectures.)*

# APPENDIX E — Additional Experimental Results

*(Extended per-engine RUL prediction plots, residual analysis, and feature-importance charts for the predictive maintenance models.)*

# APPENDIX F — Screenshots

*(Streamlit dashboard and IODMS user interface screenshots.)*

# APPENDIX G — Internship Certificate

*(Scanned copy of the internship completion certificate to be inserted here.)*

# APPENDIX H — Additional Documents

*(Any supplementary supporting documents, e.g., weekly progress logs, referenced but not reproduced in the main body of this report.)*
