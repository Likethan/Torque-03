/**
 * ----------------------------------------------------------------------------
 * ACCORD LIGHTING RIG (Step 14 — React Three Fiber + Drei)
 * ----------------------------------------------------------------------------
 * Declarative automotive studio lighting setup:
 * 1. Key Light: High-angle directional softbox light illuminating top and front bevels.
 * 2. Rim Light: Cool titanium accent light highlighting edge silhouettes.
 * 3. Ambient Light: Dark slate fill preventing pure black occlusion.
 * 4. Underside Warm Fill: Localized point light revealing subframe carrier details.
 */

export function AccordLighting() {
  return (
    <group name="STUDIO_LIGHTING_RIG">
      {/* 1. Ambient Baseline Fill */}
      <ambientLight color="#222831" intensity={0.65} />

      {/* 2. Primary High-Angle Key Light */}
      <directionalLight
        position={[4.5, 6.0, 3.5]}
        intensity={1.8}
        color="#f5f6f8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
      />

      {/* 3. Cool Silhouette Rim Light */}
      <directionalLight
        position={[-4.5, 3.5, -3.0]}
        intensity={1.0}
        color="#8ea0b5"
      />

      {/* 4. Underside Warm Bounce Fill */}
      <pointLight
        position={[0, -1.8, 2.5]}
        intensity={0.4}
        distance={12}
        decay={1.5}
        color="#e6dfd8"
      />
    </group>
  )
}
