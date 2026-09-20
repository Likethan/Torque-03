import * as THREE from 'three'
import type { AtmosphereShaderUniforms, AtmosphereShaderOptions } from './atmosphereTypes'

/**
 * ----------------------------------------------------------------------------
 * ATMOSPHERE GLSL SHADERS (Step 8 — WebGL / GLSL Cinematic Atmosphere)
 * ----------------------------------------------------------------------------
 * Shading program creating a restrained, physical automotive studio cyclorama
 * scrim behind the 2003 Honda Accord.
 *
 * Core Principles:
 * 1. The vehicle remains the protagonist — the atmosphere provides spatial depth,
 *    controlled optical falloff, and subtle organic movement.
 * 2. Synchronized directly with Step 7's 4-light studio rig (Key, Rim, Fill, Ambient).
 * 3. Responsive to continuous scroll progress (uProgress), pointer parallax (uPointer),
 *    and scroll velocity momentum (uVelocity).
 * 4. Zero high-frequency grain, TV static, or cyberpunk artifacts.
 */

export const ATMOSPHERE_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;

    vec4 mvPosition = viewMatrix * worldPos;
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`

export const ATMOSPHERE_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying vec3 vNormal;

  // Uniforms passed from useFrame
  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uPointer;
  uniform float uVelocity;
  uniform float uIntensity;
  uniform vec2 uResolution;
  uniform vec3 uKeyLightPos;
  uniform vec3 uKeyLightColor;
  uniform vec3 uRimLightColor;
  uniform vec3 uAmbientColor;
  uniform float uNoiseScale;
  uniform float uFalloffRadius;

  // --------------------------------------------------------------------------
  // High-Performance Smooth 2D Simplex Noise (Zero Texture Lookup)
  // --------------------------------------------------------------------------
  vec3 permute(vec3 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
  }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                       -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                           + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    // 1. Normalized UV coordinates with vertical centering
    vec2 uv = vUv;
    vec2 centeredUv = (uv - 0.5) * 2.0;

    // 2. Optical Center of Illumination (Driven by Key Light direction + subtle pointer parallax)
    // Projected key light X position onto studio backdrop plane:
    float keyNormX = clamp(uKeyLightPos.x * 0.12, -0.6, 0.6);
    float keyNormY = clamp((uKeyLightPos.y - 4.5) * 0.15, -0.4, 0.4);

    // Subtle pointer parallax displacement (max ±0.06 normalized offset, no cursor chasing)
    vec2 pointerOffset = uPointer * vec2(0.06, -0.04);
    vec2 scrimCenter = vec2(keyNormX, keyNormY) + pointerOffset;

    // 3. Velocity Momentum Expansion
    // Fast scrolling momentarily softens and broadens the diffuse softbox beam
    float velMomentum = abs(uVelocity) * 0.18;
    float currentRadius = uFalloffRadius + velMomentum;

    // Distance from the projected studio softbox illumination center
    float dist = length(centeredUv - scrimCenter);

    // 4. Studio Softbox Scrim Falloff (Smooth quadratic falloff simulating a 10m x 4m scrim)
    float scrimGleam = smoothstep(currentRadius, 0.0, dist);
    scrimGleam = pow(scrimGleam, 1.45);

    // 5. Subtle Organic Air Density & Micro-Drift (Low-Frequency Noise)
    // Slow, imperceptible drift over time (rate = 0.08, frozen if reduced-motion)
    vec2 noiseCoord = uv * uNoiseScale + vec2(uTime * 0.015, uTime * 0.008);
    float organicNoise = snoise(noiseCoord) * 0.5 + 0.5;
    float atmosphericVeil = mix(0.88, 1.12, organicNoise);

    // 6. Chapter-Coupled Chromatic Temperature Transitions
    // Harmonizes with Step 7's 5 Canonical Studio Lighting States:
    // - Intro (0.00 - 0.20): Deep obsidian studio void with faint center radiance
    // - Front Reveal (0.20 - 0.45): Warm halogen diffusion behind front quarter
    // - Side Profile (0.45 - 0.70): Cool titanium edge glint across the wedge horizon
    // - Technical Detail (0.70 - 0.88): Neutral CAD slate
    // - Full Vehicle (0.88 - 1.00): Balanced 3-point studio portrait warmth

    vec3 introBaseColor = vec3(0.018, 0.022, 0.028);
    vec3 frontRevealColor = mix(uAmbientColor, uKeyLightColor, 0.42);
    vec3 sideProfileColor = mix(uAmbientColor, uRimLightColor, 0.38);
    vec3 techDetailColor = vec3(0.025, 0.030, 0.038);
    vec3 fullVehicleColor = mix(uAmbientColor, uKeyLightColor, 0.30);

    vec3 studioAtmosphere;
    if (uProgress < 0.25) {
      float t = uProgress / 0.25;
      studioAtmosphere = mix(introBaseColor, frontRevealColor, smoothstep(0.0, 1.0, t));
    } else if (uProgress < 0.50) {
      float t = (uProgress - 0.25) / 0.25;
      studioAtmosphere = mix(frontRevealColor, sideProfileColor, smoothstep(0.0, 1.0, t));
    } else if (uProgress < 0.75) {
      float t = (uProgress - 0.50) / 0.25;
      studioAtmosphere = mix(sideProfileColor, techDetailColor, smoothstep(0.0, 1.0, t));
    } else {
      float t = (uProgress - 0.75) / 0.25;
      studioAtmosphere = mix(techDetailColor, fullVehicleColor, smoothstep(0.0, 1.0, t));
    }

    // 7. Secondary Cool Titanium Horizontal Horizon Glint (Accentuating the Accord's shoulder line)
    float horizonLine = smoothstep(0.35, 0.0, abs(centeredUv.y + 0.15)) * 0.22;
    vec3 rimGlint = uRimLightColor * horizonLine * (0.4 + 0.6 * sin(uProgress * 3.14159));

    // 8. Vertical Studio Edge Vignette (Darkening towards ceiling and floor datum)
    float verticalVignette = smoothstep(1.0, 0.3, abs(centeredUv.y)) * smoothstep(1.0, 0.4, abs(centeredUv.x));

    // 9. Composition
    vec3 finalColor = (studioAtmosphere * scrimGleam * atmosphericVeil) + rimGlint;

    // Density and Opacity (Carefully capped at 0.55 to protect vehicle dominance & text contrast)
    float baseAlpha = mix(0.20, 0.65, scrimGleam) * verticalVignette * uIntensity;

    gl_FragColor = vec4(finalColor, baseAlpha);
  }
`

export function createAtmosphereUniforms(
  options: AtmosphereShaderOptions = {}
): AtmosphereShaderUniforms {
  return {
    uTime: { value: 0.0 },
    uProgress: { value: 0.0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uVelocity: { value: 0.0 },
    uIntensity: { value: options.intensity ?? 0.85 },
    uResolution: { value: new THREE.Vector2(1920, 1080) },
    uKeyLightPos: { value: new THREE.Vector3(5.0, 5.5, 3.0) },
    uKeyLightColor: { value: new THREE.Color('#f5f6f8') },
    uRimLightColor: { value: new THREE.Color('#8ea0b5') },
    uAmbientColor: { value: new THREE.Color('#181b20') },
    uNoiseScale: { value: options.noiseScale ?? 2.8 },
    uFalloffRadius: { value: options.falloffRadius ?? 1.25 },
  }
}
