# 3rdmainland

A Three.js motorbike game on an 11 km course inspired by Third Mainland Bridge in Lagos. A slim rider with a flapping shirt and bouncing helmet carries a suited passenger and briefcase. Enter your name and press Enter to pick up the passenger at the roadside and climb onto the bridge.

The opening is choreographed by course distance: blocking cars, a pacing car and bus, a tall truck falling right and spilling bottles, pedestrians, a dense blockade requiring the median, and a falling lamp with electrical sparks. Plain black jagged potholes are long and cannot be jumped. A middle-lane water puddle, alternating pothole pairs, a far-right bonfire, and a Danfo crossing from the opposite carriageway follow. The Danfo retains all four wheels while balancing on two side wheels.

Net fences then prevent median escape through ten normal-width cars. Their lane changes repeat exactly each ride, with each successive car swerving slightly faster. The last car is about 1.53 times as fast laterally as the first; row spacing stays unchanged. After the slalom, a broken-down car and two women wave from the right. Taking their lane slows the bike so one woman can board, giving you two passengers. There is no ramp before this pickup.

If you skip the woman, police block the road and the motorcycle swerves into the right-hand lagoon. If you pick her up, she jumps up as police approach, lifting the front wheel. The bike climbs onto the patrol pickup bed and launches over it. After the jump, police pursue and a police van cuts into the middle lane. The sandbag checkpoint and its gunfire have been removed. Two flashing patrol pickups pursue the bike; slowing too much lets them close in. No potholes appear after this sequence. Later encounters include a giant turtle, thrown trash, a falling lamp, a truck crash, and swinging bridge ambushers, alongside regular traffic.

Crashes launch the people separately along rightward arcs into the lagoon, spinning around their centers of mass. The motorcycle skids on the road. After the brief animation, gameplay restarts instantly at speed without replaying the pickup intro. There are no sharks, fish, or coins.

The centered remaining-distance counter reaches zero to win. Best distance and player name are stored in the browser and displayed on the right.

## Run

```sh
npm install
npm run dev
```

Open the URL printed by Vite (normally http://127.0.0.1:5173/). Build with `npm run build`. Run the gameplay verification with `node verify.mjs`.

The source lives in `app/`. `npm run build` generates the complete static site in `public/`, including `public/index.html` and bundled assets. Serve or deploy `public/` as the web root. The generated site is committed so the repository can be deployed directly; rebuild it after source changes. Relative asset URLs also support hosting under a subdirectory.

## Controls

- Enter: start pickup; replay after winning.
- Left / Right or A / D: switch lanes; an extra left move reaches the median where fences permit it.
- Up: accelerate with no top speed. Down: brake.
- Space: jump over low obstacles. Trucks and long potholes require dodging.
- P / Escape: pause or resume.
- Hold Shift or touch BOOST: accelerate.
- Touch arrows or swipes: steer. Touch JUMP: jump.
- Music-note button: toggle sound effects.

## Debug checkpoints

Open **DEBUG CHECKPOINTS** on the right, choose a scene, and press **START HERE**. Each scene restores its required passengers, traffic state, and camera. **RETRY SCENE** and automatic crash retries restart the selected scene. Debug runs do not update high scores. Starting a normal game clears the debug checkpoint.

After crossing into the opposite carriageway, police keep chasing at a safe distance and cannot cause a crash, even if you stop. Dodge the incoming cars; police leave when you cross back.

The oncoming section adds a passenger-filled bus, a tall truck carrying tied bales, a G-Wagon, and four flashing convoy cars on fixed schedules. A three-lane queue beyond the return gap forces you back across the median. The two racers flank the bike, gesture out of their windows, and surge forward and back. A flashing **ACCELERATE!** sign prompts you to get ahead; losing makes them cut into the bike.

The overhead section keeps the bike moving automatically at 48 m/s. Five pairs of cars drive forward at 20 m/s, leaving a different lane open in each group. Steer with Left/Right or A/D. The camera eases into and out of the overhead view while the road keeps moving. The seller stretch mixes runners from both sides with staggered stationary stalls; no single lane bypasses the whole stretch. The pattern repeats on retries. Moving trucks are visible ahead before a frozen camera orbit carries the view around the bike into the side-view truck sequence.

The underwater detour's right ramp ends. When the jump cue appears, press Space and steer left to land on the middle ramp across the gap. Missing the jump or landing on the wrong ramp drops the bike into the lagoon.

Side view now uses six moving platforms: a fuel tanker, sand tipper, box truck, flatbed, timber truck, and Benz 911. Space jumps between loads; Down drops faster in the air. The tipper's sand launches the bike automatically. Jump to grab the taxiing plane that follows, hang above the burning truck, then press Space again once clear to drop onto the highway. A quiet turtle and mermaid stretch leads into a short rainstorm: lightning reveals a car and flooded holes with changing safe lanes.
