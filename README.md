# engine2learn

Static research site for Juan Felipe Calderón Maureira: flexibility, compliance and adaptivity in learning design.
No build step. Open `index.html`, or serve the folder (`python -m http.server`).

## Structure

| File | What it holds |
|---|---|
| `index.html` | All content in English (the default language), including the animated stage (inline SVG) |
| `js/i18n.js` | Spanish translations, keyed by `data-i18n` attributes in the HTML |
| `js/main.js` | Language switch, scroll-driven animation engine, paper filter, nav |
| `css/style.css` | Design system: white ground, one soft typeface (DM Sans), pastel colour fields, no borders, shadows or gradients. Blue = flexibility, coral = compliance, amber = adaptivity |
| `assets/` | Portrait and favicon |

## Things to edit

- **Email, LinkedIn, Instagram**: search `index.html` for `juan.calderon@unab.cl` and `REPLACE-WITH-YOUR-`.
- **Papers**: the `.paper` cards in `#papers`. Add a Spanish summary under the same `data-i18n` key in `js/i18n.js`.
- **Team**: the `.person` cards in `#team`.
- **Portrait**: replace `assets/juan-felipe-calderon.jpg` (current file is 170×170 px; a 600 px square looks sharper).
- **Animation**: each SVG element has `data-s="3,4"` (scenes in which it is visible) and optionally `data-a` (scenes in which it is highlighted). Steps are the `.step` articles; their order is the scene number.

## Language

English by default. The ES/EN switch remembers the choice; `?lang=es` forces Spanish.
