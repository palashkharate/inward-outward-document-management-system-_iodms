---
title: "Avionics Design, Aerospace Software Engineering, and Predictive Maintenance Using Machine Learning"
subtitle: "Internship Report submitted in partial fulfilment of the requirements for the degree of Bachelor of Technology in Computer Engineering"
author: "Preksha Pethakar"
---

# HINDUSTAN AERONAUTICS LIMITED
### (A Government of India Enterprise)

## INTERNSHIP REPORT ON
**Avionics Design, Aerospace Software Engineering, and Predictive Maintenance Using Machine Learning**

Submitted in partial fulfilment of the requirements for the award of the degree of
**Bachelor of Technology in Computer Engineering**

**Submitted by:** Preksha Pethakar
Fr. C. Rodrigues Institute of Technology (FCRIT), Vashi, Navi Mumbai

**Internship Organization:** Hindustan Aeronautics Limited (HAL), Avionics Design Division
**Duration:** June 2026 – July 2026

---

## CERTIFICATE

This is to certify that **Ms. Preksha Pethakar**, a student of Bachelor of Technology in Computer Engineering at Fr. C. Rodrigues Institute of Technology (FCRIT), Vashi, has successfully completed her industrial internship at Hindustan Aeronautics Limited (HAL), Avionics Design Division, during the period June 2026 to July 2026.

During the internship, she was exposed to aerospace software engineering concepts, avionics communication protocols, Interface Control Documents (ICDs), simulation and acquisition software, and secure software development practices. She also completed a machine learning project titled *Predictive Maintenance for Aircraft Turbofan Engines Using Machine Learning*, based on the NASA C-MAPSS dataset, and contributed to the *Inward Outward Document Management System (IODMS)*, a secure document-handling application for an air-gapped environment.

The work presented in this report is based on her learning, observations, and technical projects completed during the internship. To the best of our knowledge, this report does not contain confidential or classified information belonging to Hindustan Aeronautics Limited.

Place: Hyderabad
Date: ______________

Industrial Guide (Signature) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Department Guide (Signature)

---

## ACKNOWLEDGEMENT

I express my sincere gratitude to Hindustan Aeronautics Limited (HAL), Avionics Design Division, for the opportunity to undergo industrial training at one of India's premier aerospace organizations. The internship provided valuable practical exposure to aerospace software engineering, avionics systems, and modern engineering practices in the defence aviation sector.

I sincerely thank my industrial mentors and engineers at HAL for their guidance and technical support, which enabled me to understand key concepts including Interface Control Documents (ICDs), MIL-STD-1553B, ARINC 429, avionics simulation software, and secure deployment practices. I am also grateful to the faculty of Fr. C. Rodrigues Institute of Technology (FCRIT), Vashi, for their continuous academic guidance, and to my family and friends for their constant encouragement throughout this internship.

---

## ABSTRACT

The aerospace industry demands exceptionally high standards of reliability, safety, and software quality, as modern aircraft rely on hundreds of interconnected electronic systems communicating under strict timing and fault-tolerance constraints. This report documents an industrial internship undertaken at the Avionics Design Division of Hindustan Aeronautics Limited (HAL), structured around three technical strands.

The first strand covers foundational aerospace software engineering concepts studied during the internship, including Interface Control Documents (ICDs), the MIL-STD-1553B and ARINC 429 communication protocols, the Qt application framework, and avionics simulation and signal-acquisition software.

The second strand presents the design and evaluation of a machine-learning-based predictive maintenance system for aircraft turbofan engines, using the NASA Commercial Modular Aero-Propulsion System Simulation (C-MAPSS) dataset to estimate Remaining Useful Life (RUL). Random Forest, XGBoost, and Support Vector Regression (SVR) models were trained on engineered temporal features and evaluated using RMSE, MAE, R², and the NASA PHM scoring function, with particular attention paid to the generalization gap between validation and held-out test performance — XGBoost achieved the strongest validation metrics, while SVR generalized more reliably to unseen test engines and was therefore selected for deployment through an interactive Streamlit dashboard.

The third strand describes the architecture and secure, air-gapped deployment of the Inward Outward Document Management System (IODMS), a full-stack application built with React, Material UI, FastAPI, and PostgreSQL, containerized using Docker and deployed within an isolated local area network with role-based access control.

Collectively, this internship provided an interdisciplinary exposure spanning aerospace communication standards, applied machine learning, and secure enterprise software deployment, strengthening the author's technical foundation for future work in avionics and aerospace software engineering.

**Index Terms** — Avionics, Interface Control Document, MIL-STD-1553B, ARINC 429, Predictive Maintenance, Remaining Useful Life, NASA C-MAPSS, Machine Learning, Docker, Air-Gapped Deployment.

---

# CHAPTER 1 — INTRODUCTION

## 1.1 Background

The aerospace industry is among the most technologically demanding engineering sectors in the world. Every aircraft integrates mechanical, electrical, electronic, and software systems that must operate together with exceptional accuracy and reliability. Unlike conventional software applications, aerospace systems operate in safety-critical environments where even a minor communication or software fault can significantly affect aircraft performance and operational safety. Consequently, aerospace software development follows rigorous engineering standards, systematic verification procedures, and internationally accepted communication protocols.

Modern aircraft increasingly rely on embedded systems, intelligent avionics, real-time communication networks, and advanced data processing. The integration of Artificial Intelligence (AI), Machine Learning (ML), the Internet of Things (IoT), and predictive analytics has further enhanced aircraft performance and maintenance planning, gradually transforming traditional maintenance practices into data-driven strategies capable of anticipating failures before they occur.

Hindustan Aeronautics Limited (HAL), India's premier aerospace and defence organization, has played a central role in adopting these practices, contributing towards the goal of self-reliance in defence manufacturing through continuous research and indigenous development. This internship at HAL's Avionics Design Division provided exposure to aerospace software engineering, avionics communication systems, machine learning applications, and secure software deployment, illustrating how computer engineering principles are applied within mission-critical aerospace environments.

## 1.2 About the Internship

The internship was carried out at the Avionics Design Division of HAL, which specializes in the design, development, testing, integration, and maintenance of avionics systems for military and civilian aircraft. It was structured in three phases.

The first phase focused on aerospace communication standards and documentation practices, including Interface Control Documents (ICDs), the MIL-STD-1553B and ARINC 429 protocols, the Qt framework, and simulation and acquisition software.

The second phase involved the implementation of a machine learning project, *Predictive Maintenance for Aircraft Turbofan Engines Using Machine Learning*, using the NASA C-MAPSS dataset to estimate Remaining Useful Life (RUL) through regression modelling, deployed via an interactive Streamlit dashboard.

The third phase involved studying and contributing to the Inward Outward Document Management System (IODMS), a secure document-management application built with React, Material UI, FastAPI, PostgreSQL, and Docker for operation within an air-gapped organizational environment.

## 1.3 Objectives of the Internship

The primary objective was to bridge academic knowledge and industrial engineering practice through exposure to aerospace software development and modern computer engineering technologies. Specific objectives included:

1. Understanding the organizational structure and engineering practices of HAL.
2. Studying the working principles of the MIL-STD-1553B and ARINC 429 avionics communication protocols.
3. Understanding the role of Interface Control Documents (ICDs) in aerospace software development.
4. Gaining conceptual knowledge of simulation software, acquisition software, the Qt framework, and signal mapping.
5. Developing a machine learning model to predict the Remaining Useful Life (RUL) of aircraft turbofan engines using the NASA C-MAPSS dataset.
6. Comparing Random Forest, XGBoost, and Support Vector Regression models using standard regression metrics, including an assessment of generalization from validation to test data.
7. Deploying the selected prediction model through a Streamlit dashboard for real-time engine health monitoring.
8. Understanding secure software deployment using Docker and Docker Compose within air-gapped environments.
9. Studying the architecture and workflow of an enterprise-level document management system.
10. Strengthening professional skills in technical documentation, analytical reasoning, and engineering problem-solving.

## 1.4 Scope of the Internship

The internship spanned theoretical learning, software development, machine learning implementation, and secure deployment practice. From the aerospace perspective, it covered standardized communication protocols, avionics architecture, and engineering documentation. From the computer engineering perspective, it involved implementing machine learning algorithms for predictive maintenance, full-stack web application development, and Docker-based secure deployment. Industrial software engineering practices such as modular programming, version control, and documentation standards were emphasized throughout, providing an interdisciplinary learning experience combining aerospace and computer engineering principles.

## 1.5 Organization of the Report

This report is organized into six chapters. **Chapter 2** presents an overview of Hindustan Aeronautics Limited, including its history, organizational structure, and major products. **Chapter 3** details the aerospace software engineering concepts studied during the internship: ICDs, MIL-STD-1553B, ARINC 429, the Qt framework, and simulation/acquisition software. **Chapter 4** describes the predictive maintenance project, including dataset analysis, feature engineering, model development, evaluation, and deployment. **Chapter 5** presents the design and implementation of the IODMS application, its architecture, security mechanisms, and air-gapped deployment. **Chapter 6** concludes the report with a summary of learning outcomes and recommendations for future work.

---

# CHAPTER 2 — HINDUSTAN AERONAUTICS LIMITED (HAL)

## 2.1 Introduction

Hindustan Aeronautics Limited (HAL) is India's premier aerospace and defence public sector undertaking, operating under the Ministry of Defence, Government of India. HAL has played a central role in strengthening the country's defence preparedness through the design, development, manufacturing, maintenance, and modernization of aircraft, helicopters, aero-engines, avionics systems, and related technologies. Over the decades, HAL has evolved from a licensed manufacturer into one of Asia's leading aerospace organizations, contributing towards the vision of *Atmanirbhar Bharat* by reducing dependence on foreign defence equipment.

HAL collaborates extensively with organizations such as the Defence Research and Development Organisation (DRDO), the Aeronautical Development Agency (ADA), the Indian Space Research Organisation (ISRO), Bharat Electronics Limited (BEL), and the Indian Armed Forces on strategic aerospace programmes. Beyond manufacturing, HAL undertakes aircraft upgrades, overhaul, repair, system integration, and lifecycle management, following stringent aerospace quality standards throughout.

*Figure 2.1: Hindustan Aeronautics Limited corporate logo. [Insert HAL logo]*

## 2.2 History and Evolution

HAL traces its origins to 1940, when Hindustan Aircraft Limited was established in Bengaluru by industrialist Walchand Hirachand, initially focused on aircraft manufacturing and maintenance. Following India's independence, the organization's infrastructure and research activities expanded steadily. In 1964, Hindustan Aircraft Limited merged with Aeronautics India Limited to form the present-day Hindustan Aeronautics Limited, enabling centralized development of aircraft, helicopters, engines, and avionics.

Over subsequent decades, HAL manufactured numerous aircraft under licensed production agreements while developing indigenous platforms, establishing specialized divisions for aircraft manufacturing, helicopter production, engine development, avionics design, and software engineering. HAL today operates multiple production divisions, research centres, and design bureaus across India, contributing to national security while expanding into international markets.

## 2.3 Vision, Mission, and Core Values

HAL's vision is to become a globally recognized aerospace organization through continuous technological innovation and indigenous capability development. Its mission emphasizes the design, development, manufacture, repair, and lifecycle support of aerospace products meeting defence and civil aviation requirements, with a focus on quality, safety, and reliability. HAL's core values — integrity, professionalism, innovation, teamwork, accountability, customer focus, safety, and commitment to national development — guide engineering decisions and organizational culture across all divisions.

## 2.4 Organizational Structure

HAL operates through multiple production divisions, research centres, design organizations, and maintenance facilities, each specializing in a specific aerospace domain. The Chairman and Managing Director (CMD) provides overall strategic leadership, supported by functional directors overseeing engineering, finance, production, human resources, R&D, quality assurance, and marketing; individual divisions are headed by Executive Directors or General Managers.

The Avionics Design Division, where this internship was conducted, is responsible for the development, integration, testing, and maintenance of avionics systems, collaborating closely with aircraft manufacturers, software developers, and system integration teams to ensure seamless communication between onboard aircraft systems.

*Figure 2.2: Organizational structure of Hindustan Aeronautics Limited. [Insert organizational chart]*

## 2.5 Major Products and Aerospace Programmes

HAL's most significant indigenous achievement is the **Light Combat Aircraft (LCA) Tejas**, India's first indigenously designed fourth-generation multirole fighter, incorporating advanced composite materials, digital fly-by-wire control, and glass-cockpit avionics. The **HTT-40** Basic Trainer Aircraft supports Indian Air Force pilot training, while the **Dornier Do-228** twin-turboprop aircraft serves passenger transport, maritime surveillance, and disaster-relief roles. In addition to indigenous platforms, HAL manufactures and upgrades internationally recognized aircraft, including the Sukhoi Su-30MKI, Jaguar, Hawk Advanced Jet Trainer, and MiG-series aircraft, under licensed production programmes — collectively strengthening India's aerospace manufacturing ecosystem.

*Figure 2.3: Major aircraft platforms manufactured by HAL (Tejas, HTT-40, Dornier Do-228, Su-30MKI, Hawk AJT). [Insert aircraft collage]*

---

# CHAPTER 3 — AEROSPACE COMMUNICATION SYSTEMS AND INTERFACE CONTROL DOCUMENTS

## 3.1 Introduction

Modern aircraft function as highly integrated systems in which flight control computers, navigation systems, mission computers, radar processors, engine monitoring units, and cockpit displays continuously exchange information within strict timing constraints. Any delay, corruption, or inconsistency in this communication can compromise flight safety. Consequently, standardized communication protocols and engineering documentation form the foundation of avionics software engineering. Unlike conventional computer networks, avionics communication systems prioritize reliability, fault tolerance, deterministic timing, and redundancy, so that equipment from different manufacturers can interoperate predictably.

## 3.2 Interface Control Document (ICD)

An Interface Control Document (ICD) is a formal engineering artifact that defines how two or more subsystems communicate, specifying every parameter required for unambiguous data exchange between independently developed hardware and software modules. Aircraft contain numerous Line Replaceable Units (LRUs) — mission computers, radar systems, flight control computers, navigation equipment, and sensor interfaces — developed by different teams, making standardized interface documentation essential.

An ICD typically specifies message identifiers, signal names, data formats, scaling factors, engineering units, transmission frequency, timing requirements, source/destination equipment, communication protocol, error-detection methods, and revision history, giving software developers, hardware engineers, and test teams a shared, unambiguous understanding of every interface.

*Figure 3.1: Typical structure of an Interface Control Document. [Insert ICD structure diagram]*

## 3.3 Components of an ICD

- **Interface Identification** — communicating equipment, subsystem names, interface description, and revision details.
- **Signal Definition** — parameter names, engineering units, operating ranges, scaling equations, and data interpretation.
- **Communication Parameters** — message frequency, transmission interval, bus speed, synchronization, bus addresses, and message priority.
- **Data Format** — bit allocation, word size, byte order, numerical representation, and checksum calculation.
- **Error Handling** — fault detection, timeout conditions, retry mechanisms, and redundancy management.
- **Revision History** — version-controlled record of all interface modifications.

## 3.4 ICD Development Process

ICD development begins with system requirements analysis, identifying the information that must be exchanged between subsystems. Engineers then define interface specifications — message structures, protocols, transmission intervals, engineering units, and error-detection procedures — followed by multiple technical review cycles involving software, hardware, integration, and quality-assurance teams. Once approved, developers implement interfaces per the ICD, and simulation and acquisition tools verify message transmission accuracy before deployment. Because design and hardware modifications require interface revisions throughout an aircraft's service life, the ICD remains a living, version-controlled document.

*Figure 3.2: ICD development lifecycle (Requirements → Design → Documentation → Review → Implementation → Testing → Maintenance). [Insert flow diagram]*

## 3.5 Importance of Interface Control Documents

ICDs establish a common technical language among software developers, hardware engineers, and maintenance teams, eliminating ambiguity and reducing implementation errors. They simplify software verification, since test engineers can develop automated validation procedures directly from documented interface specifications, and support long-term maintainability, since military aircraft often remain operational for decades and require compatibility between legacy and newly developed avionics.

**Table 3.1 — Advantages of Interface Control Documents**

| Aspect | Benefit |
|---|---|
| Standardization | Uniform communication between subsystems |
| Integration | Simplifies hardware and software integration |
| Documentation | Complete interface specification |
| Testing | Supports verification and validation |
| Maintenance | Facilitates upgrades and troubleshooting |
| Configuration Management | Maintains version control |
| Reliability | Reduces communication failures |
| Safety | Improves operational dependability |

## 3.6 MIL-STD-1553B Communication Protocol

MIL-STD-1553B is one of the most widely adopted military communication standards, used in aircraft, helicopters, missiles, and naval and space systems. Developed by the U.S. Department of Defense, it establishes a reliable, fault-tolerant, deterministic communication network for mission-critical aerospace systems, and remains in wide use despite the emergence of higher-speed data buses.

The protocol uses a **command–response architecture**, centrally controlled by a Bus Controller (BC), which prevents communication conflicts and ensures deterministic message transmission. The bus consists of a dual-redundant twisted shielded-pair cable operating at 1 Mbps, with two physically separate channels (Bus A and Bus B) providing redundancy — if the active bus fails, transmission switches automatically to the standby bus. The protocol supports up to 31 Remote Terminals per Bus Controller, with an optional Bus Monitor used for testing, debugging, and verification.

*Figure 3.3: MIL-STD-1553B bus architecture. [Insert architecture diagram]*

### 3.6.1 Components

- **Bus Controller (BC)** — the master controller; initiates every transaction, sequences message transmission, and manages timing.
- **Remote Terminal (RT)** — an avionics subsystem (e.g., flight control computer, radar processor) with a unique bus address; responds only when commanded.
- **Bus Monitor (BM)** — passively observes bus traffic for testing, simulation, and fault diagnosis without transmitting.

### 3.6.2 Word Formats

Communication occurs through standardized 20-bit words, comprising 16 information bits plus synchronization and parity bits:

- **Command Word** — issued by the BC; specifies RT address, transmit/receive mode, sub-address, and word count.
- **Data Word** — carries the actual engineering information (e.g., engine parameters, navigation data).
- **Status Word** — returned by the RT after each transaction, indicating success or reporting faults such as parity or busy conditions.

*Figure 3.4: Command Word, Data Word, and Status Word formats. [Insert word-format diagram]*

### 3.6.3 Communication Sequence and Fault Tolerance

Communication follows a deterministic command–response sequence: the BC transmits a Command Word to a specific RT, the RT responds with Data Word(s) as required, and finally returns a Status Word confirming completion. Only one device transmits at any instant, eliminating collisions. Reliability is reinforced by an odd parity bit on every word, Manchester II bi-phase encoding for noise immunity, and dual-redundant buses that switch automatically on channel failure — together making MIL-STD-1553B one of the most dependable communication standards in defence aviation.

*Figure 3.5: Communication sequence in MIL-STD-1553B (BC → Command Word → RT → Data Word → Status Word). [Insert sequence diagram]*

## 3.7 ARINC 429 Communication Protocol

ARINC 429, developed by Aeronautical Radio Incorporated, is the most widely used communication standard in commercial aviation. Unlike MIL-STD-1553B, ARINC 429 uses a **simplex architecture**: one transmitter continuously broadcasts to one or more receivers, eliminating message collisions by design. It supports transmission speeds of 12.5 kbps (low speed) and 100 kbps (high speed), sufficient for the deterministic, moderate-bandwidth communication needs of commercial avionics subsystems such as Flight Management Computers, Air Data Computers, and TCAS.

*Figure 3.6: ARINC 429 communication architecture. [Insert bus architecture diagram]*

### 3.7.1 Word Structure

Each ARINC 429 transmission is a fixed 32-bit word:

| Bits | Field | Description |
|---|---|---|
| 1–8 | Label | Identifies the transmitted parameter (octal notation) |
| 9–10 | SDI | Source/Destination Identifier |
| 11–29 | Data Field | Engineering value (BNR, BCD, or discrete) |
| 30–31 | SSM | Sign/Status Matrix — validity of the data |
| 32 | Parity | Odd parity bit for error detection |

Receiving equipment compares an incoming Label against its predefined list and decodes only matching messages; unrelated labels are ignored. The protocol uses Bipolar Return-to-Zero (BPRZ) encoding with differential signalling, providing strong immunity to electromagnetic interference.

*Figure 3.7: Standard 32-bit ARINC 429 word format. [Insert word-structure diagram]*

### 3.7.2 Advantages and Applications

Because each channel has only one transmitter, ARINC 429 eliminates communication conflicts by design while remaining simple to implement and highly noise-resistant. It has been deployed extensively by Airbus, Boeing, Bombardier, Embraer, and Dassault Aviation for flight management, navigation, weather radar, and engine-monitoring systems. Although newer high-speed buses such as AFDX/ARINC 664 are increasingly adopted, ARINC 429 remains widely used owing to its maturity and proven reliability.

## 3.8 Comparison: MIL-STD-1553B vs. ARINC 429

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

*Figure 3.8: Comparative architecture of MIL-STD-1553B and ARINC 429. [Insert comparison diagram]*

MIL-STD-1553B prioritizes deterministic, centrally controlled, redundant communication suited to complex military mission systems, whereas ARINC 429 prioritizes simplicity and ease of maintenance for commercial avionics. Both protocols demonstrate that reliability in aerospace communication is achieved through different but equally rigorous engineering philosophies.

## 3.9 Qt Framework in Aerospace Software Development

The **Qt framework**, a cross-platform C++ application development framework, is widely used in aerospace software for graphical user interfaces, embedded software, and simulation tools. Qt supports object-oriented and event-driven programming, multithreading, networking, and hardware communication, making it well suited to reliability- and maintainability-critical aerospace applications. Its **signal–slot mechanism** allows independent software modules to exchange events without tight coupling, simplifying architecture and improving scalability. In aerospace contexts, Qt is commonly used for cockpit display software, mission planning tools, engineering simulation, and ground support equipment.

*Figure 3.9: Qt framework signal–slot architecture. [Insert framework diagram]*

## 3.10 Simulation and Acquisition Software

**Simulation software** allows engineers to validate avionics software behaviour under normal and abnormal operating scenarios — engine startup, communication failures, sensor malfunctions — without the cost and risk of testing on operational aircraft. A key application is **Hardware-in-the-Loop (HIL) testing**, in which real hardware components interact with virtual aircraft models before integration, reducing both testing cost and defect-discovery time.

**Acquisition software** complements simulation by collecting, monitoring, and analysing live communication traffic during testing, verifying that every subsystem communicates according to its ICD. It supports replay of recorded sessions for repeatable debugging and protocol-compliance monitoring — detecting missing messages, incorrect addressing, parity errors, and timing violations.

*Figure 3.10: Signal acquisition and monitoring workflow. [Insert monitoring diagram]*

## 3.11 Signal Mapping

Signal mapping establishes the correspondence between physical sensor signals (pressure, temperature, altitude, engine speed) and the software parameters used by avionics applications, specifying engineering units, scaling equations, data types, and update frequency in accordance with the relevant ICD. Accurate signal mapping is critical, since misinterpretation can result in incorrect cockpit displays or flight-control behaviour; it also simplifies maintenance, as new sensors can be integrated by updating mapping configurations rather than redesigning software.

## 3.12 Chapter Summary

This chapter presented the aerospace software engineering foundations studied during the internship — Interface Control Documents, the MIL-STD-1553B and ARINC 429 protocols, the Qt framework, and simulation/acquisition software — establishing the standardized, verification-driven engineering discipline that underlies avionics software development. The next chapter presents the machine learning project on predictive maintenance of aircraft turbofan engines.

---

# CHAPTER 4 — PREDICTIVE MAINTENANCE FOR AIRCRAFT TURBOFAN ENGINES USING MACHINE LEARNING

## 4.1 Introduction

Aircraft engine performance directly influences flight safety, operational efficiency, and maintenance cost. Traditional strategies rely on **corrective maintenance** (repair after failure) or **preventive maintenance** (replacement at fixed intervals), the latter often causing unnecessary replacement of healthy components. Advances in AI, ML, IIoT, and sensor technology have enabled **predictive maintenance**, which uses historical operational data to estimate component health and predict Remaining Useful Life (RUL) before failure, allowing maintenance to be scheduled only when necessary.

This chapter presents a machine-learning-based predictive maintenance system developed during the internship, using the NASA C-MAPSS dataset to estimate turbofan engine RUL. The pipeline spans data preprocessing, feature engineering, regression model development, evaluation, and deployment via an interactive Streamlit dashboard.

## 4.2 Predictive Maintenance and Remaining Useful Life

Predictive maintenance continuously analyses sensor data — temperature, pressure, vibration, fuel flow, rotational speed, exhaust gas temperature — to identify degradation patterns not easily observed through conventional inspection, estimating RUL and scheduling maintenance accordingly. This reduces unscheduled downtime, improves fleet availability, and lowers maintenance cost relative to fixed-interval preventive maintenance.

**Remaining Useful Life (RUL)** is the number of operational cycles remaining before failure:

$$\text{RUL} = \text{Failure Cycle} - \text{Current Operating Cycle}$$

For example, an engine expected to fail after 250 cycles that has completed 180 cycles has an RUL of 70 cycles. Because engine degradation is nonlinear and influenced by numerous operating conditions, RUL estimation is treated as a supervised regression problem, with RUL as the target variable.

*Figure 4.1: Evolution of maintenance strategies — reactive, preventive, predictive. [Insert diagram]*

## 4.3 NASA C-MAPSS Dataset

The models were trained on the NASA Commercial Modular Aero-Propulsion System Simulation (C-MAPSS) dataset, developed by NASA's Prognostics Center of Excellence and widely used as a benchmark for RUL estimation research [1], [2]. The dataset comprises high-fidelity simulations of turbofan engines degrading under controlled operating conditions until failure, across four subsets differing in operating-condition and fault-mode complexity:

**Table 4.1 — NASA C-MAPSS Dataset Subsets**

| Dataset | Operating Conditions | Fault Modes |
|---|---|---|
| FD001 | Single | Single |
| FD002 | Multiple | Single |
| FD003 | Single | Multiple |
| FD004 | Multiple | Multiple |

Each subset provides a training set of complete run-to-failure trajectories and a test set of engines truncated before failure, with separate ground-truth RUL values for evaluation. Every record contains an engine ID, operational cycle number, three operational settings, and 21 sensor measurements. This project used the **FD001** subset (single operating condition, single fault mode) to demonstrate the methodology under manageable computational complexity.

*Figure 4.2: Structure of the NASA C-MAPSS dataset. [Insert dataset flow diagram]*

## 4.4 Project Workflow

The project workflow proceeded from dataset acquisition through deployment: exploratory data analysis (EDA) to examine sensor behaviour and RUL distributions; preprocessing (cleaning, normalization, sensor selection, RUL generation); feature engineering (temporal and statistical features); training of three regression models; evaluation on both a validation split and the independent C-MAPSS test set; and deployment of the best-generalizing model via Streamlit.

*Figure 4.3: Overall predictive maintenance workflow (Data → Preprocessing → Feature Engineering → Model Training → Evaluation → Deployment). [Insert architecture diagram]*

## 4.5 Data Preprocessing

The C-MAPSS dataset was imported using Pandas, with column names assigned for engine number, operational cycle, operational settings, and 21 sensor channels. As the dataset is simulation-generated, no missing values were observed. The RUL target for each training engine was computed by subtracting the current cycle from that engine's maximum recorded cycle.

To improve learning, RUL values were **capped at 130 cycles** — engines in their healthy operating phase exhibit minimal degradation despite very high true RUL, and training on uncapped values causes the model to expend capacity on this largely uninformative regime rather than the degradation phase that matters for maintenance decisions. Sensor values were then normalized using **Min–Max scaling** to a common [0, 1] range, preventing sensors with larger numerical magnitude from dominating model training, and sensor channels exhibiting near-constant values throughout operation were removed as uninformative.

## 4.6 Feature Engineering

Several temporal and statistical features were derived from the raw sensor channels to better capture degradation trends:

- **Sliding window (30 cycles):** groups consecutive cycles so models observe degradation trends rather than isolated readings.
- **Exponential Moving Average (EMA):** weights recent observations more heavily, reflecting that degradation accelerates near failure.
- **Rolling mean and rolling standard deviation:** smooth short-term fluctuations and quantify variability, with increasing variability often indicating instability.
- **Delta features:** first differences between consecutive readings, capturing the rate of change in sensor behaviour.

Each retained sensor thus produced multiple derived variables (raw value, EMA, rolling mean, rolling standard deviation, delta), meaningfully enriching the feature space available to the regression models.

*Figure 4.4: Feature engineering pipeline. [Insert workflow diagram]*

## 4.7 Machine Learning Models

Three supervised regression algorithms were implemented: **Random Forest Regression**, **XGBoost Regression**, and **Support Vector Regression (SVR)** with a Radial Basis Function (RBF) kernel — selected for their established ability to model nonlinear degradation behaviour.

- **Random Forest** is an ensemble of decision trees trained on bootstrapped samples and random feature subsets, with predictions averaged across trees; it is robust to noise and provides feature-importance estimates.
- **XGBoost (Extreme Gradient Boosting)** builds trees sequentially, with each tree correcting the residual error of its predecessors, combined with gradient-based optimization and regularization to control overfitting.
- **Support Vector Regression** maps inputs into a higher-dimensional space via a kernel function (RBF, here) to model nonlinear relationships, and is known to be effective on smaller, well-structured datasets, though computationally more expensive to train and tune.

## 4.8 Model Evaluation Methodology

Since RUL is a continuous target, this is a **regression problem**, and classification accuracy is not a meaningful metric. Models were instead evaluated using:

- **Root Mean Square Error (RMSE):**
$$\text{RMSE} = \sqrt{\frac{1}{N}\sum_{i=1}^{N}(\hat{y}_i - y_i)^2}$$
which penalizes large errors more heavily than small ones.

- **Mean Absolute Error (MAE):**
$$\text{MAE} = \frac{1}{N}\sum_{i=1}^{N}|\hat{y}_i - y_i|$$
which gives an easily interpretable average error in cycles.

- **Coefficient of Determination (R²):** measures the proportion of variance in RUL explained by the model, with values approaching 1 indicating a strong fit.

- **NASA PHM Scoring Function [3]:** an asymmetric metric specifically designed for RUL prediction, penalizing late predictions more heavily than early ones, since overestimating remaining engine life is operationally more dangerous than underestimating it.

Each model was evaluated twice: once on an internal validation split held out from the training engines, and once on the **independent C-MAPSS test set** of engines the model had never seen during training. This distinction is deliberate and reported explicitly in Section 4.10, since a model that performs well only on validation data but fails to generalize to the test set would be unsuitable for deployment.

## 4.9 Validation Performance

**Table 4.2 — Model Performance on the Validation Split**

| Model | RMSE | MAE | R² | NASA Score |
|---|---|---|---|---|
| Random Forest | 10.28 | 7.37 | 0.9427 | 8551 |
| **XGBoost** | **7.70** | **5.40** | **0.9679** | **4019** |
| SVR (RBF) | 13.73 | 10.05 | 0.8979 | 15946 |

On the validation split, **XGBoost achieved the strongest performance across every metric**, explaining approximately 96.8% of the variance in RUL and achieving the lowest NASA score, indicating the best-calibrated predictions among the three models on data drawn from the same engines seen during training.

*Figure 4.5: Validation-set comparison of RMSE, MAE, and R² across models. [Insert bar chart]*

## 4.10 Test-Set (Generalization) Performance

Evaluating the same three trained models on the **independent C-MAPSS test set** — engines entirely unseen during training — produced a markedly different ranking:

**Table 4.3 — Model Performance on the Independent Test Set**

| Model | RMSE | MAE | R² |
|---|---|---|---|
| Random Forest | 13.49 | 10.23 | 0.9026 |
| XGBoost | 13.03 | 10.00 | 0.9092 |
| **SVR (RBF)** | **12.76** | **9.81** | **0.9129** |

On unseen test engines, **SVR generalized best**, marginally outperforming XGBoost and Random Forest despite having ranked last on the validation split. All three models show a clear increase in error relative to validation, but the tree-based ensembles — XGBoost in particular — show the largest relative degradation, which is consistent with mild overfitting to patterns specific to the training engines' sliding-window sequences.

*Figure 4.6: Test-set comparison of RMSE, MAE, and R² across models. [Insert bar chart]*

### 4.10.1 Interpretation of the Validation–Test Gap

This gap between validation and test performance is a common and instructive finding in C-MAPSS-based RUL studies, and is retained here deliberately rather than reporting only the more favourable validation numbers. Two factors likely contribute:

1. **Temporal correlation within the sliding-window features.** Because windows are drawn from overlapping cycles within the same training engines, a random validation split can share near-duplicate windows with the training set, inflating validation performance for high-capacity models such as XGBoost that can more easily fit such local patterns.
2. **Engine-to-engine variability.** The C-MAPSS test engines are independent units with their own degradation trajectories; SVR's smoother, margin-based decision function appears less sensitive to the fine-grained, engine-specific patterns that boosted trees can overfit to, resulting in more stable generalization.

## 4.11 Final Model Selection

Because deployment requires reliable performance on genuinely unseen engines rather than on data resembling the training set, **Support Vector Regression (RBF kernel) was selected as the final deployment model**, on the basis of its test-set performance (RMSE = 12.76, MAE = 9.81, R² = 0.9129) rather than its validation-set ranking. XGBoost remains a strong candidate and is recommended in Section 4.13 as a direction for further tuning (e.g., stronger regularization, engine-grouped cross-validation) to close its generalization gap, as its validation ceiling suggests it has not yet reached its full potential.

## 4.12 Streamlit Dashboard Deployment

The selected SVR model was deployed through an interactive dashboard built with the **Streamlit** framework, allowing engineers to upload engine sensor data and obtain RUL predictions without needing to interact with the underlying model directly. On upload, the dashboard automatically applies the same preprocessing and feature-engineering pipeline used during training before generating predictions, and presents supporting visualizations — RUL trend graphs, sensor trend analysis, and model comparison charts — to aid interpretation. The application follows a modular design, with preprocessing, feature engineering, prediction, visualization, and logging maintained as independent Python modules to simplify future maintenance.

*Figure 4.7: Streamlit dashboard home screen. [Insert screenshot]*
*Figure 4.8: Remaining Useful Life prediction interface. [Insert screenshot]*

## 4.13 Limitations and Future Scope

The C-MAPSS dataset represents simulated rather than operationally measured engine degradation; real HAL sensor data would introduce additional variability from environmental conditions, maintenance history, and manufacturing tolerances not present in the simulation. The current implementation also uses classical machine learning rather than sequence models such as LSTM, GRU, or Transformer architectures, which could capture long-term temporal dependencies more directly and may close the validation–test generalization gap observed for XGBoost. The system further operates on offline, batch-uploaded datasets rather than real-time streaming data, and would require integration with onboard health-monitoring systems for operational deployment.

Future work may extend the system through deep sequence models, engine-grouped cross-validation to obtain a validation estimate that better reflects test performance, Digital Twin integration for continuous synchronization with operational data, IoT-based real-time sensor streaming, and Explainable AI techniques (e.g., SHAP, LIME) to improve the interpretability of predictions for maintenance engineers.

**A note on dataset genericism.** The NASA C-MAPSS dataset uses anonymized sensor identifiers rather than named physical parameters. In a future HAL deployment using real aircraft telemetry, the same pipeline would be retrained on named, physically interpretable channels — most notably **oil pressure** (lubrication and bearing health), **engine vibration** (mechanical imbalance and bearing wear), **exhaust gas temperature** (combustion and turbine health), and **compressor pressure ratio** (airflow and compressor efficiency) — which together span the lubrication, mechanical, combustion, and airflow dimensions of engine health and would form a natural basis for a HAL-specific sensor set.

*Figure 4.9: Future roadmap for AI-based predictive maintenance. [Insert diagram]*

## 4.14 Chapter Summary

This chapter presented the complete development of a machine-learning-based predictive maintenance system for aircraft turbofan engines using the NASA C-MAPSS dataset. Random Forest, XGBoost, and SVR were trained on engineered temporal features and evaluated on both a validation split and an independent test set; while XGBoost achieved the best validation metrics, SVR generalized more reliably to unseen engines and was selected for deployment through a Streamlit dashboard. The next chapter presents the Inward Outward Document Management System (IODMS).

---

# CHAPTER 5 — INWARD OUTWARD DOCUMENT MANAGEMENT SYSTEM (IODMS)

## 5.1 Introduction

Efficient document management is essential to administrative operations, accountability, and record-keeping in any organization. Government and defence establishments process large volumes of correspondence, technical reports, approvals, and official records daily; traditional paper-based systems, while simple, suffer from delayed processing, misplaced files, and limited traceability. Digital Document Management Systems address these limitations by automating document movement and recording every action for accountability and audit.

During the internship, the author studied the architecture and deployment of the **Inward Outward Document Management System (IODMS)**, designed to operate within a secure, air-gapped organizational environment with no internet connectivity. The system was built using **React**, **Material UI**, **FastAPI**, **PostgreSQL**, and **Docker/Docker Compose**, with particular emphasis on secure deployment, offline installation, LAN accessibility, and role-based authentication.

## 5.2 Problem Statement

Conventional paper-based document handling introduces delays, manual errors, and limited traceability, which become increasingly problematic as organizational scale grows. Within secure environments such as defence establishments, internet connectivity may be restricted or entirely unavailable for security reasons, so document management software must operate reliably within an isolated local network. The objective of IODMS is to provide a centralized digital platform for recording, tracking, searching, and securely storing official documents throughout their lifecycle, restricted to authorized personnel according to defined access privileges.

## 5.3 Objectives

- Digitize inward and outward document management, eliminating dependency on manual paper registers.
- Provide centralized storage for official documents with efficient search and retrieval.
- Implement secure authentication and role-based access control.
- Maintain complete audit trails of document movement.
- Enable secure deployment within air-gapped organizational networks.
- Reduce document processing time and improve organizational efficiency through automation.

## 5.4 Technology Stack

**Table 5.1 — IODMS Technology Stack**

| Component | Technology |
|---|---|
| Frontend | ReactJS |
| UI Framework | Material UI |
| Backend | FastAPI |
| Database | PostgreSQL |
| Containerization | Docker |
| Deployment | Docker Compose |
| Programming Language | Python |
| API Communication | REST |

The **React** frontend provides reusable components and efficient state management for the interactive interface; **Material UI** supplies professionally designed, Material-Design-compliant components for visual consistency; **FastAPI** provides a high-performance, asynchronous Python backend with automatic API documentation; **PostgreSQL** offers a reliable, ACID-compliant relational store for user, document, and audit data; and **Docker/Docker Compose** package the full stack into portable, consistently reproducible containers.

*Figure 5.1: Overall software architecture of IODMS. [Insert architecture diagram]*

## 5.5 System Architecture

IODMS follows a **three-tier architecture**:

- **Presentation Layer** — the React/Material UI frontend, through which users log in, register inward documents, create outward correspondence, search records, and monitor status.
- **Application Layer** — the FastAPI backend, which validates authentication, verifies permissions, implements business logic, performs database operations, and returns structured JSON responses.
- **Database Layer** — PostgreSQL, storing user accounts, credentials, document metadata, history, folder structures, permissions, and audit logs.

Frontend and backend communicate via REST APIs, allowing independent development of each layer and improving maintainability and scalability.

*Figure 5.2: Three-tier software architecture of IODMS. [Insert layered diagram]*

## 5.6 Authentication and Role-Based Access Control

Since IODMS is deployed within an air-gapped, security-sensitive environment, protecting documents from unauthorized access was a primary design consideration. Every user must authenticate with valid credentials verified by the FastAPI backend before accessing the application; invalid attempts are rejected immediately.

Following authentication, **Role-Based Access Control (RBAC)** determines available operations. **Administrators** manage user accounts, monitor document movement, and configure system settings; **Officers** create inward entries, prepare outward correspondence, and forward files between departments; **Auditors** hold read-only privileges for inspection without modification rights. This implements the **principle of least privilege**, granting each user only the minimum access required for their role, and every authentication event, modification, and administrative action is logged for traceability.

*Figure 5.3: Authentication and role-based access workflow. [Insert workflow diagram]*

## 5.7 Database Design

The PostgreSQL database stores user information, credentials, inward and outward document records, department information, categories, approval status, timestamps, and audit history, with relationships maintained through primary and foreign keys to ensure referential integrity. Each document receives a unique identifier for efficient lifecycle tracking, and database indexing supports rapid retrieval even as document volume grows. PostgreSQL was selected for its transaction support, ACID compliance, and enterprise-grade reliability, with backup and recovery mechanisms further reducing the risk of data loss.

*Figure 5.4: Entity-relationship diagram of the IODMS database. [Insert ER diagram]*

## 5.8 Docker-Based Deployment

Docker-based deployment — the author's primary area of contribution during this phase of the internship — packages the application and its dependencies into portable containers, eliminating compatibility issues arising from differing operating systems or library versions. Separate containers were created for the frontend, backend API, and PostgreSQL database, coordinated via Docker Compose through a single configuration file.

This containerized architecture provides simplified deployment, platform independence, consistent execution across environments, improved scalability, and reduced configuration errors. For air-gapped organizations, it also simplifies offline installation, since complete application images can be transported on removable storage and deployed without internet connectivity.

*Figure 5.5: Docker container architecture for IODMS. [Insert architecture diagram]*

## 5.9 Deployment in an Air-Gapped Environment

An air-gapped network is physically isolated from the public internet, preventing unauthorized external communication and significantly improving cybersecurity — a deployment model common in defence organizations, government agencies, and critical infrastructure. Since online package repositories and cloud services are unavailable in such environments, every dependency must be prepared and transferred in advance. The deployment procedure followed these steps:

1. Build Docker images on an internet-connected development system.
2. Export frontend, backend, and PostgreSQL images as TAR archives.
3. Transfer the images via secure removable storage.
4. Import the images on the offline server.
5. Initialize all containers using Docker Compose.
6. Seed the PostgreSQL database.
7. Configure LAN access for authorized users.

## 5.10 LAN Deployment

Once deployed on the central server, IODMS becomes accessible to authorized users across the organization's Local Area Network through standard web browsers, without requiring separate installations on individual machines. Centralized deployment simplifies maintenance, backup, and version consistency, and — since document processing occurs entirely within the internal network — ensures confidential information never leaves the secure infrastructure, satisfying cybersecurity requirements typical of defence organizations.

*Figure 5.6: LAN-based deployment architecture. [Insert deployment diagram]*

## 5.11 Author's Contribution

The author's primary contribution centred on the deployment aspects of IODMS: Docker containerization, Docker Compose configuration, offline deployment strategy, LAN-based hosting, and PostgreSQL database initialization — covering the complete workflow from image creation and export through offline transfer, import, and final air-gapped deployment. This work was complemented by study of the FastAPI backend, React frontend, and REST API communication, strengthening understanding of full-stack architecture, modern DevOps methodology, and secure enterprise deployment.

## 5.12 Results and Discussion

The IODMS application met its design objectives, replacing manual document handling with an efficient digital workflow. The React frontend, styled with Material UI, provided an intuitive interface for login, document registration, search, and status tracking; the FastAPI backend handled authentication, permission validation, and database interaction with low latency owing to its asynchronous architecture; and the PostgreSQL database, with appropriate indexing, maintained consistent and efficiently retrievable records. Docker containerization and Compose-based orchestration simplified deployment across environments, and the system was successfully deployed and validated within a simulated air-gapped, LAN-based configuration.

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

## 5.13 Challenges Encountered

Configuring networking, environment variables, and service dependencies across multiple Docker containers required careful attention, particularly in understanding how Docker Compose establishes inter-container communication. Preparing for air-gapped deployment required advance planning of every software dependency, since online resolution was unavailable during deployment. Database initialization — creating the schema, running migrations, and seeding user data — required close coordination between backend and database containers, and LAN deployment required configuring network settings, firewall permissions, and server addressing for browser-based access across the organization.

## 5.14 Learning Outcomes

This project strengthened the author's understanding of full-stack architecture and the interaction between frontend, backend, database, and deployment layers; of REST API communication, authentication, and RBAC design; and, most significantly, of modern containerization concepts — packaging applications into portable, dependency-free execution environments — along with the broader practices of configuration management, debugging, and professional software documentation.

---

# CHAPTER 6 — CONCLUSION AND FUTURE RECOMMENDATIONS

## 6.1 Conclusion

The industrial internship at Hindustan Aeronautics Limited, Avionics Design Division, provided a valuable opportunity to bridge academic learning and industrial engineering practice, offering first-hand exposure to the engineering standards followed within one of India's leading aerospace and defence organizations.

The internship began with conceptual grounding in avionics communication protocols — **MIL-STD-1553B** and **ARINC 429** — and the role of **Interface Control Documents (ICDs)** in ensuring standardized, unambiguous communication between aircraft subsystems, supported by exposure to simulation software, acquisition systems, signal mapping, and the Qt framework.

A major technical outcome was the **Predictive Maintenance for Aircraft Turbofan Engines** project, in which an end-to-end machine learning pipeline was developed on the NASA C-MAPSS dataset to estimate Remaining Useful Life. Beyond simply comparing model accuracy, the project's key engineering insight was distinguishing validation from test-set generalization: while **XGBoost** achieved the strongest validation metrics (RMSE = 7.70, R² = 0.9679), **Support Vector Regression** generalized more reliably to unseen engines (RMSE = 12.76, R² = 0.9129) and was therefore selected for deployment — a distinction that reflects sound machine learning practice rather than simply reporting the most favourable numbers.

The second major technical strand, the **Inward Outward Document Management System (IODMS)**, provided practical exposure to full-stack development using React, FastAPI, and PostgreSQL, and — most significantly for the author's contribution — to Docker-based containerization, air-gapped deployment, and role-based security within a defence-grade software environment.

Beyond technical knowledge, the internship strengthened analytical thinking, technical documentation, and problem-solving skills, and reinforced the importance of precision, systematic verification, and rigorous documentation in aerospace engineering practice. The experience has strengthened the author's confidence and interest in pursuing further work in Artificial Intelligence, aerospace software engineering, and full-stack software development.

## 6.2 Future Recommendations

Future work building on this internship may include deeper study of avionics software development, embedded and real-time operating systems, and digital signal processing. The predictive maintenance system could be extended through deep sequence models (LSTM, GRU, Transformer architectures), engine-grouped cross-validation to produce validation estimates that better reflect true test-set generalization, Digital Twin integration, IoT-based real-time sensor streaming, and Explainable AI (SHAP, LIME) for interpretable maintenance recommendations. The IODMS platform could be extended with electronic signatures, automated workflow management, OCR-based document digitization, and AI-assisted document search and reporting. Continued work in these directions would further strengthen the development of secure, intelligent engineering solutions for future aerospace applications.

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

---

# APPENDICES

**Appendix A** — Project Folder Structure
**Appendix B** — System Architecture Diagrams
**Appendix C** — Streamlit Dashboard Screenshots
**Appendix D** — IODMS User Interface Screenshots
**Appendix E** — Docker Deployment Workflow
**Appendix F** — Machine Learning Model Performance Graphs
**Appendix G** — Additional EDA Visualizations

*(Figures, diagrams, and screenshots referenced throughout this report as placeholders should be inserted here or in-line, as per FCRIT's formatting requirements.)*
