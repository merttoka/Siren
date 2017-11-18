:set prompt ""
:module Sound.Tidal.Context

import Sound.Tidal.Utils
import Sound.Tidal.Scales
import Sound.Tidal.Chords
import Data.Maybe
import Sound.OSC.FD
import Data.Char (digitToInt)

(cps, getNow) <- bpsUtils

(d1,t1) <- superDirtSetters getNow
(d2,t2) <- superDirtSetters getNow
(d3,t3) <- superDirtSetters getNow
(d4,t4) <- superDirtSetters getNow
(d5,t5) <- superDirtSetters getNow
(d6,t6) <- superDirtSetters getNow
(d7,t7) <- superDirtSetters getNow
(d8,t8) <- superDirtSetters getNow
(d9,t9) <- superDirtSetters getNow

let bps x = cps (x/2)
let hush = mapM_ ($ silence) [d1,d2,d3,d4,d5,d6,d7,d8,d9]
let solo = (>>) hush


:set prompt "tidal> "
