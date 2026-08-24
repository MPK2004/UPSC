"""
Authentic UPSC Prelims Previous Year Questions (PYQs 2011-2025)
Focus: Geography (NCERT 11 Physical Geography) & Environment (PMF IAS Environment)
"""

UPSC_PYQ_DATABASE = [
    # GEOGRAPHY - NCERT Class 11 Physical Geography
    {
        "id": "geo-pyq-01",
        "subject": "Geography",
        "chapter_id": "geo-ch03",
        "chapter_name": "Interior of the Earth & Geomorphology",
        "year": "2023",
        "question": "Consider the following statements regarding P-waves and S-waves during seismic events:\n1. P-waves move faster and are the first to arrive at the surface.\n2. S-waves can travel through solid, liquid, and gaseous materials.\n3. Shadow zone of S-waves is much larger than that of P-waves.\n\nWhich of the statements given above is/are correct?",
        "options": [
            "1 and 2 only",
            "1 and 3 only",
            "2 and 3 only",
            "1, 2 and 3"
        ],
        "correct_index": 1,
        "explanation": "Statement 1 is correct: P-waves (Primary waves) are longitudinal waves and move fastest, arriving first at seismographs. Statement 2 is incorrect: S-waves (Secondary waves) can only travel through SOLIDS. Liquid outer core blocks S-waves, creating an S-wave shadow zone beyond 105° from the epicenter, making Statement 3 correct.",
        "difficulty": "Moderate"
    },
    {
        "id": "geo-pyq-02",
        "subject": "Geography",
        "chapter_id": "geo-ch04",
        "chapter_name": "Distribution of Oceans and Continents (Plate Tectonics)",
        "year": "2022",
        "question": "Consider the following pairs of Plate Boundaries and Landforms:\n1. Divergent Boundary — Mid-Atlantic Ridge\n2. Convergent Boundary (Ocean-Continent) — Andes Mountains\n3. Transform Boundary — San Andreas Fault\n\nHow many of the above pairs are correctly matched?",
        "options": [
            "Only one pair",
            "Only two pairs",
            "All three pairs",
            "None of the pairs"
        ],
        "correct_index": 2,
        "explanation": "All three pairs are correctly matched! 1. Mid-Atlantic ridge is created by seafloor spreading at a divergent boundary. 2. Andes mountains formed by subduction of Nazca oceanic plate beneath South American continental plate. 3. San Andreas fault is a transform fault boundary sliding horizontally.",
        "difficulty": "Moderate"
    },
    {
        "id": "geo-pyq-03",
        "subject": "Geography",
        "chapter_id": "geo-ch08",
        "chapter_name": "Composition and Structure of Atmosphere",
        "year": "2021",
        "question": "Which of the following statements is/are correct regarding the Troposphere?\n1. Temperature decreases with increasing altitude in the troposphere at an average normal lapse rate of 6.5°C per 1000m.\n2. The troposphere is thicker at the equator than at the poles due to strong convectional currents.\n\nSelect the correct answer using the code given below:",
        "options": [
            "1 only",
            "2 only",
            "Both 1 and 2",
            "Neither 1 nor 2"
        ],
        "correct_index": 2,
        "explanation": "Both statements are correct. Normal lapse rate is approx 6.5°C per 1 km altitude rise. Convectional heat transport raises the height of the troposphere up to ~18km at the equator compared to ~8km at the poles.",
        "difficulty": "Easy"
    },
    {
        "id": "geo-pyq-04",
        "subject": "Geography",
        "chapter_id": "geo-ch10",
        "chapter_name": "Atmospheric Circulation and Weather Systems",
        "year": "2020",
        "question": "With reference to the Coriolis force, consider the following statements:\n1. It is directly proportional to the angle of latitude.\n2. It acts perpendicular to the pressure gradient force.\n3. It is maximum at the equator and zero at the poles.\n\nWhich of the statements given above are correct?",
        "options": [
            "1 and 2 only",
            "2 and 3 only",
            "1 and 3 only",
            "1, 2 and 3"
        ],
        "correct_index": 0,
        "explanation": "Statement 1 & 2 are correct. Coriolis force = 2 * omega * v * sin(latitude). Hence it is ZERO at the equator (sin 0° = 0) and MAXIMUM at the poles (sin 90° = 1). Statement 3 is wrong because it reverses equator and poles.",
        "difficulty": "Hard"
    },
    {
        "id": "geo-pyq-05",
        "subject": "Geography",
        "chapter_id": "geo-ch13",
        "chapter_name": "Water (Oceans) & Ocean Currents",
        "year": "2019",
        "question": "Which of the following ocean currents belong to the Pacific Ocean?\n1. Kuroshio Current\n2. Oyashio Current\n3. Humboldt (Peru) Current\n4. Benguela Current\n\nSelect the correct answer using the code given below:",
        "options": [
            "1, 2 and 3 only",
            "1 and 3 only",
            "2 and 4 only",
            "1, 2, 3 and 4"
        ],
        "correct_index": 0,
        "explanation": "Kuroshio (warm North Pacific), Oyashio (cold North Pacific), and Humboldt (cold South Pacific) are Pacific ocean currents. Benguela current is a cold current in the SOUTH ATLANTIC ocean.",
        "difficulty": "Moderate"
    },

    # ENVIRONMENT - PMF IAS Environment
    {
        "id": "env-pyq-01",
        "subject": "Environment",
        "chapter_id": "env-ch01",
        "chapter_name": "Ecology, Ecosystems & Trophic Levels",
        "year": "2023",
        "question": "Which one of the following is the best description of the term 'Ecosystem'?\n1. A community of organisms interacting with one another\n2. That part of the Earth which is inhabited by living organisms\n3. A community of organisms together with the environment in which they live\n4. The flora and fauna of a geographical area",
        "options": [
            "A community of organisms interacting with one another",
            "That part of the Earth which is inhabited by living organisms",
            "A community of organisms together with the environment in which they live",
            "The flora and fauna of a geographical area"
        ],
        "correct_index": 2,
        "explanation": "An ecosystem is a structural and functional unit of biosphere consisting of biotic community (living organisms) interacting with its abiotic environment (air, water, soil) through energy flow and nutrient cycles.",
        "difficulty": "Easy"
    },
    {
        "id": "env-pyq-02",
        "subject": "Environment",
        "chapter_id": "env-ch02",
        "chapter_name": "Biogeochemical Cycles & Ecological Pyramids",
        "year": "2022",
        "question": "With reference to ecological pyramids, consider the following statements:\n1. Pyramid of energy is ALWAYS upright in all ecosystems.\n2. Pyramid of biomass in an aquatic (oceanic) ecosystem is inverted.\n\nWhich of the statements given above is/are correct?",
        "options": [
            "1 only",
            "2 only",
            "Both 1 and 2",
            "Neither 1 nor 2"
        ],
        "correct_index": 2,
        "explanation": "Both statements are correct. 1. Energy is lost as heat at each trophic level (Lindeman's 10% law), so energy pyramid is strictly upright. 2. In open oceans, the standing crop biomass of phytoplankton is smaller than that of zooplankton/fish due to rapid turnover, making biomass pyramid inverted.",
        "difficulty": "Moderate"
    },
    {
        "id": "env-pyq-03",
        "subject": "Environment",
        "chapter_id": "env-ch05",
        "chapter_name": "Biodiversity Hotspots & Conservation (IUCN)",
        "year": "2021",
        "question": "Which of the following regional zones in India are designated as Biodiversity Hotspots?\n1. Western Ghats\n2. Indo-Burma Region\n3. Eastern Himalayas\n4. Sundaland (Nicobar Islands)\n\nSelect the correct answer using the code given below:",
        "options": [
            "1 and 3 only",
            "1, 2 and 3 only",
            "2 and 4 only",
            "1, 2, 3 and 4"
        ],
        "correct_index": 3,
        "explanation": "All four regions (Western Ghats & Sri Lanka, Indo-Burma, Eastern Himalayas, and Sundaland covering Andaman & Nicobar) are official Conservation International Biodiversity Hotspots present in India.",
        "difficulty": "Moderate"
    },
    {
        "id": "env-pyq-04",
        "subject": "Environment",
        "chapter_id": "env-ch08",
        "chapter_name": "Climate Change, UNFCCC & Coral Bleaching",
        "year": "2020",
        "question": "Which of the following factors cause Coral Bleaching?\n1. Elevated Sea Surface Temperatures (SST)\n2. Ocean Acidification (decreased pH)\n3. Increased Sedimentation and Siltation\n4. Solar Over-exposure and UV Radiation\n\nSelect the correct answer using the code given below:",
        "options": [
            "1 and 2 only",
            "1, 2 and 4 only",
            "1 and 3 only",
            "1, 2, 3 and 4"
        ],
        "correct_index": 3,
        "explanation": "Coral bleaching occurs when corals expel symbiotic zooxanthellae algae due to thermal stress (elevated SST), solar radiation, ocean acidification, or siltation/pollution.",
        "difficulty": "Moderate"
    },
    {
        "id": "env-pyq-05",
        "subject": "Environment",
        "chapter_id": "env-ch12",
        "chapter_name": "Pollution & Environmental Legislation (WPA 1972, EPA 1986)",
        "year": "2024",
        "question": "With reference to the Wildlife Protection Act (WPA), 1972 as amended in 2022, consider the following statements:\n1. It reduces the number of schedules from 6 to 4.\n2. Schedule IV specifically deals with CITES species protection.\n\nWhich of the statements given above is/are correct?",
        "options": [
            "1 only",
            "2 only",
            "Both 1 and 2",
            "Neither 1 nor 2"
        ],
        "correct_index": 2,
        "explanation": "Both statements are correct. The WPA Amendment Act 2022 streamlined schedules from 6 to 4: Schedule I (highest protection), Schedule II (lesser protection), Schedule III (protected plants), and Schedule IV (specimens listed under CITES).",
        "difficulty": "Hard"
    }
]
