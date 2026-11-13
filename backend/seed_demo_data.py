"""
esteRoute Demo Data Seeder (50 Comprehensive Reports)
===================================================
Populates the Supabase database with 50 realistic, pre-configured canal blockage
reports across Metro Cebu waterways (Cebu City, Mandaue City, and boundaries).

Features:
- Spans all 4 priority bands (Urgent, High, Medium, Low).
- Diverse statuses (triaged, scheduled, in_progress, resolved, failed_analysis).
- Mix of authenticated citizen reports and guest submissions.
- Pre-calculated Vision Triage Agent and Meteorological Agent outputs.
- Multiple reports flagged with needs_human_review = True for review demonstration.
- Idempotent: Cleans up any prior 'ER-2026-DEMO...' records before re-inserting.
- Safety check: Requires user confirmation prompt (or pass --yes to bypass).

Usage:
    cd backend
    python seed_demo_data.py
    # or to bypass prompt:
    python seed_demo_data.py --yes
"""

import os
import sys
import argparse
from dotenv import load_dotenv

# Ensure backend directory is in path and load environment variables
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

env_file = os.path.join(backend_dir, ".env")
if os.path.exists(env_file):
    load_dotenv(dotenv_path=env_file)
load_dotenv()

from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Curated CDN images depicting various levels of canal blockage, storm drains, and waterways
SAMPLE_IMAGES = [
    "https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=800&q=80", # plastic bottles choking culvert
    "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80", # heavy trash in canal
    "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=800&q=80", # urban canal debris
    "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80", # drainage inlet debris
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80", # street storm drain
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80", # clear stream
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80", # flooded street runoff
    "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80", # blurred drainage
]

# 50 Detailed Metro Cebu Waterway Sites
DEMO_SPECS = [
    # --- URGENT PRIORITY (Score >= 80) [12 Reports] ---
    {
        "name": "Mahiga Creek at Subangdaku Bridge",
        "lat": 10.3289, "lng": 123.9212, "sev": 95.0, "rpi": 88.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Organic", "Construction"],
        "notes": "Heavy plastic packaging and discarded construction timber completely choking the culvert under Subangdaku Bridge.",
        "rationale": "Severe structural choke point with dense plastic packaging, discarded timber, and silt completely obstructing the culvert barrel, halting stormwater conveyance."
    },
    {
        "name": "Tejero Estero near Blessed Sacrament",
        "lat": 10.3015, "lng": 123.9102, "sev": 92.0, "rpi": 82.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Organic"],
        "notes": "Canal filled with domestic trash and water hyacinths. Water starting to back up towards access road.",
        "rationale": "High-density accumulation of domestic plastic waste and overgrown water hyacinths creating backwater pooling toward the residential access road."
    },
    {
        "name": "Lahug River choke point at Lorega",
        "lat": 10.3115, "lng": 123.9038, "sev": 89.0, "rpi": 85.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Organic", "Silt"],
        "notes": "Large pile of styrofoam and tree branches blocking narrow bridge underpass.",
        "rationale": "Dense mass of styrofoam debris, tree limbs, and sediment trapped beneath the narrow bridge underpass, severely restricting river flow."
    },
    {
        "name": "Tinago Estero near Zulueta St",
        "lat": 10.2988, "lng": 123.9042, "sev": 94.0, "rpi": 78.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Other"],
        "notes": "Solid waste blockage causing foul odor and localized backflow into roadside gutters.",
        "rationale": "Critical accumulation of mixed solid waste and bagged refuse completely blocking the open canal cross-section, causing localized gutter overflow."
    },
    {
        "name": "Guadalupe River Ermita outlet",
        "lat": 10.2915, "lng": 123.8965, "sev": 86.0, "rpi": 84.0,
        "status": "in_progress", "review": False,
        "waste": ["Plastic", "Silt"],
        "notes": "River mouth blocked by accumulated tidal silt and floating plastic crates.",
        "rationale": "Estero mouth heavily impeded by consolidated tidal silt banks and floating plastic crates, severely reducing downstream discharge into the coast."
    },
    {
        "name": "Butuanon River at Paknaan Bridge",
        "lat": 10.3520, "lng": 123.9450, "sev": 91.0, "rpi": 80.0,
        "status": "triaged", "review": False,
        "waste": ["Industrial", "Organic", "Plastic"],
        "notes": "Industrial runoff and organic sludge choking main river canal archway.",
        "rationale": "Industrial runoff residue, heavy sludge, and tangled plastic netting choking more than 85% of the main canal archway clearance."
    },
    {
        "name": "Carreta Creek culvert near M.J. Cuenco",
        "lat": 10.3120, "lng": 123.9145, "sev": 88.0, "rpi": 76.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Construction"],
        "notes": "Concrete debris and bags of waste wedged inside the triple-barrel culvert.",
        "rationale": "Discarded concrete chunks and sacks of construction debris wedged firmly inside the triple-barrel culvert opening."
    },
    {
        "name": "Subangdaku River boundary narrows",
        "lat": 10.3340, "lng": 123.9275, "sev": 85.0, "rpi": 82.0,
        "status": "triaged", "review": False,
        "waste": ["Organic", "Silt"],
        "notes": "Uprooted bamboo clumps anchoring silt dunes across canal width.",
        "rationale": "Uprooted bamboo root clumps anchoring extensive silt dunes across the canal bed, creating an active flow barrier."
    },
    {
        "name": "Colon Street curb inlet near Metro Gaisano",
        "lat": 10.2965, "lng": 123.8995, "sev": 90.0, "rpi": 75.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic"],
        "notes": "Street storm drain grate covered in single-use plastic sacks and food packaging.",
        "rationale": "Street storm drain inlet grates completely blinded by single-use plastic bags, food packaging, and street sweepings."
    },
    {
        "name": "Tipolo Creek near Lopez Jaena St",
        "lat": 10.3250, "lng": 123.9290, "sev": 87.0, "rpi": 80.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Organic"],
        "notes": "Creek narrowed by accumulated household garbage, water stagnant and black.",
        "rationale": "Canal cross-section critically constricted by household garbage and vegetative debris, resulting in stagnant black water pooling."
    },
    {
        "name": "Basak San Nicolas drainage junction",
        "lat": 10.2920, "lng": 123.8780, "sev": 85.0, "rpi": 83.0,
        "status": "in_progress", "review": False,
        "waste": ["Plastic", "Silt"],
        "notes": "Intersection of two box culverts choked with silt and mineral water bottles.",
        "rationale": "Major confluence of two box culverts obstructed by deep sediment deposits and compacted plastic beverage bottles."
    },
    {
        "name": "Kinasang-an Pardo bridge drain",
        "lat": 10.2790, "lng": 123.8610, "sev": 89.0, "rpi": 81.0,
        "status": "triaged", "review": False,
        "waste": ["Organic", "Plastic"],
        "notes": "Dense vegetation and floating plastic bags threatening bridge foundation.",
        "rationale": "Dense organic vegetation and tangled plastic bags massed against the bridge pier, creating an imminent flood damming hazard."
    },

    # --- HIGH PRIORITY (Score 60 - 79.9) [15 Reports] ---
    {
        "name": "Lahug River along T. Padilla",
        "lat": 10.3072, "lng": 123.9056, "sev": 78.0, "rpi": 72.0,
        "status": "in_progress", "review": False,
        "waste": ["Plastic", "Silt"],
        "notes": "Sediment build-up with plastic bottles wedged in the drainage grill along T. Padilla.",
        "rationale": "Substantial sediment buildup and plastic bottles wedged firmly against the drainage intake grill, reducing flow capacity by roughly 75%."
    },
    {
        "name": "Kamputhaw River near Gorordo Bridge",
        "lat": 10.3205, "lng": 123.8980, "sev": 74.0, "rpi": 68.0,
        "status": "triaged", "review": False,
        "waste": ["Organic", "Plastic"],
        "notes": "Trimmings and household waste clinging to bridge piers.",
        "rationale": "Pruned tree branches and domestic trash trapped around bridge support columns, visibly impeding streamflow."
    },
    {
        "name": "Banilad Flyover drainage culvert",
        "lat": 10.3410, "lng": 123.9125, "sev": 76.0, "rpi": 65.0,
        "status": "triaged", "review": False,
        "waste": ["Silt", "Construction"],
        "notes": "Construction gravel washed into roadside drainage during recent downpour.",
        "rationale": "Runoff gravel and silt from nearby construction works filling the roadside drainage basin, threatening flash pooling along the flyover."
    },
    {
        "name": "Pari-an Creek heritage corridor",
        "lat": 10.2995, "lng": 123.9030, "sev": 70.0, "rpi": 74.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Organic"],
        "notes": "Dry season trash washed down into heritage canal zone.",
        "rationale": "Moderate debris accumulation consisting of dry season plastic litter and leaves collecting in the heritage stone canal bed."
    },
    {
        "name": "Mambaling Coastal Canal gate",
        "lat": 10.2885, "lng": 123.8742, "sev": 75.0, "rpi": 66.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Other"],
        "notes": "Plastic wrappers blocking automatic flap gate mechanism.",
        "rationale": "Plastic wrappers and floating debris entangled in the automatic tidal flap gate mechanism, preventing full closure and discharge."
    },
    {
        "name": "Guizo drainage channel near city hall",
        "lat": 10.3295, "lng": 123.9350, "sev": 72.0, "rpi": 70.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Organic"],
        "notes": "Vegetation growth obstructing trapezoidal canal outlet.",
        "rationale": "Dense weed growth and trapped beverage containers constricting the trapezoidal canal outlet."
    },
    {
        "name": "Mabolo Pope John Paul II canal",
        "lat": 10.3180, "lng": 123.9180, "sev": 68.0, "rpi": 75.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic"],
        "notes": "Beverage cups and polystyrene blocking curb intake grates.",
        "rationale": "Discarded plastic beverage cups and expanded polystyrene food boxes choking multiple curb inlet apertures."
    },
    {
        "name": "Sambag II B. Rodriguez culvert",
        "lat": 10.3090, "lng": 123.8890, "sev": 77.0, "rpi": 60.0,
        "status": "triaged", "review": False,
        "waste": ["Organic", "Silt"],
        "notes": "Silt build-up under hospital access crossing.",
        "rationale": "Thick siltation layer and organic sludge accumulated beneath the hospital access road crossing culvert."
    },
    {
        "name": "Labangon Katipunan St canal",
        "lat": 10.3020, "lng": 123.8810, "sev": 71.0, "rpi": 68.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Organic"],
        "notes": "Trash entrapped by low-hanging electrical conduits over canal.",
        "rationale": "Low-hanging utility cables snagging floating plastic bags and organic refuse, creating an overhead debris trap."
    },
    {
        "name": "Casuntingan Creek near AS Fortuna",
        "lat": 10.3450, "lng": 123.9260, "sev": 69.0, "rpi": 72.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Silt"],
        "notes": "Canal sediment depth exceeds 50cm, water flow visibly sluggish.",
        "rationale": "Canal sediment depth exceeds half a meter, with plastic debris visibly slowing stormwater velocity."
    },
    {
        "name": "Bulacao River boundary near Pardo",
        "lat": 10.2750, "lng": 123.8560, "sev": 73.0, "rpi": 64.0,
        "status": "triaged", "review": False,
        "waste": ["Organic", "Construction"],
        "notes": "Tree branches and broken sandbags creating an artificial weir.",
        "rationale": "Tree limbs and damaged sandbags forming an accidental artificial weir across the creek channel."
    },
    {
        "name": "Guadalupe River upstream near Kalunasan",
        "lat": 10.3250, "lng": 123.8790, "sev": 70.0, "rpi": 66.0,
        "status": "triaged", "review": True,
        "waste": ["Silt", "Organic"],
        "notes": "Turbid water with heavy silt. Low confidence flag for officer inspection.",
        "rationale": "High water turbidity and surface glare obscure canal bed depth; flagged for dispatcher confirmation of underlying sediment volume."
    },
    {
        "name": "Carbon Market interior drainage pipe",
        "lat": 10.2930, "lng": 123.8980, "sev": 79.0, "rpi": 55.0,
        "status": "in_progress", "review": False,
        "waste": ["Organic", "Plastic"],
        "notes": "Vegetable waste and discarded plastic crates clogging market sump pit.",
        "rationale": "Market vegetable trimmings and broken plastic crates clogging the main drainage sump pit, creating localized pooling."
    },
    {
        "name": "Looc Mandaue coastal inlet",
        "lat": 10.3220, "lng": 123.9420, "sev": 67.0, "rpi": 73.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Other"],
        "notes": "Flotsam pushed inland by high tide, trapping canal runoff.",
        "rationale": "Tidal flotsam pushed inland during high tide, creating a floating debris barrier at the coastal discharge canal."
    },
    {
        "name": "Tabok Butuanon canal junction",
        "lat": 10.3600, "lng": 123.9380, "sev": 68.0, "rpi": 69.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Organic"],
        "notes": "Dense carpet of water hyacinth preventing normal outflow.",
        "rationale": "Extensive carpet of floating water hyacinths and trapped plastic bottles retarding normal canal discharge into Butuanon River."
    },

    # --- MEDIUM PRIORITY (Score 30 - 59.9) [13 Reports] ---
    {
        "name": "Guadalupe River midstream at V. Rama",
        "lat": 10.3150, "lng": 123.8860, "sev": 55.0, "rpi": 52.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Organic"],
        "notes": "Scattered garbage bags along sloping concrete river wall.",
        "rationale": "Scattered garbage bags and loose debris resting along the sloping concrete river revetment with partial channel intrusion."
    },
    {
        "name": "Carreta Creek along M.J. Cuenco",
        "lat": 10.3140, "lng": 123.9130, "sev": 52.0, "rpi": 48.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic"],
        "notes": "Accumulated weed growth and scattered plastic beverage cups.",
        "rationale": "Weed growth and scattered disposable cups along the channel floor with water maintaining slow but continuous movement."
    },
    {
        "name": "Quiot Pardo roadside canal",
        "lat": 10.2850, "lng": 123.8680, "sev": 48.0, "rpi": 50.0,
        "status": "triaged", "review": False,
        "waste": ["Silt"],
        "notes": "Sandy sediment lining concrete canal bottom, partial reduction in volume.",
        "rationale": "Coarse sand sediment lining the concrete canal invert, reducing cross-sectional hydraulic volume by approximately 45%."
    },
    {
        "name": "Punta Princesa F. Llamas culvert",
        "lat": 10.2980, "lng": 123.8750, "sev": 54.0, "rpi": 42.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Organic"],
        "notes": "Litter accumulation around drainage inlet box.",
        "rationale": "Litter accumulation around the perimeter of the drainage box inlet, presenting a moderate obstruction risk during heavy rainfall."
    },
    {
        "name": "Cabancalan Mandaue drainage line",
        "lat": 10.3510, "lng": 123.9190, "sev": 50.0, "rpi": 45.0,
        "status": "triaged", "review": False,
        "waste": ["Organic"],
        "notes": "Grass cuttings and tree debris obstructing storm water channel.",
        "rationale": "Fresh lawn clippings and organic brush obstructing the center of the trapezoidal stormwater ditch."
    },
    {
        "name": "Tisa Riverbank tributary canal",
        "lat": 10.3040, "lng": 123.8710, "sev": 46.0, "rpi": 48.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic"],
        "notes": "Plastic wrappers and snack containers accumulating in pool.",
        "rationale": "Snack food wrappers and small plastic bottles accumulating in an eddy pool along the canal corner."
    },
    {
        "name": "Sambag I Urgello drainage channel",
        "lat": 10.3070, "lng": 123.8920, "sev": 45.0, "rpi": 40.0,
        "status": "triaged", "review": False,
        "waste": ["Organic", "Silt"],
        "notes": "Moderate siltation along residential alleyway drain.",
        "rationale": "Moderate silt deposition along residential alleyway drain with minor surface leaves."
    },
    {
        "name": "Banilad near Foodland junction",
        "lat": 10.3430, "lng": 123.9150, "sev": 52.0, "rpi": 38.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic"],
        "notes": "Curb intake covered with fallen leaves and shopping bags.",
        "rationale": "Curb intake grate partially masked by fallen leaves and plastic shopping bags."
    },
    {
        "name": "Maguikay Butuanon canal bridge",
        "lat": 10.3470, "lng": 123.9390, "sev": 58.0, "rpi": 35.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Organic"],
        "notes": "Floating litter wedged under utility pipe spanning canal.",
        "rationale": "Floating litter and organic detritus caught beneath an exposed utility crossing pipe."
    },
    {
        "name": "Zapatera creek near Sikatuna St",
        "lat": 10.3060, "lng": 123.9010, "sev": 42.0, "rpi": 45.0,
        "status": "resolved", "review": False,
        "waste": ["Plastic"],
        "notes": "Debris cleared by barangay volunteer cleanup group.",
        "rationale": "Residual plastic litter following recent community cleanup; water velocity is stable and conveying normally."
    },
    {
        "name": "Pari-an heritage culvert outlet",
        "lat": 10.2990, "lng": 123.9025, "sev": 38.0, "rpi": 38.0,
        "status": "resolved", "review": False,
        "waste": ["Organic"],
        "notes": "Canal silt dredged during quarterly maintenance cycle.",
        "rationale": "Canal invert shows moderate siltation typical of dry periods; no major solid waste choke points detected."
    },
    {
        "name": "Guadalupe Sapangdaku upstream inlet",
        "lat": 10.3182, "lng": 123.8820, "sev": 48.0, "rpi": 45.0,
        "status": "triaged", "review": True,
        "waste": ["Silt", "Organic"],
        "notes": "Murky water obscuring canal bed. Flagged for review.",
        "rationale": "Overhanging foliage and shadowed bank obscure the intake throat; low confidence assessment flagged for verification."
    },
    {
        "name": "Inayawan drainage near landfill road",
        "lat": 10.2680, "lng": 123.8620, "sev": 56.0, "rpi": 40.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Other"],
        "notes": "Plastic scrap caught along fence perimeter drain.",
        "rationale": "Windblown plastic packaging caught along the drainage fence line, causing minor backwater accumulation."
    },

    # --- LOW PRIORITY (Score < 30) [7 Reports] ---
    {
        "name": "Colon Drainage Inflow near Osmeña Blvd",
        "lat": 10.2970, "lng": 123.8990, "sev": 20.0, "rpi": 25.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic", "Silt"],
        "notes": "Light street sweepings and small plastic bags near curb inlet.",
        "rationale": "Light street sweepings and small plastic wrappers near curb inlet with stormwater aperture largely unobstructed."
    },
    {
        "name": "Bulacao River boundary bridge",
        "lat": 10.2730, "lng": 123.8540, "sev": 15.0, "rpi": 20.0,
        "status": "resolved", "review": False,
        "waste": ["Organic"],
        "notes": "Few fallen leaves and twigs. Waterway conveyance is clear.",
        "rationale": "Minor fallen leaves and twigs on concrete revetment; water conveyance is completely open and unobstructed."
    },
    {
        "name": "Mambaling Coastal outlet gate",
        "lat": 10.2880, "lng": 123.8730, "sev": 25.0, "rpi": 30.0,
        "status": "triaged", "review": False,
        "waste": ["Plastic"],
        "notes": "Minor floating bottles near coastal gate; flow is unrestricted.",
        "rationale": "Sparse floating plastic bottles near coastal outlet flap; discharge capacity remains clear."
    },
    {
        "name": "SRP Il Corso canal intake",
        "lat": 10.2650, "lng": 123.8810, "sev": 18.0, "rpi": 22.0,
        "status": "resolved", "review": False,
        "waste": ["Organic"],
        "notes": "Seawater tidal channel operating with clean clearance.",
        "rationale": "Tidal drainage channel exhibiting clear flow vectors and clean embankments with no structural blockage."
    },
    {
        "name": "Lahug Gorordo avenue side drain",
        "lat": 10.3260, "lng": 123.8990, "sev": 22.0, "rpi": 28.0,
        "status": "resolved", "review": False,
        "waste": ["Plastic"],
        "notes": "A few beverage cups cleared by street sweeper.",
        "rationale": "A few beverage cups on the drainage grate; storm run-off capacity is unaffected."
    },
    {
        "name": "North Reclamation Area canal culvert",
        "lat": 10.3200, "lng": 123.9250, "sev": 24.0, "rpi": 26.0,
        "status": "resolved", "review": False,
        "waste": ["Plastic", "Organic"],
        "notes": "Regular maintenance finished, water moving freely.",
        "rationale": "Culvert mouth shows recent maintenance clearing; water is flowing freely with minimal residual silt."
    },
    {
        "name": "Consolacion border creek inlet",
        "lat": 10.3680, "lng": 123.9510, "sev": 19.0, "rpi": 20.0,
        "status": "resolved", "review": False,
        "waste": ["Organic"],
        "notes": "Natural river bank with minimal human debris.",
        "rationale": "Natural riverbank with vegetative buffer; minimal human refuse and excellent hydraulic clearance."
    },

    # --- FAILED ANALYSIS / EDGE CASES [3 Reports] ---
    {
        "name": "Banilad junction blurred night submission",
        "lat": 10.3390, "lng": 123.9110, "sev": 0.0, "rpi": 50.0,
        "status": "failed_analysis", "review": True,
        "waste": [],
        "notes": "Night photo with severe camera motion blur. Flagged for manual dispatcher review.",
        "rationale": "Severe camera motion blur and extreme low-light conditions prevent conclusive visual canal triage. Human verification required."
    },
    {
        "name": "Guadalupe alleyway obstructed view",
        "lat": 10.3170, "lng": 123.8840, "sev": 0.0, "rpi": 45.0,
        "status": "failed_analysis", "review": True,
        "waste": [],
        "notes": "Camera lens covered by finger. AI model flagged as unconfident for inspection.",
        "rationale": "Camera lens partially obscured by foreign obstruction; unable to verify waterway boundaries. Flagged for officer inspection."
    },
    {
        "name": "Mandaue reclamation blurred inlet",
        "lat": 10.3250, "lng": 123.9380, "sev": 0.0, "rpi": 55.0,
        "status": "failed_analysis", "review": True,
        "waste": [],
        "notes": "Corrupted image capture flagged for dispatcher verification.",
        "rationale": "Severely corrupted and pixelated image capture; visual features cannot be reliably processed by the neural vision model."
    }
]


def run_seeder(auto_confirm: bool = False):
    print("=" * 65)
    print("           esteRoute 50-Report Demo Seeder (NFR-R1)")
    print("=" * 65)

    if not auto_confirm:
        confirm = input("\nThis will populate 50 realistic demo reports into Supabase. Proceed? [y/N]: ").strip().lower()
        if confirm not in ("y", "yes"):
            print("Operation aborted by user.")
            sys.exit(0)

    print("\n[1/4] Checking existing profiles for realistic reporter attribution...")
    reporter_ids = []
    try:
        prof_res = supabase.table("profiles").select("id, full_name").execute()
        if prof_res.data:
            reporter_ids = [p["id"] for p in prof_res.data]
            print(f"      Found {len(reporter_ids)} existing citizen profile(s) to attribute submissions.")
        else:
            print("      No existing profiles found. All reports will be assigned to guest citizens.")
    except Exception as e:
        print(f"      Profile check skipped: {e}. Defaulting to guest submissions.")

    # 1. Idempotent cleanup of any previous demo batch
    print("\n[2/4] Purging existing demo records (tracking reference prefix: ER-2026-DEMO)...")
    try:
        del_res = supabase.table("reports").delete().like("tracking_reference", "ER-2026-DEMO%").execute()
        print("      Existing demo records purged cleanly.")
    except Exception as e:
        print(f"      Warning during purge: {e}")

    # 2. Insert reports and agent results
    print("\n[3/4] Inserting 50 pre-configured reports with agent results...")
    inserted_count = 0
    band_counts = {"Urgent": 0, "High": 0, "Medium": 0, "Low": 0, "Failed": 0}

    for i, spec in enumerate(DEMO_SPECS, 1):
        tracking_ref = f"ER-2026-DEMO{i:03d}"
        sev = spec["sev"]
        rpi = spec["rpi"]

        # Calculate synthesis priority score (60% severity, 40% rain)
        if spec["status"] == "failed_analysis":
            score = 0.0
            band = "Failed"
        else:
            score = round((0.60 * sev) + (0.40 * rpi), 1)
            if score >= 80.0:
                band = "Urgent"
            elif score >= 60.0:
                band = "High"
            elif score >= 30.0:
                band = "Medium"
            else:
                band = "Low"

        band_counts[band] += 1
        img_url = SAMPLE_IMAGES[i % len(SAMPLE_IMAGES)]

        # Attribute ~50% to registered users, ~50% to guests
        assigned_reporter = reporter_ids[i % len(reporter_ids)] if (reporter_ids and i % 2 == 0) else None

        rep_payload = {
            "tracking_reference": tracking_ref,
            "image_url": img_url,
            "latitude": spec["lat"],
            "longitude": spec["lng"],
            "citizen_notes": spec["notes"],
            "status": spec["status"],
            "priority_score": score,
            "needs_human_review": spec["review"],
            "reporter_id": assigned_reporter
        }

        try:
            res = supabase.table("reports").insert(rep_payload).execute()
            if not res.data:
                continue
            report_id = res.data[0]["report_id"]

            # Insert Vision Agent result
            if spec["status"] != "failed_analysis":
                supabase.table("agent_results").insert({
                    "report_id": report_id,
                    "agent_type": "vision_triage",
                    "result_json": {
                        "report_id": report_id,
                        "is_valid_waterway": True,
                        "rejection_reason": None,
                        "waste_categories": spec["waste"],
                        "blockage_severity_score": sev,
                        "confidence": "low" if spec["review"] else "high",
                        "rationale": spec.get("rationale") or f"Obstruction primarily composed of {', '.join(spec['waste'])} restricting water flow capacity at {spec['name']}."
                    }
                }).execute()

            # Insert Meteorological Agent result
            supabase.table("agent_results").insert({
                "report_id": report_id,
                "agent_type": "meteorological",
                "result_json": {
                    "report_id": report_id,
                    "rain_probability_index": rpi,
                    "expected_total_precipitation_mm": round(rpi * 0.45, 1),
                    "peak_rain_hour": "2026-11-12T16:00:00+08:00",
                    "data_unavailable": False
                }
            }).execute()

            # Insert initial dispatch log
            supabase.table("dispatch_status_log").insert({
                "report_id": report_id,
                "to_status": spec["status"]
            }).execute()

            inserted_count += 1
            if i % 10 == 0 or i == len(DEMO_SPECS):
                print(f"      Seeded {i}/50 reports...")
        except Exception as insert_err:
            print(f"      Error inserting {tracking_ref}: {insert_err}")

    # 3. Summary printout
    print("\n[4/4] Seed Summary:")
    print("=" * 65)
    print(f"  Total Demo Reports Seeded: {inserted_count} / {len(DEMO_SPECS)}")
    print(f"  - Urgent  (>= 80):    {band_counts['Urgent']}")
    print(f"  - High    (60-79.9):  {band_counts['High']}")
    print(f"  - Medium  (30-59.9):  {band_counts['Medium']}")
    print(f"  - Low     (< 30):     {band_counts['Low']}")
    print(f"  - Failed / Edge:      {band_counts['Failed']}")
    print(f"  - Flagged for Review: {sum(1 for s in DEMO_SPECS if s['review'])}")
    print(f"  - Assigned to Users:  {sum(1 for i in range(1, len(DEMO_SPECS)+1) if reporter_ids and i % 2 == 0)}")
    print(f"  - Guest Submissions:  {len(DEMO_SPECS) - sum(1 for i in range(1, len(DEMO_SPECS)+1) if reporter_ids and i % 2 == 0)}")
    print("=" * 65)
    print("Seeding Complete. To remove demo reports at any time, run:")
    print("  python seed_demo_data.py --purge")
    print("=" * 65)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="esteRoute Demo Dataset Generator")
    parser.add_argument("--yes", "-y", action="store_true", help="Bypass confirmation prompt")
    parser.add_argument("--purge", action="store_true", help="Purge all ER-2026-DEMO reports without adding new ones")
    args = parser.parse_args()

    if args.purge:
        print("Purging all demo reports (ER-2026-DEMO%)...")
        supabase.table("reports").delete().like("tracking_reference", "ER-2026-DEMO%").execute()
        print("Purge completed successfully.")
    else:
        run_seeder(auto_confirm=args.yes)

