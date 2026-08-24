"""
Rich Pre-loaded ByteReel Cards with Diagrams & Visual Illustrations
Subjects: NCERT Class 11 Geography Part 1 + PMF IAS Environment
"""

CHAPTERS = [
    {
        "id": "geo-ch03",
        "subject": "Geography",
        "book": "NCERT Class 11 Geography Part 1",
        "chapter_number": 3,
        "title": "Interior of the Earth & Seismology",
        "description": "Crust, Mantle, Core, P-Waves, S-Waves, Shadow Zones & Volcanoes",
        "total_cards": 6,
        "brick_weight": 1
    },
    {
        "id": "geo-ch04",
        "subject": "Geography",
        "chapter_number": 4,
        "book": "NCERT Class 11 Geography Part 1",
        "title": "Distribution of Oceans and Continents (Plate Tectonics)",
        "description": "Continental Drift, Seafloor Spreading, Plate Boundaries & Ring of Fire",
        "total_cards": 6,
        "brick_weight": 1
    },
    {
        "id": "geo-ch08",
        "subject": "Geography",
        "chapter_number": 8,
        "book": "NCERT Class 11 Geography Part 1",
        "title": "Composition & Structure of Atmosphere",
        "description": "Troposphere, Stratosphere, Lapse Rate & Ozone Layer",
        "total_cards": 5,
        "brick_weight": 1
    },
    {
        "id": "geo-ch10",
        "subject": "Geography",
        "chapter_number": 10,
        "book": "NCERT Class 11 Geography Part 1",
        "title": "Atmospheric Circulation & Weather Systems",
        "description": "Coriolis Force, Hadly/Ferrel/Polar Cells, Cyclones & Jet Streams",
        "total_cards": 6,
        "brick_weight": 1
    },
    {
        "id": "env-ch01",
        "subject": "Environment",
        "chapter_number": 1,
        "book": "PMF IAS Environment",
        "title": "Ecology, Ecosystems & Trophic Levels",
        "description": "Biotic & Abiotic components, Food Chains, Webs & Ecotones",
        "total_cards": 6,
        "brick_weight": 1
    },
    {
        "id": "env-ch02",
        "subject": "Environment",
        "chapter_number": 2,
        "book": "PMF IAS Environment",
        "title": "Ecological Pyramids & Nutrient Cycles",
        "description": "Energy Pyramid (10% Law), Biomass Pyramid, Carbon & Nitrogen Cycles",
        "total_cards": 6,
        "brick_weight": 1
    },
    {
        "id": "env-ch05",
        "subject": "Environment",
        "chapter_number": 5,
        "book": "PMF IAS Environment",
        "title": "Biodiversity Hotspots & Conservation (IUCN)",
        "description": "Western Ghats, Eastern Himalayas, Indo-Burma, Sundaland & Red Data List",
        "total_cards": 6,
        "brick_weight": 1
    },
    {
        "id": "env-ch08",
        "subject": "Environment",
        "chapter_number": 8,
        "book": "PMF IAS Environment",
        "title": "Climate Change, UNFCCC & Coral Bleaching",
        "description": "Greenhouse Effect, Paris Agreement, Zooxanthellae & Coral Reefs",
        "total_cards": 6,
        "brick_weight": 1
    }
]

BYTE_REEL_CARDS = [
    # GEOGRAPHY REELS
    {
        "id": "card-geo-01",
        "chapter_id": "geo-ch03",
        "subject": "Geography",
        "title": "P-Waves vs S-Waves (Seismic Shadow Zones)",
        "concept_type": "Visual Diagram",
        "diagram_svg": "seismic_shadow_zone",
        "diagram_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Shadow_zone.svg/640px-Shadow_zone.svg.png",
        "bullet_points": [
            "⚡ P-Waves (Primary): Longitudinal waves, fastest, pass through Solid, Liquid & Gas.",
            "🚫 S-Waves (Secondary): Transverse waves, CANNOT pass through liquids (Outer Core).",
            "🗺️ Shadow Zone: S-Wave shadow zone is huge (>105° to 105° everywhere). P-Wave shadow is 105° to 140°."
        ],
        "mnemonic": "💡 Memory Trick: S-Wave = Solid ONLY! Liquid Stops S-Waves!",
        "upsc_prelims_tip": "UPSC Prelims Questioned this in 2023 & 2018! Outer core is proven liquid because S-Waves disappear."
    },
    {
        "id": "card-geo-02",
        "chapter_id": "geo-ch04",
        "subject": "Geography",
        "title": "3 Types of Tectonic Plate Boundaries",
        "concept_type": "Visual Diagram",
        "diagram_svg": "plate_boundaries",
        "diagram_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Tectonic_plate_boundaries.png/640px-Tectonic_plate_boundaries.png",
        "bullet_points": [
            "↔️ Divergent: Plates move apart → Seafloor spreading (e.g. Mid-Atlantic Ridge).",
            "↗️ Convergent: Subduction zone → Deep ocean trenches & fold mountains (Andes & Himalayas).",
            "🔄 Transform: Plates slide horizontally past each other → San Andreas Fault (No land created/destroyed)."
        ],
        "mnemonic": "💡 Memory Hack: Divergent = Divide (New ocean crust), Convergent = Collision (Mountains), Transform = Transform Faults!",
        "upsc_prelims_tip": "Match the following in UPSC 2022 & 2019!"
    },
    {
        "id": "card-geo-03",
        "chapter_id": "geo-ch08",
        "subject": "Geography",
        "title": "Atmosphere Layers & Normal Lapse Rate",
        "concept_type": "Visual Diagram",
        "diagram_svg": "atmosphere_layers",
        "diagram_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Layers_of_the_atmosphere.png/640px-Layers_of_the_atmosphere.png",
        "bullet_points": [
            "🌡️ Troposphere: Thicker at Equator (~18 km) than Poles (~8 km) due to strong convection currents.",
            "📉 Normal Lapse Rate: Temp drops ~6.5°C per 1,000m (1 km) rise in Troposphere.",
            "🛡️ Stratosphere: Contains Ozone (O3) layer. Temperature INCREASES with altitude due to UV absorption!"
        ],
        "mnemonic": "💡 Mnemonic: T-S-M-T-E (Troposphere, Stratosphere, Mesosphere, Thermosphere, Exosphere)",
        "upsc_prelims_tip": "Note: Weather phenomena (clouds, rainfall, storms) occur EXCLUSIVELY in the Troposphere."
    },
    {
        "id": "card-geo-04",
        "chapter_id": "geo-ch10",
        "subject": "Geography",
        "title": "Coriolis Force & Atmospheric Cells",
        "concept_type": "Fact",
        "diagram_svg": "coriolis_cells",
        "bullet_points": [
            "🌀 Deflection: Right in Northern Hemisphere, Left in Southern Hemisphere (Ferrel's Law).",
            "📍 Latitude Rule: Coriolis force is ZERO at Equator and MAXIMUM at the Poles!",
            "⚙️ 3 Global Cells: Hadley Cell (0°-30°), Ferrel Cell (30°-60°), Polar Cell (60°-90°)."
        ],
        "mnemonic": "💡 Memory Hack: North = Right turn, South = Left turn! Zero at Equator (no tropical cyclones ON equator)!",
        "upsc_prelims_tip": "Why tropical cyclones don't form right at 0°-5° latitude? Because Coriolis force is zero!"
    },

    # ENVIRONMENT REELS
    {
        "id": "card-env-01",
        "chapter_id": "env-ch01",
        "subject": "Environment",
        "title": "Ecotone & Edge Effect in Ecosystems",
        "concept_type": "Fact",
        "diagram_svg": "ecotone_diagram",
        "bullet_points": [
            "🌉 Ecotone: Zone of junction/transition between two diverse ecosystems (e.g. Mangroves between terrestrial & marine).",
            "🦁 Edge Effect: Increased species diversity and population density in the ecotone zone compared to core areas.",
            "🌿 Examples: Marshlands, Estuaries, Grasslands (between forests & deserts)."
        ],
        "mnemonic": "💡 Key Concept: Ecotone = Ecological Bridge! Edge Species thrive at borders (e.g. Crowned Eagle, Mangrove Crabs).",
        "upsc_prelims_tip": "Estuaries and Mangroves are classic UPSC favourite ecotones!"
    },
    {
        "id": "card-env-02",
        "chapter_id": "env-ch02",
        "subject": "Environment",
        "title": "Lindeman's 10% Law & Inverted Pyramids",
        "concept_type": "Visual Diagram",
        "diagram_svg": "energy_pyramid",
        "bullet_points": [
            "⚡ 10% Energy Rule: Only ~10% of energy is passed from one trophic level to the next. 90% lost as heat/metabolism.",
            "📐 Always Upright: Pyramid of Energy is ALWAYS upright in ALL ecosystems (Tree, Grassland, Aquatic).",
            "🔄 Inverted Biomass: In open oceans, Phytoplankton biomass is smaller than Zooplankton/Fish → Pyramid of Biomass is INVERTED!"
        ],
        "mnemonic": "💡 Golden Rule: Energy Pyramid NEVER inverts! Ocean Biomass ALWAYS inverts!",
        "upsc_prelims_tip": "Direct UPSC Prelims statement question in 2022 and 2015!"
    },
    {
        "id": "card-env-03",
        "chapter_id": "env-ch05",
        "subject": "Environment",
        "title": "4 Biodiversity Hotspots of India",
        "concept_type": "Fact",
        "diagram_svg": "hotspots_map",
        "bullet_points": [
            "🌱 Criteria (Norman Myers): 1. Must contain ≥ 1,500 endemic vascular plants. 2. Must have lost ≥ 70% primary vegetation.",
            "🏔️ 1. Himalayas: Entire Indian Himalayan region (North-East, J&K, HP, UK).",
            "🌴 2. Western Ghats & Sri Lanka | 3. Indo-Burma (includes North-East India) | 4. Sundaland (Nicobar Islands)."
        ],
        "mnemonic": "💡 Mnemonic: H-W-I-S (Himalayas, Western Ghats, Indo-Burma, Sundaland)",
        "upsc_prelims_tip": "Note: Andaman Islands belong to Indo-Burma hotspot; Nicobar Islands belong to Sundaland hotspot!"
    },
    {
        "id": "card-env-04",
        "chapter_id": "env-ch08",
        "subject": "Environment",
        "title": "Coral Bleaching & Zooxanthellae Symbiosis",
        "concept_type": "Visual Diagram",
        "diagram_svg": "coral_bleaching",
        "bullet_points": [
            "🪸 Mutualism: Corals provide shelter to photosynthetic algae (Zooxanthellae); algae supply 90% of coral nutrients & color.",
            "☀️ Thermal Stress: Sea Surface Temperature rise (>1°C above summer average) triggers expulsion of Zooxanthellae → Corals turn stark white (Bleached).",
            "⚠️ Main Triggers: Climate warming, Ocean Acidification (CO2 uptake lowering pH), Solar radiation & Sedimentation."
        ],
        "mnemonic": "💡 Rule: Bleached Coral is NOT dead instantly! If ocean cools down in time, Zooxanthellae can return.",
        "upsc_prelims_tip": "UPSC 2020 & 2024 Prelims asked all factors leading to bleaching."
    }
]
