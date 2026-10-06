# RavenLab QR 3D

Arabic browser tool to create QR plates and merge QR codes into the underside of an uploaded STL. No file or URL is uploaded for conversion. No paid API is used.

## Upload a model

1. Select **QR أسفل مجسّم STL** and choose a binary or ASCII STL (up to 15 MB / 300,000 triangles).
2. Enter an HTTP(S) URL. Set the QR size including its four-module quiet zone, depth, and X/Y position.
3. Keep **ملء الفتحات داخل سماكة المجسّم** enabled to close holes inside the existing thickness. The fill starts at the original bottom plane and extends inward by at least 0.8 mm, or QR depth + 0.4 mm. No external plate is added.
4. Default: flush two-color QR. Both parts share the same bottom plane at Z=0. Download a 3MF assembly or a ZIP containing two aligned STL parts. Import them as ONE multipart object, keep coordinates, and assign light/dark filaments in the slicer. Engraved and raised modes remain available as single STL exports.

The uploaded shape is not scaled. It is centered in X/Y and its minimum Z is moved to zero before processing. Bottom means the minimum-Z surface in the uploaded file. Flush mode preserves overall height. Without internal hole filling, the entire QR footprint must fit over a flat solid region; the engine rejects unsupported placement and insufficient material below engraving.

The supplied user model is not included in this public repository. The default suggested QR size is reduced to fit smaller models. The separate plate mode remains 40 × 40 mm.

## Printing

Flush 3MF includes two base material colors; slicers may require manual filament assignment. Printing two colors in the same layer requires suitable multi-material handling. No single-color STL can retain a purely flush color pattern.

STL coordinates use millimetres. Import at 100% scale. STL has no color. Use dark QR modules against a light background, for example by filling engraved recesses. Test scanning after printing. For raised undersides, choose print orientation and supports in your slicer. A closed mesh does not guarantee every printer can resolve small modules.

## Hosting and local use

GitHub Pages: deploy `main` / root. No build step required. All runtime dependencies are vendored.

The STL merging mode requires a web server because it uses module workers and WebAssembly. For local use run `python -m http.server 8765` in this folder and open `http://localhost:8765`. Opening `index.html` directly as `file://` is not supported for STL merging.

## Rights and third-party licenses

© RavenLab. All rights reserved for original application code and design.

- `qrcode.js`: Kazuhiko Arase, MIT license (original copyright header retained).
- `vendor/manifold.js` and `vendor/manifold.wasm`: Manifold 3.5.4, Apache-2.0. See `vendor/LICENSE`.

Boolean merging runs in a worker. Source STL dimensions, single-body output, engraving/embossing, placement rejection, and decoding a QR reconstructed from exported STL geometry were checked using the supplied sample and synthetic solids. Physical printing has not been tested.


�����: ��� ������� ��� ���� ����� ������� ������� �� ���� ������� ��� ����� ������ �� ����� ��������. ���� �� ��� ���� ����� ����� ������� ���� ���� �������.
