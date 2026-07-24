# demo2 runtime dependencies

These files are kept local so `demo2/index.html` does not depend on a CDN.

| File | Package | Version | License |
| --- | --- | --- | --- |
| `jquery-4.0.0.slim.min.js` | jQuery slim | 4.0.0 | MIT |
| `vue.min.js` | Vue.js | 2.7.16 | MIT |
| `system.js` | SystemJS | 0.21.6 | MIT |
| `systemjs-vue-browser.js` | systemjs-vue-browser | 1.0.11 | MIT |
| `react-runtime.min.js` | React + ReactDOM Client | 19.2.8 | MIT |
| `plugin-babel.js` | systemjs-plugin-babel | 0.0.25 | MIT |
| `systemjs-babel-browser.js` | systemjs-plugin-babel | 0.0.25 | MIT |

The jQuery slim build is loaded through fabLoader and is used only by this
demo. The minified file is 56,032 bytes on disk and transfers at about 19 KB
when the HTTP server enables gzip compression. FabUI and fabLoader remain
independent of jQuery.

Vue uses the full browser build because this no-build demo compiles the
component template in the browser.

React and ReactDOM Client are bundled into one local browser runtime. SystemJS
Babel transforms the small JSX test component in the browser.
