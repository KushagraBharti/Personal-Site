# Asset Sourcing Checklist

Goal: replace the procedural placeholder props with professional, unbranded, editable models while keeping the current sculpture as the composition blockout.

## Best Free Sources

1. BlenderKit
   - Use inside Blender with the free filter.
   - Best first stop for laptop, camera, pen, knife, book, graduation cap, generic props.
   - Licenses are Royalty Free or CC0; BlenderKit states downloaded assets are available for commercial use.

2. Fab
   - Filter for `Free`, `Standard License`, and source formats like `.blend`, `.fbx`, `.glb`, or `.gltf`.
   - Avoid `Reference Only` assets because they do not provide source-format access.
   - Best first stop for the racing helmet and higher-quality hero objects.

3. Poly Haven
   - CC0, safest license.
   - Best for materials, HDRIs, stone/metal/leather textures, and any matching prop models.

4. ambientCG
   - CC0, safest license.
   - Best for PBR material sets and occasional scanned models.

5. Sketchfab
   - Use only with explicit downloadable licenses.
   - Prefer CC0. CC BY is acceptable if attribution is handled. Avoid NC, ND, SA, Editorial, and branded/trademarked models.

6. CG 3D / CC0 3D
   - CC0/public-domain-style libraries.
   - Good for simple utility props like wrench, knife, book, ball, and fallback geometry.

## Object Search Terms

- Laptop: `generic laptop`, `unbranded laptop`, `notebook computer`, `matte laptop`
- Camera: `generic dslr camera`, `mirrorless camera no logo`, `professional camera unbranded`
- Wrench: `combination wrench`, `spanner`, `brushed metal wrench`
- Pen: `black fountain pen`, `premium pen`, `fountain pen no logo`
- Chef knife: `chef knife black handle`, `kitchen knife`, `unbranded chef knife`
- Book: `closed black book`, `hardcover book`, `book cream pages`
- Soccer ball: `soccer ball`, `football ball`, `muted soccer ball`
- Racing helmet: `racing helmet no logo`, `motorsport helmet unbranded`, `formula helmet generic`
- Graduation cap: `graduation cap`, `mortarboard`, `academic cap`

## License Rules

Prefer, in order:

1. CC0 / Public Domain
2. BlenderKit Royalty Free or Fab Standard License
3. CC BY, only if attribution is acceptable

Avoid:

- Editorial-only assets
- CC BY-NC, because the portfolio is promotional/commercial-adjacent
- CC BY-ND, because we need to edit materials, logos, scale, and geometry
- CC BY-SA, unless the share-alike requirement is acceptable
- branded models, logos, real F1/team liveries, Apple/Dell/Canon/Nikon marks, or visible text
- "personal use only", "reference only", or unclear license pages

## Quality Rules

- Prefer `.blend`, `.fbx`, `.glb`, `.gltf`; `.obj` is acceptable only if materials/textures are included.
- Prefer PBR textures: base color, roughness, metallic, normal.
- Prefer separable materials/parts so black, metal, glass, leather, and orange accents can be unified.
- Keep hero models under control after optimization: decimate hidden/internal details, resize textures to 1K/2K, export final GLB.
- Laptop, camera, and helmet matter most; wrench, pen, knife, book, and soccer ball can be simpler or partially rebuilt in Blender.
