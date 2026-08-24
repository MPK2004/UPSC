import { Chapter, ByteCard, PYQQuestion } from '../types';

export const CHAPTERS: Chapter[] = [
  {
    id: 'geo-ch03',
    subject: 'Geography',
    book: 'NCERT Class 11 Geography Part 1',
    chapter_number: 3,
    title: 'Interior of the Earth & Seismology',
    description: 'Crust, Mantle, Core, P-Waves, S-Waves, Shadow Zones & Volcanoes',
    total_cards: 6,
    brick_weight: 1
  },
  {
    id: 'geo-ch04',
    subject: 'Geography',
    book: 'NCERT Class 11 Geography Part 1',
    chapter_number: 4,
    title: 'Distribution of Oceans and Continents (Plate Tectonics)',
    description: 'Continental Drift, Seafloor Spreading, Plate Boundaries & Ring of Fire',
    total_cards: 6,
    brick_weight: 1
  },
  {
    id: 'geo-ch08',
    subject: 'Geography',
    book: 'NCERT Class 11 Geography Part 1',
    chapter_number: 8,
    title: 'Composition & Structure of Atmosphere',
    description: 'Troposphere, Stratosphere, Lapse Rate & Ozone Layer',
    total_cards: 5,
    brick_weight: 1
  },
  {
    id: 'geo-ch10',
    subject: 'Geography',
    book: 'NCERT Class 11 Geography Part 1',
    chapter_number: 10,
    title: 'Atmospheric Circulation & Weather Systems',
    description: 'Coriolis Force, Hadly/Ferrel/Polar Cells, Cyclones & Jet Streams',
    total_cards: 6,
    brick_weight: 1
  },
  {
    id: 'env-ch01',
    subject: 'Environment',
    book: 'PMF IAS Environment',
    chapter_number: 1,
    title: 'Ecology, Ecosystems & Trophic Levels',
    description: 'Biotic & Abiotic components, Food Chains, Webs & Ecotones',
    total_cards: 6,
    brick_weight: 1
  },
  {
    id: 'env-ch02',
    subject: 'Environment',
    book: 'PMF IAS Environment',
    chapter_number: 2,
    title: 'Ecological Pyramids & Nutrient Cycles',
    description: 'Energy Pyramid (10% Law), Biomass Pyramid, Carbon & Nitrogen Cycles',
    total_cards: 6,
    brick_weight: 1
  },
  {
    id: 'env-ch05',
    subject: 'Environment',
    book: 'PMF IAS Environment',
    chapter_number: 5,
    title: 'Biodiversity Hotspots & Conservation (IUCN)',
    description: 'Western Ghats, Eastern Himalayas, Indo-Burma, Sundaland & Red Data List',
    total_cards: 6,
    brick_weight: 1
  },
  {
    id: 'env-ch08',
    subject: 'Environment',
    book: 'PMF IAS Environment',
    chapter_number: 8,
    title: 'Climate Change, UNFCCC & Coral Bleaching',
    description: 'Greenhouse Effect, Paris Agreement, Zooxanthellae & Coral Reefs',
    total_cards: 6,
    brick_weight: 1
  }
];

export const BYTE_REEL_CARDS: ByteCard[] = [
  {
    id: 'card-geo-01',
    chapter_id: 'geo-ch03',
    subject: 'Geography',
    title: 'P-Waves vs S-Waves (Seismic Shadow Zones)',
    concept_type: 'Visual Diagram',
    diagram_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Earthquake_wave_shadow_zone.svg/960px-Earthquake_wave_shadow_zone.svg.png',
    bullet_points: [
      '⚡ P-Waves (Primary): Longitudinal waves, fastest, pass through Solid, Liquid & Gas.',
      '🚫 S-Waves (Secondary): Transverse waves, CANNOT pass through liquids (Outer Core).',
      '🗺️ Shadow Zone: S-Wave shadow zone is huge (>105° to 105° everywhere). P-Wave shadow is 105° to 140°.'
    ],
    mnemonic: '💡 Memory Trick: S-Wave = Solid ONLY! Liquid Stops S-Waves!',
    upsc_prelims_tip: 'UPSC Prelims Questioned this in 2023 & 2018! Outer core is proven liquid because S-Waves disappear.'
  },
  {
    id: 'card-geo-02',
    chapter_id: 'geo-ch04',
    subject: 'Geography',
    title: '3 Types of Tectonic Plate Boundaries',
    concept_type: 'Visual Diagram',
    diagram_url: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Tectonic_plate_boundaries.png',
    bullet_points: [
      '↔️ Divergent: Plates move apart → Seafloor spreading (e.g. Mid-Atlantic Ridge).',
      '↗️ Convergent: Subduction zone → Deep ocean trenches & fold mountains (Andes & Himalayas).',
      '🔄 Transform: Plates slide horizontally past each other → San Andreas Fault (No land created/destroyed).'
    ],
    mnemonic: '💡 Memory Hack: Divergent = Divide (New ocean crust), Convergent = Collision (Mountains), Transform = Transform Faults!',
    upsc_prelims_tip: 'Match the following in UPSC 2022 & 2019!'
  },
  {
    id: 'card-geo-03',
    chapter_id: 'geo-ch08',
    subject: 'Geography',
    title: 'Atmosphere Layers & Normal Lapse Rate',
    concept_type: 'Visual Diagram',
    diagram_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Layers_of_the_atmosphere.PNG',
    bullet_points: [
      '🌡️ Troposphere: Thicker at Equator (~18 km) than Poles (~8 km) due to strong convection currents.',
      '📉 Normal Lapse Rate: Temp drops ~6.5°C per 1,000m (1 km) rise in Troposphere.',
      '🛡️ Stratosphere: Contains Ozone (O3) layer. Temperature INCREASES with altitude due to UV absorption!'
    ],
    mnemonic: '💡 Mnemonic: T-S-M-T-E (Troposphere, Stratosphere, Mesosphere, Thermosphere, Exosphere)',
    upsc_prelims_tip: 'Note: Weather phenomena (clouds, rainfall, storms) occur EXCLUSIVELY in the Troposphere.'
  },
  {
    id: 'card-geo-04',
    chapter_id: 'geo-ch10',
    subject: 'Geography',
    title: 'Coriolis Force & Atmospheric Cells',
    concept_type: 'Fact',
    bullet_points: [
      '🌀 Deflection: Right in Northern Hemisphere, Left in Southern Hemisphere (Ferrel\'s Law).',
      '📍 Latitude Rule: Coriolis force is ZERO at Equator and MAXIMUM at the Poles!',
      '⚙️ 3 Global Cells: Hadley Cell (0°-30°), Ferrel Cell (30°-60°), Polar Cell (60°-90°).'
    ],
    mnemonic: '💡 Memory Hack: North = Right turn, South = Left turn! Zero at Equator (no tropical cyclones ON equator)!',
    upsc_prelims_tip: 'Why tropical cyclones don\'t form right at 0°-5° latitude? Because Coriolis force is zero!'
  },
  {
    id: 'card-env-01',
    chapter_id: 'env-ch01',
    subject: 'Environment',
    title: 'Ecotone & Edge Effect in Ecosystems',
    concept_type: 'Fact',
    bullet_points: [
      '🌉 Ecotone: Zone of junction/transition between two diverse ecosystems (e.g. Mangroves between terrestrial & marine).',
      '🦁 Edge Effect: Increased species diversity and population density in the ecotone zone compared to core areas.',
      '🌿 Examples: Marshlands, Estuaries, Grasslands (between forests & deserts).'
    ],
    mnemonic: '💡 Key Concept: Ecotone = Ecological Bridge! Edge Species thrive at borders (e.g. Crowned Eagle, Mangrove Crabs).',
    upsc_prelims_tip: 'Estuaries and Mangroves are classic UPSC favourite ecotones!'
  },
  {
    id: 'card-env-02',
    chapter_id: 'env-ch02',
    subject: 'Environment',
    title: 'Lindeman\'s 10% Law & Inverted Pyramids',
    concept_type: 'Visual Diagram',
    bullet_points: [
      '⚡ 10% Energy Rule: Only ~10% of energy is passed from one trophic level to the next. 90% lost as heat/metabolism.',
      '📐 Always Upright: Pyramid of Energy is ALWAYS upright in ALL ecosystems (Tree, Grassland, Aquatic).',
      '🔄 Inverted Biomass: In open oceans, Phytoplankton biomass is smaller than Zooplankton/Fish → Pyramid of Biomass is INVERTED!'
    ],
    mnemonic: '💡 Golden Rule: Energy Pyramid NEVER inverts! Ocean Biomass ALWAYS inverts!',
    upsc_prelims_tip: 'Direct UPSC Prelims statement question in 2022 and 2015!'
  },
  {
    id: 'card-env-03',
    chapter_id: 'env-ch05',
    subject: 'Environment',
    title: '4 Biodiversity Hotspots of India',
    concept_type: 'Fact',
    bullet_points: [
      '🌱 Criteria (Norman Myers): 1. Must contain ≥ 1,500 endemic vascular plants. 2. Must have lost ≥ 70% primary vegetation.',
      '🏔️ 1. Himalayas: Entire Indian Himalayan region (North-East, J&K, HP, UK).',
      '🌴 2. Western Ghats & Sri Lanka | 3. Indo-Burma (includes North-East India) | 4. Sundaland (Nicobar Islands).'
    ],
    mnemonic: '💡 Mnemonic: H-W-I-S (Himalayas, Western Ghats, Indo-Burma, Sundaland)',
    upsc_prelims_tip: 'Note: Andaman Islands belong to Indo-Burma hotspot; Nicobar Islands belong to Sundaland hotspot!'
  },
  {
    id: 'card-env-04',
    chapter_id: 'env-ch08',
    subject: 'Environment',
    title: 'Coral Bleaching & Zooxanthellae Symbiosis',
    concept_type: 'Visual Diagram',
    bullet_points: [
      '🪸 Mutualism: Corals provide shelter to photosynthetic algae (Zooxanthellae); algae supply 90% of coral nutrients & color.',
      '☀️ Thermal Stress: Sea Surface Temperature rise (>1°C above summer average) triggers expulsion of Zooxanthellae → Corals turn stark white (Bleached).',
      '⚠️ Main Triggers: Climate warming, Ocean Acidification (CO2 uptake lowering pH), Solar radiation & Sedimentation.'
    ],
    mnemonic: '💡 Rule: Bleached Coral is NOT dead instantly! If ocean cools down in time, Zooxanthellae can return.',
    upsc_prelims_tip: 'UPSC 2020 & 2024 Prelims asked all factors leading to bleaching.'
  }
];

export const UPSC_PYQS: PYQQuestion[] = [
  {
    id: 'geo-pyq-01',
    subject: 'Geography',
    chapter_id: 'geo-ch03',
    chapter_name: 'Interior of the Earth & Geomorphology',
    year: '2023',
    question: 'Consider the following statements regarding P-waves and S-waves during seismic events:\n1. P-waves move faster and are the first to arrive at the surface.\n2. S-waves can travel through solid, liquid, and gaseous materials.\n3. Shadow zone of S-waves is much larger than that of P-waves.\n\nWhich of the statements given above is/are correct?',
    options: [
      '1 and 2 only',
      '1 and 3 only',
      '2 and 3 only',
      '1, 2 and 3'
    ],
    correct_index: 1,
    explanation: 'Statement 1 is correct: P-waves (Primary waves) are longitudinal waves and move fastest, arriving first at seismographs. Statement 2 is incorrect: S-waves (Secondary waves) can only travel through SOLIDS. Liquid outer core blocks S-waves, creating an S-wave shadow zone beyond 105° from the epicenter, making Statement 3 correct.',
    difficulty: 'Moderate'
  },
  {
    id: 'geo-pyq-02',
    subject: 'Geography',
    chapter_id: 'geo-ch04',
    chapter_name: 'Distribution of Oceans and Continents (Plate Tectonics)',
    year: '2022',
    question: 'Consider the following pairs of Plate Boundaries and Landforms:\n1. Divergent Boundary — Mid-Atlantic Ridge\n2. Convergent Boundary (Ocean-Continent) — Andes Mountains\n3. Transform Boundary — San Andreas Fault\n\nHow many of the above pairs are correctly matched?',
    options: [
      'Only one pair',
      'Only two pairs',
      'All three pairs',
      'None of the pairs'
    ],
    correct_index: 2,
    explanation: 'All three pairs are correctly matched! 1. Mid-Atlantic ridge is created by seafloor spreading at a divergent boundary. 2. Andes mountains formed by subduction of Nazca oceanic plate beneath South American continental plate. 3. San Andreas fault is a transform fault boundary sliding horizontally.',
    difficulty: 'Moderate'
  },
  {
    id: 'geo-pyq-03',
    subject: 'Geography',
    chapter_id: 'geo-ch08',
    chapter_name: 'Composition and Structure of Atmosphere',
    year: '2021',
    question: 'Which of the following statements is/are correct regarding the Troposphere?\n1. Temperature decreases with increasing altitude in the troposphere at an average normal lapse rate of 6.5°C per 1000m.\n2. The troposphere is thicker at the equator than at the poles due to strong convectional currents.\n\nSelect the correct answer using the code given below:',
    options: [
      '1 only',
      '2 only',
      'Both 1 and 2',
      'Neither 1 nor 2'
    ],
    correct_index: 2,
    explanation: 'Both statements are correct. Normal lapse rate is approx 6.5°C per 1 km altitude rise. Convectional heat transport raises the height of the troposphere up to ~18km at the equator compared to ~8km at the poles.',
    difficulty: 'Easy'
  },
  {
    id: 'geo-pyq-04',
    subject: 'Geography',
    chapter_id: 'geo-ch10',
    chapter_name: 'Atmospheric Circulation and Weather Systems',
    year: '2020',
    question: 'With reference to the Coriolis force, consider the following statements:\n1. It is directly proportional to the angle of latitude.\n2. It acts perpendicular to the pressure gradient force.\n3. It is maximum at the equator and zero at the poles.\n\nWhich of the statements given above are correct?',
    options: [
      '1 and 2 only',
      '2 and 3 only',
      '1 and 3 only',
      '1, 2 and 3'
    ],
    correct_index: 0,
    explanation: 'Statement 1 & 2 are correct. Coriolis force = 2 * omega * v * sin(latitude). Hence it is ZERO at the equator (sin 0° = 0) and MAXIMUM at the poles (sin 90° = 1). Statement 3 is wrong because it reverses equator and poles.',
    difficulty: 'Hard'
  },
  {
    id: 'env-pyq-01',
    subject: 'Environment',
    chapter_id: 'env-ch01',
    chapter_name: 'Ecology, Ecosystems & Trophic Levels',
    year: '2023',
    question: 'Which one of the following is the best description of the term \'Ecosystem\'?\n1. A community of organisms interacting with one another\n2. That part of the Earth which is inhabited by living organisms\n3. A community of organisms together with the environment in which they live\n4. The flora and fauna of a geographical area',
    options: [
      'A community of organisms interacting with one another',
      'That part of the Earth which is inhabited by living organisms',
      'A community of organisms together with the environment in which they live',
      'The flora and fauna of a geographical area'
    ],
    correct_index: 2,
    explanation: 'An ecosystem is a structural and functional unit of biosphere consisting of biotic community (living organisms) interacting with its abiotic environment (air, water, soil) through energy flow and nutrient cycles.',
    difficulty: 'Easy'
  },
  {
    id: 'env-pyq-02',
    subject: 'Environment',
    chapter_id: 'env-ch02',
    chapter_name: 'Biogeochemical Cycles & Ecological Pyramids',
    year: '2022',
    question: 'With reference to ecological pyramids, consider the following statements:\n1. Pyramid of energy is ALWAYS upright in all ecosystems.\n2. Pyramid of biomass in an aquatic (oceanic) ecosystem is inverted.\n\nWhich of the statements given above is/are correct?',
    options: [
      '1 only',
      '2 only',
      'Both 1 and 2',
      'Neither 1 nor 2'
    ],
    correct_index: 2,
    explanation: 'Both statements are correct. 1. Energy is lost as heat at each trophic level (Lindeman\'s 10% law), so energy pyramid is strictly upright. 2. In open oceans, the standing crop biomass of phytoplankton is smaller than that of zooplankton/fish due to rapid turnover, making biomass pyramid inverted.',
    difficulty: 'Moderate'
  },
  {
    id: 'env-pyq-03',
    subject: 'Environment',
    chapter_id: 'env-ch05',
    chapter_name: 'Biodiversity Hotspots & Conservation (IUCN)',
    year: '2021',
    question: 'Which of the following regional zones in India are designated as Biodiversity Hotspots?\n1. Western Ghats\n2. Indo-Burma Region\n3. Eastern Himalayas\n4. Sundaland (Nicobar Islands)\n\nSelect the correct answer using the code given below:',
    options: [
      '1 and 3 only',
      '1, 2 and 3 only',
      '2 and 4 only',
      '1, 2, 3 and 4'
    ],
    correct_index: 3,
    explanation: 'All four regions (Western Ghats & Sri Lanka, Indo-Burma, Eastern Himalayas, and Sundaland covering Andaman & Nicobar) are official Conservation International Biodiversity Hotspots present in India.',
    difficulty: 'Moderate'
  },
  {
    id: 'env-pyq-04',
    subject: 'Environment',
    chapter_id: 'env-ch08',
    chapter_name: 'Climate Change, UNFCCC & Coral Bleaching',
    year: '2020',
    question: 'Which of the following factors cause Coral Bleaching?\n1. Elevated Sea Surface Temperatures (SST)\n2. Ocean Acidification (decreased pH)\n3. Increased Sedimentation and Siltation\n4. Solar Over-exposure and UV Radiation\n\nSelect the correct answer using the code given below:',
    options: [
      '1 and 2 only',
      '1, 2 and 4 only',
      '1 and 3 only',
      '1, 2, 3 and 4'
    ],
    correct_index: 3,
    explanation: 'Coral bleaching occurs when corals expel symbiotic zooxanthellae algae due to thermal stress (elevated SST), solar radiation, ocean acidification, or siltation/pollution.',
    difficulty: 'Moderate'
  }
];
