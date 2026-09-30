# BHISSM — MASTER DEVELOPMENT PROMPT
## Bharat Health Initiative for SupplyChain Sourcing and Management

You are an expert full-stack software architect, UI/UX designer, database engineer, AI/ML engineer, emergency-resource coordination-system designer, and healthcare logistics systems engineer.

Build a complete working prototype called **BHISSM**:

> **Bharat Health Initiative for SupplyChain Sourcing and Management**

BHISSM is an AI-assisted healthcare supply-chain intelligence and emergency resource coordination platform. It is designed to maintain routine government medicine and vaccine supply chains and, during pandemics, disasters, mass-casualty incidents, major accidents, floods, cyclones, wildfires and similar critical situations, coordinate the redistribution of medicines and selected healthcare resources across hospitals, districts, regions and states.

The system must be designed as a realistic, modular, scalable prototype. Do not build it as a simple CRUD dashboard. It should behave like a connected operational platform with role-based workflows, inventory logic, forecasting, emergency coordination, reservations, fulfillment, national reserve management and a separate Blood Bank network.

---

# 1. CORE PRODUCT PHILOSOPHY

BHISSM has two operating modes:

## A. NORMAL OPERATIONS

Focus on:

- Government medicine inventory
- Medicine batches/lots
- FEFO
- Expiry tracking
- Consumption tracking
- AI demand forecasting
- Dynamic safety-stock calculation
- Replenishment lead-time awareness
- Supply-risk prediction
- Routine resupply concerns
- Vaccine inventory monitoring
- Disaster preparedness and pre-positioning
- Hospital capacity monitoring
- Ambulance/resource visibility

## B. EMERGENCY OPERATIONS

Activated only through an explicit protected workflow.

Focus on:

- Emergency medicine requirements
- Ambulance coordination
- Doctor/nurse/ward-staff coordination
- Aggregate casualty/load information
- Hospital care-type capacity monitoring
- Multi-source emergency fulfillment
- Inter-hospital and inter-state resource sharing
- National emergency stock fulfillment
- Resource reservation
- Availability windows
- Donor protection
- Donor replenishment
- Emergency stock return/reverse flow

BHISSM is an orchestration and intelligence layer. It must NOT become a full hospital-management system.

---

# 2. IMPORTANT SCOPE BOUNDARIES

Do NOT implement:

- Patient electronic medical records
- Clinical diagnosis
- Clinical treatment decisions
- Hospital admission management
- Automatic bed allocation
- Full ambulance dispatch replacement
- Payroll
- Hospital accounting
- Full procurement ERP
- Full disease-surveillance replacement
- Full national vaccine-management replacement
- Unapproved automatic military/private-hospital mobilization

BHISSM monitors and coordinates relevant information and workflows while leaving final operational decisions with authorized human users.

The AI must recommend, calculate and prioritize. It must not silently execute sensitive real-world actions.

---

# 3. INITIAL GEOGRAPHIC PROTOTYPE

Build the prototype around the **Puducherry operational region**.

Primary geography:

- Puducherry
- Puducherry district/region facilities
- Government hospitals
- CHCs
- PHCs
- Major medical/tertiary facilities

Supporting geography:

- Villupuram district
- Cuddalore district

Emergency expansion:

- Chennai / Tamil Nadu emergency ambulance and healthcare support

The architecture must remain extensible so additional districts and states can be added without rewriting the system.

Use realistic facility records for the prototype, but clearly label simulated/demo data where appropriate.

---

# 4. SYSTEM HIERARCHY

The platform must support multiple administrative levels:

```text
NATIONAL
   ↓
STATE / UT
   ↓
REGION
   ↓
DISTRICT
   ↓
CHC
   ↓
PHC / HOSPITAL
```

Resource movement can occur:

```text
National → State → District → Facility

or

Facility → District → State → Other State → National
```

Emergency fulfillment may move laterally:

```text
Facility A → Facility B
District A → District B
State A → State B
```

The same architecture must support cascading replenishment.

---

# 5. CORE CONCEPT: CASCADING REPLENISHMENT

Never think only in terms of:

> "Who has surplus?"

Instead calculate:

> "Who can safely provide resources without compromising their own projected requirements, and how will the donor be replenished?"

Example:

West Bengal needs 100 medicine containers.

Bihar:

- Stock = 60
- Critical lower threshold = 40
- Gives 15

Jharkhand:

- Stock = 70
- Critical lower threshold = 20
- Gives 40

Assam:

- Stock = 60
- Critical lower threshold = 30
- Gives 25

Remaining shortage is fulfilled by other sources/national stock.

Then:

- Bihar may be replenished from UP/MP
- Jharkhand may be replenished from Chhattisgarh/Odisha
- Assam may be replenished from Meghalaya/Arunachal Pradesh

The exact example values are illustrative demo data, not hard-coded policy.

---

# 6. DYNAMIC SAFETY-STOCK ENGINE

Do NOT calculate safe transferable stock as simply:

```text
Current stock - minimum stock
```

Implement a dynamic calculation.

Inputs:

- Current usable stock
- Reserved stock
- Average consumption
- Recent consumption trend
- Forecast demand
- Seasonal demand
- Emergency demand
- Replenishment lead time
- Safety buffer
- Pending incoming stock
- Existing emergency commitments
- Current preparedness requirement

Conceptual formula:

```text
Protected Stock =
Forecast Consumption During Lead Time
+ Safety Buffer
+ Existing Reservations
- Confirmed Incoming Supply
```

```text
Safe Transferable Stock =
Usable Current Stock - Protected Stock
```

If safe transferable stock <= 0:

```text
DO NOT OFFER
```

If positive:

```text
MAY OFFER
```

Final transfer still requires the applicable authorization/confirmation.

Show the calculation transparently in the UI.

---

# 7. MEDICINE INVENTORY

Every medicine record should support:

- Medicine name
- Generic name
- Brand/manufacturer where applicable
- Strength
- Dosage/form
- Category
- Unit type
- Criticality
- Current total stock
- Reserved stock
- Usable stock
- Safety threshold
- Reorder level
- Supplier
- Lead time
- Storage requirement
- Facility
- Batch/lot information

Inventory should be facility-specific.

---

# 8. BATCH / LOT MANAGEMENT

Every stock entry must support:

- Batch number
- Manufacturer
- Received date
- Expiry date
- Quantity
- Storage location
- Usable status
- Quarantined status

Do not collapse all stock of the same medicine into one number.

Example:

```text
Paracetamol 500 mg

LOT A
2,000 units
Expiry: Jan 2027

LOT B
3,500 units
Expiry: Apr 2027

LOT C
4,500 units
Expiry: Dec 2027
```

---

# 9. FEFO

Implement:

> First Expiry, First Out

The system should prioritize the batch that expires first for issue/consumption recommendations.

Show:

- Next batch to consume
- Days to expiry
- Expiry risk
- Quantity
- Suggested action

Do not automatically move or dispose of stock without an authorized action.

---

# 10. REPLENISHMENT LEAD-TIME INTELLIGENCE

For each medicine/supplier relationship store:

- Supplier
- Normal lead time
- Emergency lead time if applicable
- Historical average delivery time
- Pending order
- Expected arrival
- Delivery reliability

Example:

```text
Predicted stock-out = 8 days
Lead time = 12 days

→ CRITICAL RESUPPLY CONCERN
```

Another:

```text
Predicted stock-out = 30 days
Lead time = 7 days

→ NORMAL MONITORING
```

The AI should reason using the difference between expected exhaustion and replenishment time.

---

# 11. AI DEMAND FORECASTING

Forecast medicine consumption using available historical data.

Consider:

- Daily consumption
- Weekly patterns
- Weekends
- Monthly patterns
- Seasonal trends
- Previous-year consumption
- Recent acceleration/deceleration
- Known emergency requirements
- Preparedness/pre-positioning requirements

For the prototype, create seeded historical datasets so the forecasting system can visibly demonstrate meaningful predictions.

Do not fabricate external real-time data.

---

# 12. SUPPLY-CHAIN DISRUPTION RISK

Separate:

## Demand Risk

How fast the medicine may be consumed.

## Supply Risk

How likely replacement stock is to arrive on time.

Consider:

- Supplier delays
- Pending shipment
- Lead time
- Manual disruption flags
- Emergency conditions
- Facility/supplier status

Example:

```text
Stock coverage: 14 days
Expected replenishment: 10 days

Normally:
SAFE

Disruption:
+8 days delay

Result:
HIGH SUPPLY RISK
```

Display both demand risk and supply risk.

---

# 13. DISASTER PRE-POSITIONING

Implement a preparedness/pre-positioning mode separate from emergency activation.

Workflow:

```text
Potential disaster/risk identified
        ↓
Preparedness analysis
        ↓
Demand projection
        ↓
Inventory coverage analysis
        ↓
Pre-positioning recommendation
        ↓
Authorized approval
        ↓
Resource movement
```

Example:

```text
Current emergency coverage: 10 days
Recommended preparedness coverage: 18 days

Additional requirement: 8 days
Priority: HIGH
```

This is a recommendation workflow.

Do not automatically declare an emergency.

---

# 14. VACCINE INVENTORY

Monitor:

- Vaccine
- Brand/manufacturer
- Batch
- Quantity
- Expiry
- Facility
- Reserved quantity
- Safety threshold
- Demand trend
- Resupply requirement

Keep vaccine inventory logically separate from ordinary medicines.

---

# 15. HOSPITAL CAPACITY MONITORING

BHISSM only monitors capacity.

It does NOT allocate beds.

Track care-type capacity such as:

- General beds
- ICU
- Trauma
- Paediatric
- Obstetric
- Ventilator-capable beds where applicable

Example:

```text
Hospital A

General: 30
ICU: 4
Trauma: 8
Paediatric: 6
Obstetric: 3
Ventilator-capable: 2
```

Do not interpret "30 general beds" as "30 trauma beds."

---

# 16. EMERGENCY AGGREGATE LOAD

Do not create individual patient medical records.

Record aggregate emergency load:

```text
Critical: 42
Serious: 118
Minor: 240
Deceased: 31
Unassessed: 160
```

Use this for estimating:

- Ambulance requirement
- Staff requirement
- Medicine requirement
- Referral pressure
- Hospital load

---

# 17. EMERGENCY ACTIVATION

Emergency activation must require TWO deliberate steps.

### Step 1

Initiate Emergency Response.

Collect:

- Emergency type
- Location
- Severity/description
- Estimated casualties
- Expected duration
- Required resources

### Step 2

Confirm Emergency Activation.

Do not activate with a single accidental click.

Once confirmed:

```text
EMERGENCY RESPONSE = ACTIVE
```

---

# 18. RESOURCE REQUESTS

Emergency requests can include:

- Ambulances
- Doctors
- Nurses
- Ward staff
- Medicines
- Blood
- Other explicitly supported resources

Each request must have:

- Requesting facility
- Destination
- Quantity
- Priority
- Required time
- Current fulfilled quantity
- Remaining quantity
- Status

---

# 19. RESOURCE AVAILABILITY WINDOWS

Resources cannot be represented only by quantity.

Example doctor:

```text
2 Emergency Physicians
Available: 14:00–22:00
Deployment time: 45 min
```

Example ambulance:

```text
3 ALS ambulances
Available from: 15:00
```

The matching system must consider the availability window.

---

# 20. RESOURCE RESERVATION / DOUBLE-BOOKING PREVENTION

Every shared resource must have states:

```text
AVAILABLE
↓
OFFERED
↓
RESERVED
↓
ASSIGNED
↓
DISPATCHED
↓
IN USE
↓
RETURNING
↓
AVAILABLE
```

A reserved resource cannot simultaneously be allocated elsewhere.

Apply this to:

- Ambulances
- Doctors
- Nurses
- Ward staff
- Emergency medicine
- Blood
- Other supported resources

---

# 21. AMBULANCE COORDINATION

BHISSM monitors and coordinates availability.

Track:

- Provider
- Type
- Current status
- Current location/operational zone
- Availability
- Capacity where appropriate
- Assigned incident
- Deployment time
- Return status

Do not replace dedicated ambulance dispatch/control systems.

---

# 22. MEDICAL STAFF COORDINATION

Track emergency availability of:

- Doctors
- Nurses
- Ward staff

Each resource offer should include:

- Quantity
- Role/specialty where applicable
- Availability window
- Deployment time
- Current assignment

---

# 23. MULTI-SOURCE EMERGENCY FULFILLMENT

Never assume one source must satisfy an entire requirement.

Example:

```text
Requirement = 100

Bihar      → 15
Jharkhand  → 40
Assam      → 25
Other      → 10
National   → 10

Total = 100
```

The engine calculates:

```text
Remaining Shortage =
Required - Confirmed Fulfillment
```

Continue searching until:

```text
Remaining Shortage = 0
```

or no authorized/feasible sources remain.

---

# 24. FULFILLMENT SOURCE SELECTION

Candidate sources should be evaluated using:

- Safe transferable quantity
- Local projected requirements
- Replenishment lead time
- Availability window
- Existing reservations
- Existing commitments
- Emergency priority
- Source authorization/status
- Available transport information where available

The system should produce a recommended fulfillment plan.

The final real-world action remains human-authorized.

---

# 25. NATIONAL EMERGENCY RESERVE

Create a national reserve module.

Conceptual structure:

```text
TOTAL NATIONAL RESERVE
        │
        ├── PROTECTED RESERVE
        ├── EMERGENCY-AVAILABLE RESERVE
        ├── ALLOCATED
        └── RELEASED
```

Protected reserve must not be casually consumed.

Emergency-available reserve can fulfill approved emergency requirements.

---

# 26. NATIONAL MONITORING LOGIN

Create:

**Username:** `national_monitor_01`

**Password:** `BHISSM@National#01`

This is DEMO ONLY.

National Monitoring can:

- View national inventory
- View state inventory
- View emergencies
- View requests
- View fulfillment
- View national reserve
- View resource movement
- View dashboards and analytics

It is primarily READ-ONLY.

### Special operational exception:

For an approved emergency medicine requirement:

```text
FULFILL FROM NATIONAL STOCK
```

The operator may:

- Select approved request
- Select reserve source
- Select quantity
- Confirm emergency release

The action must be logged.

Do not allow this role to:

- Edit ordinary hospital inventory
- Modify state inventory
- Create arbitrary hospital requests
- Modify historical data
- Change thresholds
- Directly manage beds
- Automatically mobilize private/military resources

---

# 27. EMERGENCY ESCALATION NETWORK

The conceptual escalation path is:

```text
Hospital / PHC
      ↓
Nearby Government Facilities
      ↓
District
      ↓
Regional Network
      ↓
Other Districts
      ↓
State / UT
      ↓
Other States
      ↓
National Emergency Reserve
```

For exceptional emergencies, the system can display availability from participating:

- Railway healthcare facilities
- Defence/Military healthcare facilities
- Central government facilities
- Participating private hospitals

These must be treated as authorized/participating resources, not automatically available resources.

---

# 28. DONOR PROTECTION

When a facility offers resources, calculate the impact on the donor.

Example:

```text
Donor stock = 60
Protected stock = 40

Safe transferable stock = 20
```

If it offers 15:

```text
Remaining = 45
```

The system should create:

```text
DONOR REPLENISHMENT REQUIRED
```

if the donor's reserve has been materially reduced.

---

# 29. DONOR REPLENISHMENT

Example:

```text
Bihar → West Bengal = 15

Bihar reserve falls.

UP → Bihar
MP → Bihar
```

Track replenishment separately from ordinary emergency transfer.

A donor replenishment request contains:

- Donor
- Resource
- Quantity
- Priority
- Reason
- Current stock
- Protected stock
- Target restoration quantity
- Source
- Status

---

# 30. REVERSE EMERGENCY STOCK FLOW

Emergency resources may return after an incident.

Example:

```text
State A → State B
500 units

Used = 330
Unused = 170

State B → State A
170
```

Track:

- Original transfer
- Used quantity
- Remaining quantity
- Returned quantity
- Return movement
- Reconciliation status

Return and donor replenishment are separate workflows.

---

# 31. BLOOD BANK — SEPARATE ONLINE SUBSYSTEM

Create a dedicated **BHISSM Blood Bank Network**.

It must not treat blood simply as ordinary medicine inventory.

It coordinates participating:

- Government blood banks
- Government hospitals
- Medical colleges
- Railway/defence/other authorized facilities where applicable
- Participating private hospitals/blood banks

---

# 32. BLOOD BANK DATA

Support blood groups:

- A+
- A-
- B+
- B-
- AB+
- AB-
- O+
- O-

Support components where data is available:

- Whole Blood
- Packed RBC
- Platelets
- Plasma

For each inventory record:

- Blood bank
- Hospital
- Blood group
- Component
- Available quantity
- Reserved quantity
- Requestable quantity
- Collection/expiry information where applicable
- Status

---

# 33. BLOOD BANK REQUEST

Example:

```text
BLOOD REQUEST

Hospital:
Facility A

Group:
O-

Component:
Packed RBC

Required:
8 units

Priority:
URGENT

Required by:
16:30

Reason:
Mass casualty incident
```

The system searches eligible participating sources.

---

# 34. BLOOD FULFILLMENT

Search candidate sources:

1. Nearby government blood banks
2. Nearby participating hospitals
3. Government medical colleges
4. Other authorized healthcare networks
5. Participating private hospitals/blood banks

Show:

- Available units
- Reserved units
- Transferable/requestable units
- ETA/operational availability where available
- Status

Respect all applicable blood-safety and authorization requirements.

---

# 35. BLOOD REQUEST LIFECYCLE

```text
REQUESTED
↓
SOURCE IDENTIFIED
↓
OFFERED
↓
CONFIRMED
↓
RESERVED
↓
DISPATCHED
↓
RECEIVED
↓
COMPLETED
```

Support multi-source fulfillment:

```text
Source A → 3
Source B → 2
Source C → 3
```

Total = 8.

---

# 36. ROLE-BASED ACCESS CONTROL

Create three main login types.

## Hospital Login

Hospital users can:

- View own inventory
- Update own inventory
- Manage medicine batches
- Record consumption
- Monitor vaccines
- View forecasts
- Create routine resupply requests
- Create emergency requests
- Offer eligible resources
- View relevant capacity
- View ambulances
- Participate in Blood Bank workflows

Cannot modify other hospitals' records.

## State Login

State users can:

- Monitor facilities
- Review inventory
- Coordinate redistribution
- Review requests
- Coordinate emergency resources
- View state-wide capacity
- Coordinate cross-district/inter-state requirements
- Escalate shortages
- Coordinate donor replenishment

## National Monitoring

Primarily read-only, with the approved national-stock fulfillment exception described above.

---

# 37. DEMO CREDENTIALS

Use demo credentials only.

### Puducherry Hospital

Username:
`hospital_puducherry_01`

Password:
`BHISSM@Demo#P01`

### JIPMER/Major Medical Facility Demo

Username:
`hospital_jipmer_01`

Password:
`BHISSM@Demo#J01`

### Cuddalore Hospital

Username:
`hospital_cuddalore_01`

Password:
`BHISSM@Demo#C01`

### Villupuram Hospital

Username:
`hospital_villupuram_01`

Password:
`BHISSM@Demo#V01`

### Puducherry State/UT

Username:
`state_puducherry_admin`

Password:
`BHISSM@State#P01`

### National Monitoring

Username:
`national_monitor_01`

Password:
`BHISSM@National#01`

These are demonstration credentials. Never use plaintext credentials in a production system.

---

# 38. UI DESIGN

Create a **minimal light retro government command-dashboard aesthetic**.

Primary colors:

```text
Background: #F8F1E7
Surface:    #FFF9F1
Accent:     #E8A7B5
Light Pink: #F4D5DC
Dark:       #2D2926
Secondary:  #514944
Success:    #6F8B72
Warning:    #C59655
Critical:   #B65C62
```

Use colors sparingly.

Visual style:

- Light cream background
- Dusty/light pink accents
- Warm charcoal typography
- Thin dark borders
- Soft shadows
- Slight retro character
- Rounded cards
- Compact information density
- Clear typography
- Minimal animation
- No neon
- No cyberpunk
- No excessive gradients
- No excessive glassmorphism

Normal mode should feel:

> Calm, organized, administrative.

Emergency mode should feel:

> Focused, dense, urgent.

Do not completely change the visual identity during emergencies.

---

# 39. MAIN NAVIGATION

Hospital:

- Overview
- Medicine
- Vaccines
- Hospitals
- Ambulances
- Medical Staff
- Emergencies
- Blood Bank
- Requests
- AI Intelligence
- Audit/Activity
- Settings

State:

- State Overview
- Facilities
- Medicine
- Vaccines
- Redistribution
- Emergencies
- Ambulances
- Staff
- Capacity
- Blood Bank
- Requests
- AI Intelligence
- National Escalation
- Audit

National:

- National Overview
- State Network
- Medicine
- Vaccines
- Emergencies
- Resource Network
- Blood Network
- National Reserve
- Fulfillment
- Analytics
- Audit

---

# 40. HOSPITAL DASHBOARD

Display:

### Medicine

- Total categories
- Critical medicines
- Low-stock medicines
- Predicted stock-outs
- Pending resupply

### Vaccines

- Total doses
- Low stock
- Expiring lots
- Forecasted demand

### Emergency

- Active incidents
- Emergency requests
- Ambulances available
- Incoming support

### Capacity

- General beds
- ICU
- Trauma
- Other configured care types

### AI Alerts

Examples:

```text
Paracetamol predicted shortage in 9 days
Lead time = 12 days
CRITICAL

Amoxicillin Lot A expires in 31 days
FEFO priority

Cyclone preparedness:
Emergency medicine coverage below recommended level
```

---

# 41. STATE DASHBOARD

Show:

- Facilities monitored
- Total medicine inventory
- Critical shortages
- Forecasted shortages
- Pending requests
- Active emergencies
- Ambulance availability
- Staff availability
- Care capacity
- Inter-facility transfers
- Donor replenishment
- National escalations

Provide a map/list hybrid view.

---

# 42. NATIONAL DASHBOARD

Show:

- States monitored
- Critical medicine categories
- Active emergencies
- National reserve
- States under shortage
- States contributing
- Emergency fulfillment
- Cross-state movements
- Blood-network overview

National view should be primarily observational.

---

# 43. MEDICINE DETAIL PAGE

For each medicine show:

```text
Medicine
Current Stock
Usable Stock
Reserved
Safety Stock
Daily Consumption
Forecast Consumption
Predicted Stock-Out
Supplier Lead Time
Supply Risk
Demand Risk
Pending Incoming
Recommended Action
```

Batch table:

```text
Batch
Quantity
Expiry
Status
FEFO Priority
```

---

# 44. AI INTELLIGENCE PAGE

Separate:

### Demand Forecast

What will likely be consumed?

### Stock-Out Prediction

When could stock become insufficient?

### Supply Risk

Could replenishment arrive too late?

### Safe Transferable Stock

What can be offered without harming the donor?

### Pre-Positioning

What should be moved before expected high demand?

### Emergency Fulfillment

Which combination of sources can fulfill a requirement?

For every recommendation, show the underlying numerical factors.

Do not create an opaque "AI says so" interface.

---

# 45. EMERGENCY DASHBOARD

Display:

```text
ACTIVE INCIDENT
Location
Incident Type
Time
Estimated Load
Required Resources
Fulfilled
Remaining
```

Resource panels:

- Ambulances
- Doctors
- Nurses
- Ward staff
- Medicines
- Blood

Show state transitions clearly.

---

# 46. REQUEST UI

Every request should display:

```text
REQUEST ID
REQUESTER
RESOURCE
QUANTITY REQUIRED
QUANTITY CONFIRMED
REMAINING
PRIORITY
REQUIRED BY
STATUS
```

Status:

```text
REQUESTED
OFFERED
PARTIALLY FULFILLED
CONFIRMED
RESERVED
DISPATCHED
RECEIVED
COMPLETED
```

---

# 47. DATABASE ARCHITECTURE

Use a relational database such as PostgreSQL.

Core entities:

```text
users
roles
facilities
states
districts
regions

medicines
medicine_batches
inventory
inventory_transactions
inventory_reservations
consumption_records
demand_forecasts
supply_risk_records
lead_times

vaccines
vaccine_batches
vaccine_inventory

hospital_capacity
capacity_snapshots
care_type_capacity

ambulances
medical_staff
staff_availability

emergencies
emergency_requirements
resource_offers
resource_reservations
resource_assignments
resource_movements

national_reserves
national_reserve_inventory
national_allocations
national_releases

emergency_returns
donor_replenishment_requests
donor_replenishment_movements

blood_banks
blood_inventory
blood_requests
blood_offers
blood_reservations
blood_transfers

preparedness_plans
prepositioning_recommendations
prepositioning_movements

alerts
audit_logs
```

Use foreign keys, indexes and timestamps.

---

# 48. IMPORTANT DATABASE RULES

Inventory must be transaction-based.

Do not simply overwrite:

```text stock = 450
```

Instead record transactions:

```text RECEIPT +100
CONSUMPTION -20
TRANSFER_OUT -50
TRANSFER_IN +40
ADJUSTMENT -5
```

Current stock is derived from valid inventory transactions plus appropriate reservations/status.

This makes movement traceable.

---

# 49. API ARCHITECTURE

Create modular APIs.

Examples:

```text
/auth
/users
/facilities
/medicines
/inventory
/batches
/consumption
/forecast
/supply-risk
/vaccines
/capacity
/ambulances
/staff
/emergencies
/requests
/resources
/redistribution
/national-reserve
/blood-bank
/preparedness
/prepositioning
/audit
```

Use role-based middleware.

Never rely only on frontend permission hiding.

---

# 50. REAL-TIME UPDATES

Where practical, use WebSockets/server-sent events for:

- Emergency request status
- Resource reservation
- Inventory changes
- National fulfillment
- Blood request status
- Active emergency updates

If real-time infrastructure is unavailable, implement a clean polling fallback.

---

# 51. DEMO DATA

Seed realistic but clearly simulated data.

Include:

- Puducherry facilities
- Villupuram facilities
- Cuddalore facilities
- Chennai support nodes
- Medicine catalog
- Multiple batches
- Consumption history
- Forecasts
- Ambulances
- Staff
- Hospital capacities
- Blood-bank inventory
- National reserve

Do not imply simulated values are live government data.

---

# 52. DEMONSTRATION SCENARIOS

Implement demo scenarios so the system can be tested.

## Scenario 1 — Normal Medicine Shortage

A medicine is predicted to run out before replenishment arrives.

Show:

```text
Forecast
↓
Lead-time comparison
↓
Critical resupply concern
↓
Request
```

## Scenario 2 — Pre-Positioning

A simulated disaster preparedness condition occurs.

Show:

```text
Current coverage
↓
Recommended coverage
↓
Additional requirement
↓
Pre-positioning recommendation
```

## Scenario 3 — Mass Casualty

A major accident occurs.

Example:

```text
PHC capacity:
10–15 patients

Incident load:
1,000+
```

Show:

```text
Emergency activation
↓
Casualty/load entry
↓
Ambulance requirement
↓
Medicine requirement
↓
Staff requirement
↓
Hospital capacity monitoring
↓
External resource requests
```

## Scenario 4 — Cascading Medicine Fulfillment

West Bengal-style demonstration:

```text
Need 100

Bihar → 15
Jharkhand → 40
Assam → 25
Other → 10
National → 10
```

Then demonstrate:

```text
Bihar needs replenishment
UP/MP → Bihar
```

## Scenario 5 — Blood Emergency

Mass casualty creates:

```text
O- Packed RBC
Need: 8
```

Show:

```text
Blood Bank A → 3
Blood Bank B → 2
Private Blood Bank C → 3
```

Then:

```text
8 / 8 FULFILLED
```

## Scenario 6 — National Reserve

Regional sources cannot completely fulfill an approved request.

Show:

```text
Regional fulfillment
↓
Remaining shortage
↓
Approved national reserve
↓
National stock fulfillment
```

## Scenario 7 — Reverse Flow

Emergency ends.

Show:

```text
500 transferred
330 used
170 unused

170 returned
```

Then show donor replenishment separately if needed.

---

# 53. ERROR HANDLING

Never allow silent failure.

Handle:

- Insufficient stock
- Insufficient safe transferable stock
- Expired batch
- Reserved stock conflict
- Resource already assigned
- Invalid availability window
- National reserve protected
- Request exceeding authorization
- Partial fulfillment
- Source unavailable
- Duplicate request
- Invalid role

Give clear human-readable messages.

---

# 54. SECURITY

For the prototype:

- Role-based access control
- Protected routes
- Backend authorization
- Secure sessions
- Password hashing
- Input validation
- Audit logging
- No plaintext production credentials

The supplied usernames/passwords are demo credentials only.

Privileged actions should require explicit confirmation.

---

# 55. AUDITABILITY

For sensitive operations record:

```text
Who
What
When
Resource
Quantity
Source
Destination
Reason
Status
```

At minimum audit:

- Emergency activation
- Emergency confirmation
- Resource reservation
- Medicine transfer
- Blood transfer
- National reserve release
- Donor replenishment
- Stock adjustment

---

# 56. RESPONSIVE DESIGN

Desktop-first because this is an operational dashboard.

Still support:

- Laptop
- Tablet
- Mobile emergency view

On mobile:

- Prioritize alerts
- Active emergency
- Requests
- Critical inventory
- Resource availability

Avoid attempting to squeeze every desktop table onto mobile.

---

# 57. PERFORMANCE

The UI should feel smooth.

Avoid:

- Huge component trees
- Unnecessary rerenders
- Repeated API calls
- Heavy map rendering when not needed
- Loading all inventory records into the browser
- Blocking calculations on the UI thread

Use:

- Pagination
- Lazy loading
- Memoization where appropriate
- Server-side filtering
- Debounced search
- Efficient database queries
- Cached dashboard aggregates

---

# 58. ARCHITECTURE

Recommended conceptual architecture:

```text
                 BHISSM FRONTEND
                       │
                 API / AUTH LAYER
                       │
       ┌───────────────┼────────────────┐
       │               │                │
 INVENTORY         EMERGENCY         BLOOD BANK
 SERVICE           SERVICE           SERVICE
       │               │                │
       └───────────────┼────────────────┘
                       │
                CORE DATABASE
                       │
       ┌───────────────┼────────────────┐
       │               │                │
 FORECASTING      ALLOCATION       NATIONAL RESERVE
 ENGINE           ENGINE              ENGINE
       │               │                │
       └───────────────┼────────────────┘
                       │
                  AUDIT / EVENTS
```

Keep services modular even if the prototype is implemented as a modular monolith.

Do not create unnecessary microservices for a laptop prototype.

---

# 59. AI ARCHITECTURE

For the first prototype, prioritize reliable statistical forecasting over unnecessarily complex deep learning.

Possible pipeline:

```text
Historical Consumption
        ↓
Cleaning
        ↓
Feature Engineering
        ↓
Forecast Model
        ↓
Demand Forecast
        ↓
Safety Stock Engine
        ↓
Stock-Out Prediction
        ↓
Resupply / Transfer Recommendation
```

For emergency allocation:

```text
Requirements
+
Source inventory
+
Protected stock
+
Lead time
+
Reservations
        ↓
Optimization
        ↓
Multi-source recommendation
```

AI outputs should remain recommendations.

---

# 60. NO FAKE "LIVE" DATA

If external APIs are not actually connected:

Do NOT display:

> LIVE DATA

Instead display:

> DEMO / SIMULATED DATA

or:

> LAST SYNCHRONIZED: [timestamp]

Do not pretend that the prototype is connected to government databases.

---

# 61. FINAL UX PRINCIPLE

The user should always understand:

1. What is happening?
2. What is at risk?
3. What resources are available?
4. What is being requested?
5. What has already been committed?
6. What remains unfulfilled?
7. Why is the system recommending an action?
8. What will happen to the donor after the transfer?

Do not hide operational logic behind decorative UI.

---

# 62. FINAL PRODUCT IDENTITY

The final platform should feel like:

> **A calm, intelligent national healthcare logistics command system that becomes a coordinated emergency resource network when normal healthcare capacity is overwhelmed.**

It should visually communicate:

- Trust
- Control
- Clarity
- Public-service infrastructure
- Reliability
- Calm under pressure

Avoid making it look like a generic SaaS admin panel.

---

# 63. BUILD REQUIREMENT

Build the system as a genuinely functioning prototype.

Do not create static mockups with buttons that do nothing.

Every important UI action must connect to actual application state and, where implemented, the database/API.

At minimum the prototype must demonstrate:

```text
LOGIN
↓
ROLE DASHBOARD
↓
INVENTORY
↓
FORECAST
↓
SAFETY STOCK
↓
RESUPPLY
↓
PRE-POSITIONING
↓
EMERGENCY ACTIVATION
↓
RESOURCE REQUEST
↓
MULTI-SOURCE FULFILLMENT
↓
RESERVATION
↓
NATIONAL RESERVE
↓
DONOR REPLENISHMENT
↓
REVERSE FLOW
```

And separately:

```text
BLOOD BANK
↓
BLOOD INVENTORY
↓
BLOOD REQUEST
↓
MULTI-SOURCE MATCHING
↓
RESERVATION
↓
TRANSFER
↓
FULFILLMENT
```

---

# 64. FINAL INSTRUCTION TO THE DEVELOPMENT AGENT

Before writing code:

1. Understand the entire BHISSM architecture.
2. Create the database schema.
3. Define role permissions.
4. Define API contracts.
5. Define state machines.
6. Seed realistic simulated data.
7. Build the core backend.
8. Build the frontend.
9. Implement the AI/forecasting layer.
10. Implement emergency workflows.
11. Implement the Blood Bank subsystem.
12. Implement national reserve fulfillment.
13. Implement donor replenishment and reverse flow.
14. Test every major scenario.
15. Fix authorization and state-transition bugs.
16. Ensure the interface remains smooth and responsive.
17. Ensure simulated data is clearly identified.
18. Do not add unrelated features outside this specification.
19. Keep the system modular so future integrations can be added.
20. Provide clear setup instructions, environment variables, database migration/seed instructions and demo login credentials.

The result should be a polished, realistic, laptop-runnable BHISSM prototype demonstrating the complete operational concept.

---

# 65. TWO-TIER STRATEGIC MEDICINE DISTRIBUTION PIPELINE (CENTRAL → STATE RESERVE → HOSPITAL)

When the **Central National Stockpile (`national`)** releases medicines to a State/UT, the stock must **not** bypass State Health Command. Instead, it follows a strict two-stage federated distribution pipeline:

```text
CENTRAL NATIONAL STOCKPILE (National Login)
        │
        │  1. POST /api/national-reserve/release
        ▼
STATE MEDICAL RESERVE DEPOT (type = 'state_reserve')
        │
        │  2. GET /api/national-reserve/state-stock (State Inspection)
        │  3. POST /api/national-reserve/state-redistribute (FEFO Allocation)
        ▼
JURISDICTION HOSPITALS (JIPMER, GH Puducherry, PIMS, RGGWCH, East Coast, Auroville, etc.)
```

### Working Logic:
1. **Auto-Provisioned State Reserve Depot (`ensureStateReserveFacility`)**:
   - Every State/UT has a dedicated **`${StateName} State Medical Reserve Depot`** (`type: 'state_reserve'`, `level: 'state_reserve'`).
   - Central releases credit this depot's `Inventory` and create a traceable `InventoryBatch` (`NAT-REL-*`) plus an immutable `national_release_inward` `InventoryTransaction`.
2. **State-to-Hospital Redistribution (`POST /api/national-reserve/state-redistribute`)**:
   - State Controllers (`role: 'state'`) inspect their State Reserve Stockpile and redistribute medicines/vaccines to any hospital under their jurisdiction.
   - The backend deducts the requested quantity from the State Reserve Depot's earliest-expiring batches (**FEFO**) and credits the recipient hospital's `Inventory` and `InventoryBatch` (`ST-REDIST-*`) with `state_reserve_redistribution` audit transactions on both sides.

---

# 66. HOSPITAL-WISE MEDICINE & VACCINE STOCK CHECKING DASHBOARD (STATE LOGIN)

State Command (`role: 'state'`) requires a dedicated **Hospital-Wise Medicine Stock Checking Dashboard** (`GET /api/inventory/state-hospital-summary` & `InventoryPage.tsx`):

- Displays an interactive card matrix of every hospital under the state's jurisdiction (excluding internal `state_reserve` depots).
- Each hospital card reports:
  - `total_medicines` & `total_vaccines` stocked
  - `total_stock_units` (aggregate usable inventory)
  - `low_stock_count` & `stockout_count`
  - Top `critical_deficit_items` (`current_stock / safety_threshold`)
- Clicking any hospital card (or using the jurisdiction hospital filter dropdown) filters the inventory table to inspect that specific hospital's medicine & vaccine batches.
- Every hospital inventory row provides a **`+ Allocate`** action button so the State Controller can immediately dispatch replenishment stock from the **State Reserve Stockpile** to that hospital.

---

# 67. MANUAL STOCK ENTRY & DIRECT VENDOR ONBOARDING SYSTEM (HOSPITALS & STATE)

Hospitals must be able to manually enter stock and healthcare assets procured directly from approved vendors, donation camps, or local onboarding:

1. **Direct Vendor Medicine & Vaccine Stock Entry (`POST /api/inventory/vendor-purchase`)**:
   - Allows selecting any formulation from the **33+ Master Medicine & Vaccine Formulary** **or** registering a brand-new custom medicine/vaccine formulation.
   - Captures:
     - `vendor_name` (e.g., *Cipla Direct*, *Sun Pharma Distributor*, *Serum Institute of India*)
     - `invoice_number` (PO / Delivery Challan #)
     - `batch_number` (Lot #) & `expiry_date` (FEFO schedule)
     - `quantity`, `unit_cost`, `safety_threshold`, and `storage_location` (including `2°C–8°C Cold Chain ILR` for vaccines).
   - Automatically upserts hospital `Inventory`, creates a FEFO `InventoryBatch`, and logs a `vendor_purchase` `InventoryTransaction`.
2. **Manual Blood Bank Stock Entry (`POST /api/blood-bank/manual-entry`)**:
   - Automatically locates or provisions the hospital's `BloodBank` (`hasBloodBank = 1`).
   - Adds units by `blood_group` (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) and `component` (`packed_rbc`, `whole_blood`, `platelets`, `plasma`), recording Collection/Vendor Source, Bag Reference #, Collection Date, and Expiry Date.
3. **Manual Ambulance Fleet Registration (`POST /api/facilities/ambulances`)**:
   - Registers new `ALS`, `BLS`, `Mobile ICU`, or `Neonatal` ambulances with vehicle registration plate, provider, deployment zone, and onboard life-support equipment.
4. **Manual Doctor & Specialist Staff Onboarding (`POST /api/facilities/staff` & `PATCH /api/facilities/staff/:id`)**:
   - Onboards Doctors, Trauma Surgeons, Anesthetists, ICU Nurses, and ALS Paramedics with specialty, rapid deployment time (minutes), contact hotline, and live availability toggling (`available` $\leftrightarrow$ `deployed`).
5. **Hospital Bed Ward Configuration (`POST /api/facilities/:id/capacity`)**:
   - Configures or updates `icu`, `trauma`, `ventilator`, `general`, `pediatric`, `maternity`, and `isolation` bed wards.

---

# 68. DESIGNATED HOSPITAL EMERGENCY HIERARCHY & AUTHORIZED RECEIPT PROTOCOL

1. **Primary, Secondary & Supporting Hospital Designation**:
   - Every declared emergency incident (`POST /api/emergency/declare`) designates:
     - **🥇 Primary Lead Hospital**: Main trauma/triage command center for the disaster.
     - **🥈 Secondary Backup Hospital**: Overflow critical care & surgical backup.
     - **🤝 Supporting Hospitals**: Additional regional hospitals assigned to support the incident.
   - Stored in `affectedZones` metadata and exposed via `designated_hospitals` on `GET /api/emergency/active`.
2. **Strict Authorization for Confirming & Receiving Dispatched Aid (`POST /api/emergency/aid/:aidRequestId/confirm-receipt`)**:
   - Only the **Requesting Hospital**, the incident's designated **Primary / Secondary / Supporting Hospitals**, or the **State Controller** can execute **Confirm & Receive**.
   - Unauthorized hospitals are blocked in both the UI and backend (`403 Forbidden`).
3. **Self-Fulfillment Prevention & Accurate Resource Headings**:
   - A hospital that created an aid request is never prompted to fulfill its own request (`Requisitioned by your facility`).
   - Requisitions for **Ambulances**, **Doctors/Specialists**, **Blood Units**, and **Medicines** render their exact resource category icon and heading (`🚑 ALS Ambulance`, `👨‍⚕️ Trauma Surgeon`, `🩸 O- Packed RBC`, `💊 Medicine`).

---

# 69. INTER-STATE & ADJACENT DISTRICT MUTUAL AID CORRIDOR

Because enclaves like **Puducherry UT** are geographically intertwined with **Tamil Nadu's Villupuram, Cuddalore, and Auroville border districts**, BHISSM implements an automated **Inter-State & Adjacent District Mutual Aid Corridor** (`ADJACENT_STATE_CORRIDORS` in `backend/src/routes/emergency.ts`):

- Active emergencies and mutual-aid requisitions in **Puducherry** are automatically visible to adjacent **Tamil Nadu** district hospitals (*GH Villupuram*, *GH Cuddalore*, *Santigiri Hospital Auroville*, *Stanley Chennai*, *RGGGH Chennai*) and vice versa.
- Cross-border corridors are mapped across **Puducherry $\leftrightarrow$ Tamil Nadu $\leftrightarrow$ Karnataka $\leftrightarrow$ Kerala $\leftrightarrow$ Andhra Pradesh $\leftrightarrow$ Maharashtra**.

---

# 70. NATIONAL DASHBOARD SCOPE & >500 CASUALTY ESCALATION PROTOCOL

- **National Command Dashboard (`national`)** focuses on:
  1. **Nationwide Medicine Distribution Network Overview & Central Reserve Fulfillment**.
  2. **Major National Disasters (`estimatedAffected > 500`)**: Routine municipal or single-hospital emergencies remain within State and Hospital dashboards; only catastrophic mass-casualty incidents affecting **more than 500 people** escalate to the National Command and Emergency Dashboards.

---

# 71. EXPANDED 33+ ESSENTIAL MEDICINE & VACCINE FORMULARY AND REGIONAL HOSPITALS

1. **33+ Seeded Medicines & Vaccines**:
   - **Antibiotics**: Azithromycin 500mg,Azithromycin Oral Suspension, Amoxycillin + Clavulanic Acid (Augmentin 625mg), Ceftriaxone 1g IV, Meropenem 1g IV, Piperacillin + Tazobactam 4.5g IV, Ciprofloxacin 500mg, Doxycycline 100mg, Metronidazole 500mg IV, Vancomycin 500mg IV, Linezolid 600mg.
   - **Emergency & Critical Care**: Adrenaline 1mg/ml, Noradrenaline 4mg/2ml, Atropine Sulphate, Hydrocortisone 100mg IV, Dexamethasone 4mg, Enoxaparin 40mg, Tranexamic Acid 500mg IV.
   - **IV Fluids & Electrolytes**: Ringer's Lactate 500ml, Normal Saline 0.9% 500ml, Dextrose Normal Saline (DNS), ORS WHO Sachets.
   - **Analgesics, GI, Respiratory, Cardiac & Chronic**: Paracetamol 650mg, Paracetamol IV 1000mg, Diclofenac 75mg, Pantoprazole 40mg IV, Ondansetron 4mg, Salbutamol Nebulizer Solution, Budesonide Respules, Regular Human Insulin, Amlodipine 5mg, Atorvastatin 20mg, Oseltamivir 75mg.
   - **Vaccines & Antidotes**: Anti-Rabies Vaccine (ARV), Tetanus Toxoid (TT), Polyvalent Anti-Snake Venom (ASV), Hepatitis-B Vaccine, Typhoid Conjugate Vaccine.
2. **Expanded Puducherry, Auroville & Multi-State Hospital Network**:
   - **Puducherry UT**: JIPMER Central Medical Institute, Indira Gandhi Govt General Hospital (GH Puducherry), **PIMS (Pondicherry Institute of Medical Sciences, Kalapet)**, **Rajiv Gandhi Govt Women and Children Hospital (RGGWCH)**, **East Coast Hospitals (Private Multi-Specialty)**, **Auroville Health Centre (Aspiration, Auroville Area)**.
   - **Tamil Nadu**: **Santigiri & Quiet Healing Hospital (Auroville Area)**, GH Villupuram Medical College, GH Cuddalore General Hospital, Stanley Medical College Chennai, Rajiv Gandhi Govt General Hospital Chennai.
   - **Karnataka, Andhra Pradesh, Kerala & Maharashtra**: Victoria Hospital (BMCRI) Bengaluru, Bowring & Lady Curzon Hospital Bengaluru, King George Hospital (KGH) Visakhapatnam, GMC Thiruvananthapuram, KEM Hospital Mumbai.

---

# 72. COMPLETE WORKING LOGIC & END-TO-END SYSTEM ARCHITECTURE SUMMARY

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          BHISSM END-TO-END WORKING LOGIC                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ 1. NORMAL SUPPLY CHAIN & VENDOR ENTRY                                               │
│    • Hospitals record direct vendor purchases (Medicines & Vaccines) ->             │
│      Creates FEFO Batch + Updates Stock + Logs Audit Transaction.                   │
│    • Hospitals manually onboard Blood Units, Ambulances (ALS/BLS), Doctors & Beds.  │
│    • Daily Consumption deducts strictly from earliest-expiring FEFO batch.          │
│                                                                                     │
│ 2. CENTRAL -> STATE RESERVE -> HOSPITAL REDISTRIBUTION                              │
│    • Central Command releases stockpile -> Credited to State Medical Reserve Depot. │
│    • State Command checks Hospital-Wise Stock Matrix -> Redistributes from          │
│      State Reserve Depot to individual hospitals in its jurisdiction.               │
│                                                                                     │
│ 3. EMERGENCY COMMAND & INTER-STATE MUTUAL AID CORRIDOR                              │
│    • Incident Declared -> Assigns Primary, Secondary & Supporting Hospitals.        │
│    • If affected > 500 -> Escalates to National Command; otherwise managed at       │
│      State + Adjacent State District Corridor level.                                │
│    • Neighboring/Corridor hospitals offer surplus above their Safety Threshold.     │
│    • Only Authorized Hospitals (Primary/Secondary/Supporting/Requesting) can        │
│      Confirm & Receive dispatched emergency resources.                              │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 73. PRODUCTION FULL-STACK VERCEL DEPLOYMENT ARCHITECTURE

To ensure BHISSM deploys reliably on Vercel as a unified full-stack application while preserving standard local development (`npm run dev`):

1. **Dual Entrypoint Architecture**:
   - **Local Development**: Express listens on port 3001; Vite dev server runs on port 5173 with `/api` proxy.
   - **Vercel Cloud**: Serverless Function at `api/index.ts` automatically serves all `/api/*` endpoints; static React Vite SPA is built into `dist/` and served at the root with SPA rewrites to `/index.html`.
2. **Serverless SQLite Persistence & Cold Start Handling**:
   - Vercel functions execute in a read-only container except for `/tmp`.
   - On cold start, `backend/src/db/connection.ts` eagerly copies the bundled seed database (`backend/prisma/bhissm.db` / `api/bhissm.db`) to `/tmp/bhissm.db`, granting full read/write capabilities for real-time authentication, audits, and transactions.
   - If user count is 0 on cold start, `auth.ts` and `/api/health` automatically run the master seed routine.
3. **Multi-Target Prisma Binary Generation**:
   - `backend/prisma/schema.prisma` configures `binaryTargets = ["native", "rhel-openssl-3.0.x", "rhel-openssl-1.0.x"]` so query engines are bundled for both Windows (local dev) and Linux (Vercel Lambda).
4. **Vercel Configuration (`vercel.json`)**:
   - Configured with `outputDirectory: "dist"`, function bundle inclusion for `backend/prisma/**`, and routing rewrites:
     - `/api` & `/api/(.*)` $\rightarrow$ `/api/index`
     - `/(.*)` $\rightarrow$ `/index.html`


