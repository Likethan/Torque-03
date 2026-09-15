/**
 * ----------------------------------------------------------------------------
 * ACCORD GLSL VERTEX SHADER (Step 18 — Accord Shader System — GLSL)
 * ----------------------------------------------------------------------------
 * Transforms physical 3D mesh vertices into clip space while preserving the
 * exact automotive geometry of the 2003 Honda Accord.
 *
 * Concepts implemented:
 * 1. Model-View-Projection (MVP) transformation pipeline.
 * 2. Normal Matrix transformation: preserves perpendicular surface vectors across non-uniform scaling.
 * 3. View Direction calculation: passes eye-space vector for view-angle Fresnel response.
 * 4. Controlled Vertex Micro-Displacement: microscopic normal deflection driven by uInspection.
 * 5. Coordinate Dual-Space: passes both local position (for moving mechanical parts) and world position.
 */

export const ACCORD_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;

  uniform float uTime;
  uniform float uInspection;
  uniform float uReveal;

  void main() {
    vUv = uv;
    vLocalPosition = position;

    // 1. Normal Transformation:
    // Transforming normals requires the normalMatrix (inverse transpose of modelViewMatrix)
    // to preserve orthogonality across rotations and scale.
    vec3 transformedNormal = normalize(normalMatrix * normal);
    vNormal = transformedNormal;

    // 2. Controlled Subtle Vertex Micro-Displacement (Requirement 7):
    // Extremely subtle normal pulse (~0.002m / 2mm) during active inspection chapters.
    // Preserves physical vehicle silhouette without unnatural distortion.
    float displacement = sin(uTime * 1.8 + position.x * 4.0 + position.z * 3.0) * 0.002 * uInspection;
    vec3 displacedPosition = position + (normal * displacement);

    // 3. World Position Calculation:
    vec4 worldPos = modelMatrix * vec4(displacedPosition, 1.0);
    vWorldPosition = worldPos.xyz;

    // 4. View / Eye Position Calculation:
    // Vector from vertex to camera in view space, used for angle-of-incidence shading
    vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
    vViewPosition = -mvPosition.xyz;

    // 5. Homogeneous Clip-Space Position:
    gl_Position = projectionMatrix * mvPosition;
  }
`
