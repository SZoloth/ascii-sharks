# ascii sharks

```
                            ;'
                             %%'
                              .t;.               .oooo
                               S;:S%              %8S8.
                                ;:tt%t '..        XX%%S
t'                            ''XSSS8SSX%XX8#.    %XSX%
 :;'               ;.''X8%8XX%%S%%S%SStt%tSX8S#X8't%ttt.
  ::%'       ''8XXXSSt%Stttttt%8@%%@%8@8%Sttt%%%%SSSSS%tt.
  'SXXtt%t%%%S%:;StS%ttSS%tSXSt88@@%8%@8%tStS%%X%SS%%S%;;t
 .@##88#@...'@@@@#@8@88X88#XXXSX8SX88SX8%SS%S%%S88St%t%%%.
  %;%t             :.    '.'##@###@X#888XX##8@@@#.X%XS%.
 .%t                            ;%%%#@@##@@@.     SXS%%
 t.                            .%;%%%.            %%XXS
                              '%t:t              .SXSS'
                             '::.                ooooo
                            .S'
                            .
```

Fish, sharks and a few other sea creatures drawn as ASCII on a canvas. Zero dependencies.

A fork of [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks) by drewdi. The simulation, the renderer and every shark are theirs. This fork adds options, theming and more creatures.

```sh
npm install && npm run dev
```

```ts
import { OceanEngine } from "./src";

// As before: a roster on the black stage.
new OceanEngine(canvas, [{ kind: "hammerhead", size: 1 }]);

// Or options: draw quietly behind a page, in the page's own colours.
const ocean = new OceanEngine(canvas, {
  creatures: [{ kind: "manta", size: 1 }, { kind: "whaleshark", size: 0.9 }, { kind: "mako", size: 0.6 }],
  fishCount: 90,
  cell: 7,            // finer cells, finer creatures
  transparent: true,  // clear canvas, the page shows through
  grid: false,
  fps: 24,
  theme: { paper: [247, 247, 245], ink: [24, 34, 58], accents: ["#e8411c"] },
});

ocean.pause();
ocean.resume();
ocean.setTheme({ accents: ["#ff6a45"] }); // dark page: leave `paper` unset
```

## Creatures

Sharks: `classic`, `hammerhead`, `greathammer`, `tiger`, `zebra`, `mako`, `thresher`, `nurse`.

Not sharks: `orca`, `manta`, `whaleshark`, `koi`, `turtle`, `seal`, `jelly`.

The manta, whale shark, koi, turtle and jellyfish are gentle: they cruise through the schools and never hunt. Each koi gets its own pattern: white and orange, white with orange and black, or solid gold. The turtle's shell never bends, and the jellyfish pulses and trails tentacles.

Try them in the demo with `?sharks=manta,orca,whaleshark` or `?sharks=koi,koi,koi,koi,turtle,jelly`.

## Options

| Option | What it does | Default |
| --- | --- | --- |
| `creatures` | Who swims and how big, relative to the biggest | four classic sharks |
| `fishCount` | Number of fish | sized from the canvas |
| `cell` | Cell width in CSS pixels | 8 to 13, from the canvas width |
| `transparent` | Clear canvas in place of the black stage | `false` |
| `grid` | The faint cell grid | `true` |
| `theme` | `paper`, `ink`, `accents`, `wake` colours | the original palette |
| `fps` | Cap on drawn frames per second | every frame |
| `maxDpr` | Cap on device pixel ratio | 2 |
| `interactive` | Fish flee the pointer, a click splashes | `true` |
| `paused` | Start paused | `false` |

MIT
