# GPT 3D Model: Editorial Portfolio Hero Sculpture

This folder contains a procedural, editable Three.js/GLTF scene for a premium personal portfolio hero sculpture based on the reference image and prompt.

## Outputs

After running `npm run all`, generated files are written to:

- `exports/portfolio-hero-sculpture.glb`
- `exports/portfolio-hero-sculpture.gltf`
- `exports/portfolio-hero-sculpture.metadata.json`
- `renders/portfolio-hero-sculpture-transparent.png`
- `renders/portfolio-hero-sculpture-cream-preview.png`
- `viewer.html`, an interactive GLB viewer with drag/swivel controls
- `site-integration/PortfolioHeroModel.tsx`, a React/Three drop-in component

The GLB/GLTF is the primary site asset. The PNG files are only preview renders. The model keeps the major symbolic elements as separately named object groups so they can be edited or replaced in Blender, Spline, Three.js, or React Three Fiber.

## Scene Contents

- Circular stone pedestal and layered plinths
- Large central hollow stone arch
- Warm translucent glowing cube at the center
- Subtle outer orbit halo and dashed inner orbit ring
- Matte graphite laptop
- Matte black graduation cap with muted orange tassel
- Black professional camera with glass lens
- Brushed metal wrench
- Black fountain pen with brass trim
- Brushed steel chef knife with black handle
- Closed black book with cream pages and orange bookmark
- Muted black-and-white soccer ball
- Glossy black Formula 1-style helmet with muted orange visor

## Rebuild

```bash
npm install --no-package-lock --no-audit --no-fund
npm run all
```

The renderer uses the repo frontend's installed Playwright browser runtime for the PNG export.

## Site Integration

For the actual portfolio hero, use the GLB, not the PNG:

1. Copy `exports/portfolio-hero-sculpture.glb` to `frontend/public/portfolio/portfolio-hero-sculpture.glb`.
2. Add `three` to the frontend dependencies.
3. Use `site-integration/PortfolioHeroModel.tsx` in the hero area.

The component renders with a transparent background, subtle auto-swivel, constrained drag rotation, no labels, and no visible UI.
