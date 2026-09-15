/**
 * ----------------------------------------------------------------------------
 * ACCORD GLSL FRAGMENT SHADER (Step 18 — Accord Shader System — GLSL)
 * ----------------------------------------------------------------------------
 * Shading program for the 2003 Honda Accord engineering archive:
 *
 * 1. Physically Grounded Lighting:
 *    - Directional key light + ambient fill evaluated via Lambertian cosine law.
 * 2. View-Angle Contouring (N · V):
 *    - Glancing angle edge response enhancing stamped sheet metal and cast chamfer
 *      readability without sci-fi bloom or neon outlines.
 * 3. Optical Engineering Inspection Band:
 *    - Localized technical scanning pulse swept along component local coordinates
 *      driven by uInspection and uProgress.
 * 4. Muted Championship Red Accent (#c8102e):
 *    - Technical indexing highlights restricted to the peak inspection boundary.
 * 5. Local-Space Invariance:
 *    - Evaluated in local component coordinates so translating/rotating mechanical
 *      parts (e.g. elevating valve cover) remain physically grounded.
 */

export const ACCORD_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;

  // Uniforms supplied from R3F useFrame loop
  uniform float uTime;
  uniform float uProgress;
  uniform float uInspection;
  uniform float uReveal;
  uniform float uIntensity;
  uniform vec2 uPointer;
  uniform vec2 uResolution;
  uniform vec3 uBaseColor;
  uniform vec3 uEdgeColor;
  uniform vec3 uAccentRed;
  uniform float uRoughness;
  uniform float uMetalness;

  /**
   * Clamps scalar value to [0.0, 1.0].
   */
  float saturate(float val) {
    return clamp(val, 0.0, 1.0);
  }

  /**
   * Remaps a scalar value from one range to another.
   */
  float remap(float value, float inMin, float inMax, float outMin, float outMax) {
    return outMin + (outMax - outMin) * saturate((value - inMin) / (inMax - inMin));
  }

  void main() {
    // 1. Surface Normal & View Vector Normalization
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);

    // 2. Diffuse Directional Key Light (Simulating Studio Key from upper-front-right)
    vec3 keyLightDir = normalize(vec3(0.5, 0.8, 0.6));
    float NdotL = max(dot(N, keyLightDir), 0.0);
    vec3 diffuseLight = vec3(0.18) + vec3(0.82) * NdotL;

    // 3. View-Angle Contouring (N · V) - Requirement 13 & 14
    // Glancing angle factor enhances mechanical edges and machined radii
    float NdotV = saturate(dot(N, V));
    float edgeFactor = pow(1.0 - NdotV, 2.6) * (0.35 + (0.45 * uInspection));

    // 4. Engineering Inspection Band - Requirement 10 & 11
    // Sweeps across the component's local X-axis (span: -1.2 to +1.2m)
    // Normalized local position across X:
    float normLocalX = remap(vLocalPosition.x, -1.2, 1.2, 0.0, 1.0);

    // Target sweep position driven by scroll inspection progression:
    float sweepCenter = remap(uProgress, 0.40, 0.88, 0.0, 1.0);
    float distFromSweep = abs(normLocalX - sweepCenter);

    // Narrow, restrained technical band with smooth falloff
    float inspectionBand = smoothstep(0.12, 0.0, distFromSweep) * uInspection * uIntensity;

    // 5. Muted Red Accent Integration - Requirement 12
    // Red accent line appears at the leading edge of the inspection band
    float leadingEdge = smoothstep(0.04, 0.0, abs(normLocalX - (sweepCenter + 0.02))) * uInspection;
    vec3 accentContribution = uAccentRed * leadingEdge * 0.75;

    // 6. Pointer Parallax Response - Requirement 18
    // Subtle view-angle shift reacting to mouse cursor offset
    vec3 pointerShift = vec3(uPointer.x * 0.15, uPointer.y * 0.15, 0.0);
    float pointerAngle = saturate(dot(N, normalize(V + pointerShift)));
    float pointerHighlight = pow(pointerAngle, 12.0) * 0.12;

    // 7. Shading Composition
    // Base metallic PBR tone
    vec3 surfaceColor = uBaseColor * diffuseLight;

    // Add glancing contour edge definition (satin steel tone)
    surfaceColor = mix(surfaceColor, uEdgeColor, edgeFactor);

    // Add subtle pointer specular
    surfaceColor += vec3(pointerHighlight);

    // Add optical inspection band highlight (technical warm white)
    vec3 inspectionLight = mix(uEdgeColor, vec3(0.96, 0.96, 0.98), 0.55);
    surfaceColor += inspectionLight * inspectionBand * 0.65;

    // Add muted Championship Red accent line along machined parting lines
    surfaceColor += accentContribution;

    // 8. Final Fragment Output
    gl_FragColor = vec4(surfaceColor, 1.0);
  }
`
