import type {
  VehicleComponentId,
  VehicleComponentDetail,
  DetailHotspotConfig,
} from './vehicleTypes'

/**
 * ----------------------------------------------------------------------------
 * VEHICLE DETAIL REGISTRY (Step 13 — Advanced Automotive Detail Systems)
 * ----------------------------------------------------------------------------
 * Audited registry of 20 authentic 2003 Honda Accord components.
 * Separates data structure from rendering logic per Requirement 2.
 */

export const VEHICLE_COMPONENT_REGISTRY: Record<VehicleComponentId, VehicleComponentDetail> = {
  BODY_MAIN: {
    id: 'BODY_MAIN',
    name: 'Unibody Architecture',
    category: 'BODY',
    code: 'UB-7TH-GEN',
    spec: 'High-Tensile Steel Monocoque // Torsional Rigidity +27%',
    description:
      'Computer-engineered unibody platform featuring integrated floor pan rails and boxed rocker sills, providing exceptional acoustic isolation and crash energy dispersion.',
    materialToken: 'satinSilverMetallic',
    anchorPosition: [0.0, 0.48, 0.0],
    studyId: 'BODYLINE_STUDY',
  },
  BODY_HOOD: {
    id: 'BODY_HOOD',
    name: 'Aerodynamic Hood',
    category: 'AERODYNAMICS',
    code: 'HD-623M-AERO',
    spec: 'Sculpted Center Spine // 0.30 Cd Drag Coefficient Reduction',
    description:
      'Long tapered engine hood with dual aerodynamic relief creases channeling high-speed airflow over the acoustic windshield wipers.',
    materialToken: 'satinSilverMetallic',
    anchorPosition: [0.0, 0.64, 1.35],
    studyId: 'FRONT_STUDY',
  },
  BODY_ROOF: {
    id: 'BODY_ROOF',
    name: 'Greenhouse Roof Arch',
    category: 'BODY',
    code: 'RF-ARCH-PBR',
    spec: 'Laser-Braze Roof Seam // Seamless Flush Header Integration',
    description:
      'Sweeping roofline designed to maintain rear headroom while guiding aerodynamic boundary layers cleanly onto the rear decklid lip.',
    materialToken: 'satinSilverMetallic',
    anchorPosition: [0.0, 1.08, -0.15],
    studyId: 'GLASS_STUDY',
  },
  BODY_TRUNK: {
    id: 'BODY_TRUNK',
    name: 'Integrated Decklid',
    category: 'BODY',
    code: 'DK-LIP-AERO',
    spec: 'High-Mount Decklid // 411 Liters Cargo Volume Boundary',
    description:
      'Subtly upturned aerodynamic trunk lip generating rear downforce stability at highway cruising speeds.',
    materialToken: 'satinSilverMetallic',
    anchorPosition: [0.0, 0.72, -1.55],
    studyId: 'REAR_LIGHT_STUDY',
  },
  DOORS_FLANK: {
    id: 'DOORS_FLANK',
    name: 'Wedge Shoulder Flank',
    category: 'BODY',
    code: 'FL-WEDGE-CR',
    spec: 'Continuous Character Crease // Triple-Seal Acoustic Dampers',
    description:
      'Distinctive rising shoulder character line running from the front wheel arch through the flush door handles into the jewel taillights.',
    materialToken: 'satinSilverMetallic',
    anchorPosition: [-0.91, 0.52, 0.1],
    studyId: 'BODYLINE_STUDY',
  },
  FRONT_BUMPER: {
    id: 'FRONT_BUMPER',
    name: 'Front Fascia & Air Dam',
    category: 'AERODYNAMICS',
    code: 'FB-DAM-03',
    spec: 'Integrated Polypropylene Fascia // Dual Lower Cooling Ducts',
    description:
      'Flush wrap-around bumper cover guiding cooling air to the transmission cooler and aluminum radiator.',
    materialToken: 'satinSilverMetallic',
    anchorPosition: [0.0, 0.22, 2.32],
    studyId: 'FRONT_STUDY',
  },
  REAR_BUMPER: {
    id: 'REAR_BUMPER',
    name: 'Rear Bumper Fascia',
    category: 'BODY',
    code: 'RB-WRAP-03',
    spec: 'Contoured Diffuser Underside // Dual Exhaust Cutouts',
    description:
      'Aerodynamically rounded rear bumper cover reducing rear vortex wake and framing the dual chrome exhaust tips.',
    materialToken: 'satinSilverMetallic',
    anchorPosition: [0.0, 0.32, -2.32],
    studyId: 'REAR_LIGHT_STUDY',
  },
  FRONT_GRILLE: {
    id: 'FRONT_GRILLE',
    name: 'Pentagonal Chrome Grille',
    category: 'AERODYNAMICS',
    code: 'GR-CHEV-CHROME',
    spec: 'Electroplated Chrome Surround // Fine Mesh Inner Intake',
    description:
      'Signature Honda 7th-generation pentagonal chevron grille with a prominent chrome H-emblem and dark anodized honeycomb mesh.',
    materialToken: 'polishedChrome',
    anchorPosition: [0.0, 0.45, 2.36],
    studyId: 'GRILLE_STUDY',
  },
  HEADLIGHTS: {
    id: 'HEADLIGHTS',
    name: 'Multi-Reflector Headlamps',
    category: 'LIGHTING',
    code: 'HL-REF-DUAL',
    spec: 'Fluted Polycarbonate Lens // 55W/60W Halogen Projectors',
    description:
      'Aerodynamic wrap-around headlamp housings with precision parabolic chrome reflectors offering wide-beam highway illumination.',
    materialToken: 'headlightLens',
    anchorPosition: [-0.68, 0.48, 2.30],
    studyId: 'HEADLIGHT_STUDY',
  },
  TAILLIGHTS: {
    id: 'TAILLIGHTS',
    name: 'Jewel Taillight Clusters',
    category: 'LIGHTING',
    code: 'TL-JEWEL-RUBY',
    spec: 'Dual-Chamber Optical Ruby Prisms // Amber Turn Integrators',
    description:
      'Horizontal jewel taillights with faceted internal retro-reflectors ensuring high visibility and crisp rear silhouette definition.',
    materialToken: 'taillightJewel',
    anchorPosition: [-0.72, 0.52, -2.34],
    studyId: 'REAR_LIGHT_STUDY',
  },
  WHEELS: {
    id: 'WHEELS',
    name: '16" 7-Spoke Alloy Wheels',
    category: 'CHASSIS',
    code: 'WH-16X6.5J-AL',
    spec: 'Cast Aluminum Alloy // 5x114.3 Lug Pattern // 55mm Offset',
    description:
      'Lightweight 7-spoke cast alloy wheels engineered for reduced unsprung rotating mass and optimal brake ventilation.',
    materialToken: 'satinSteel',
    anchorPosition: [-0.82, 0.32, 1.37],
    studyId: 'WHEEL_STUDY',
  },
  TIRES: {
    id: 'TIRES',
    name: '205/60R16 Radial Tires',
    category: 'CHASSIS',
    code: 'TR-205-60R16',
    spec: 'All-Season Silica Compound // Asymmetric Water Evacuation Tread',
    description:
      'Tuned radial tires engineered for low rolling resistance, confident wet asphalt grip, and minimal highway road noise.',
    materialToken: 'tireRubber',
    anchorPosition: [-0.82, 0.32, 1.37],
    studyId: 'WHEEL_STUDY',
  },
  BRAKES: {
    id: 'BRAKES',
    name: 'Ventilated Front Disc Rotors',
    category: 'CHASSIS',
    code: 'BR-11.1-VENT',
    spec: '282mm (11.1") Ventilated Cast Steel Rotors // Internal Radial Vanes',
    description:
      'High-capacity ventilated front brake discs expelling heat under severe deceleration to maintain fade-resistant pedal feel.',
    materialToken: 'brakeRotor',
    anchorPosition: [-0.76, 0.32, 1.37],
    studyId: 'BRAKE_STUDY',
  },
  BRAKE_CALIPERS: {
    id: 'BRAKE_CALIPERS',
    name: 'Single-Piston Floating Calipers',
    category: 'CHASSIS',
    code: 'CL-57MM-CAST',
    spec: '57mm Hydraulic Piston // High-Stiffness Nodular Iron Body',
    description:
      'Stiff nodular iron caliper housings coupled with ceramic compound pads, delivering progressive stopping feedback.',
    materialToken: 'brakeCaliper',
    anchorPosition: [-0.76, 0.44, 1.37],
    studyId: 'BRAKE_STUDY',
  },
  EXHAUST: {
    id: 'EXHAUST',
    name: 'Dual Chrome Exhaust Tips',
    category: 'POWERTRAIN',
    code: 'EX-DUAL-CHR',
    spec: 'Twin Stainless Steel Resonated Tips // Free-Flowing Mufflers',
    description:
      'Polished dual exhaust finishers denoting the 3.0L V6 powertrain and tuned for a refined acoustic signature.',
    materialToken: 'polishedChrome',
    anchorPosition: [-0.55, 0.16, -2.40],
    studyId: 'REAR_LIGHT_STUDY',
  },
  GLASS: {
    id: 'GLASS',
    name: 'Acoustic Tinted Greenhouse',
    category: 'CABIN',
    code: 'GL-AERO-TINT',
    spec: 'Acoustic Laminated Windshield // Solar Green Tint // 70% UV Cut',
    description:
      'High-precision laminated automotive glass with acoustic interlayers reducing wind turbulence and cabin thermal load.',
    materialToken: 'automotiveGlass',
    anchorPosition: [0.0, 0.86, 0.95],
    studyId: 'GLASS_STUDY',
  },
  MIRRORS: {
    id: 'MIRRORS',
    name: 'Aerodynamic Side Mirrors',
    category: 'AERODYNAMICS',
    code: 'MR-AERO-FOLD',
    spec: 'Wind-Tunnel Sculpted Housings // Convex Aspherical Glass',
    description:
      'Body-colored dual remote mirrors shaped to minimize A-pillar air buffeting and extend side visibility.',
    materialToken: 'satinSilverMetallic',
    anchorPosition: [-0.92, 0.72, 0.88],
    studyId: 'GLASS_STUDY',
  },
  INTERIOR_CABIN: {
    id: 'INTERIOR_CABIN',
    name: 'Cockpit Architecture',
    category: 'CABIN',
    code: 'IN-7TH-GEN-CKPT',
    spec: 'Driver-Centric Ergonomics // LED Backlit Instrument Cluster',
    description:
      'Meticulously arranged interior cockpit featuring a 3-spoke steering wheel, metallic shift gate, and illuminated gauges.',
    materialToken: 'satinSteel',
    anchorPosition: [-0.35, 0.75, 0.25],
    studyId: 'INTERIOR_STUDY',
  },
  POWERTRAIN: {
    id: 'POWERTRAIN',
    name: 'J30A4 3.0L VTEC V6',
    category: 'POWERTRAIN',
    code: 'ENG-J30A4-V6',
    spec: '240 HP @ 6,250 RPM // 287 Nm Torque // SOHC 24-Valve VTEC',
    description:
      '60-degree aluminum alloy block with forged crankshaft and dual-stage Variable Valve Timing and Lift Electronic Control.',
    materialToken: 'castMetal',
    anchorPosition: [0.0, 0.45, 1.35],
    studyId: 'FRONT_STUDY',
  },
  CHASSIS: {
    id: 'CHASSIS',
    name: 'Double-Wishbone Suspension',
    category: 'CHASSIS',
    code: 'CH-DW-HYDRO',
    spec: 'Hydroformed Front Subframe Cradle // Independent Multi-Link Rear',
    description:
      'Honda hallmark double-wishbone front suspension with unequal-length A-arms maintaining precise camber angles during cornering.',
    materialToken: 'castMetal',
    anchorPosition: [0.0, 0.15, 1.25],
    studyId: 'WHEEL_STUDY',
  },
}

export const DETAIL_HOTSPOTS: DetailHotspotConfig[] = [
  {
    id: 'HOTSPOT_HEADLIGHT',
    componentId: 'HEADLIGHTS',
    studyId: 'HEADLIGHT_STUDY',
    label: 'HEADLIGHT OPTIC',
    shortSpec: 'DUAL BEAM // POLYCARBONATE',
    worldPosition: [-0.68, 0.48, 2.30],
  },
  {
    id: 'HOTSPOT_GRILLE',
    componentId: 'FRONT_GRILLE',
    studyId: 'GRILLE_STUDY',
    label: 'CHEVRON GRILLE',
    shortSpec: 'CHROME CHEVRON // 0.30 Cd',
    worldPosition: [0.0, 0.45, 2.36],
  },
  {
    id: 'HOTSPOT_WHEEL',
    componentId: 'WHEELS',
    studyId: 'WHEEL_STUDY',
    label: '16" ALLOY WHEEL',
    shortSpec: '7-SPOKE // 205/60R16',
    worldPosition: [-0.85, 0.32, 1.37],
  },
  {
    id: 'HOTSPOT_BRAKE',
    componentId: 'BRAKES',
    studyId: 'BRAKE_STUDY',
    label: 'VENTILATED DISC',
    shortSpec: '282MM VENTILATED ROTOR',
    worldPosition: [-0.74, 0.32, 1.37],
  },
  {
    id: 'HOTSPOT_BODYLINE',
    componentId: 'DOORS_FLANK',
    studyId: 'BODYLINE_STUDY',
    label: 'SHOULDER CREASE',
    shortSpec: 'NH-623M SATIN CLEARCOAT',
    worldPosition: [-0.91, 0.52, 0.1],
  },
  {
    id: 'HOTSPOT_TAILLIGHT',
    componentId: 'TAILLIGHTS',
    studyId: 'REAR_LIGHT_STUDY',
    label: 'JEWEL TAILLIGHT',
    shortSpec: 'OPTICAL RUBY PRISMS',
    worldPosition: [-0.72, 0.52, -2.34],
  },
  {
    id: 'HOTSPOT_MIRROR',
    componentId: 'MIRRORS',
    studyId: 'GLASS_STUDY',
    label: 'AERO SIDE MIRROR',
    shortSpec: 'CONVEX ASPHERICAL GLASS',
    worldPosition: [-0.92, 0.72, 0.88],
  },
  {
    id: 'HOTSPOT_INTERIOR',
    componentId: 'INTERIOR_CABIN',
    studyId: 'INTERIOR_STUDY',
    label: 'COCKPIT CABIN',
    shortSpec: 'BACKLIT INSTRUMENT CLUSTER',
    worldPosition: [-0.35, 0.75, 0.25],
  },
]

export const VEHICLE_REGISTRY = VEHICLE_COMPONENT_REGISTRY
