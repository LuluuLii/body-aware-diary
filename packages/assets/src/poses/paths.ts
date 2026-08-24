// @body-diary/assets · pose sketch path data
// Hand-drawn stick-figure poses. viewBox 100x140.
// Extracted from handoff `poseSketch()` (身心训练记录 App.dc.html:713).

export type PoseKind = 'fold' | 'warrior' | 'bridge' | 'seated'

/**
 * SVG `<path d>` attribute strings for each pose.
 * Each entry is one stroke segment; rendered stacked with stroke #6B6F5B by default.
 * Each pose is rendered from its most-recognizable viewpoint (side / front) — designed
 * to communicate the pose silhouette at 40-80px sizes.
 */
export const POSE_PATHS: Record<PoseKind, readonly string[]> = {
  // 前屈 Forward Fold — side view, hips highest, head hangs low near knees, arms drop
  fold: [
    'M27 86 a5.5 5.5 0 1 0 0.1 0',           // head (low, at knee level)
    'M31 88 Q40 72 56 62',                   // spine arc: head → hip (hip = apex)
    'M56 62 L56 128',                        // front leg
    'M62 62 L62 128',                        // back leg (slight offset for depth)
    'M50 128 L68 128',                       // foot mark on ground
    'M31 89 L26 105 L28 122',                // arm 1 hanging (with elbow bend)
    'M34 91 L32 107 L37 124',                // arm 2 hanging (behind arm 1)
  ],
  // 战士二 Warrior II — front view, wide stance, arms horizontal, front knee bent
  warrior: [
    'M50 12 a6 6 0 1 0 0.1 0',               // head
    'M50 22 L50 60',                         // vertical torso
    'M36 30 L64 30',                         // shoulder line
    'M36 30 L18 32 L10 33',                  // left arm extended horizontally
    'M64 30 L82 32 L90 33',                  // right arm extended
    'M42 60 L58 60',                         // hip band
    'M45 60 L18 128',                        // back leg straight (extended)
    'M55 60 L74 92',                         // front thigh (diagonal down)
    'M74 92 L74 128',                        // front shin vertical (knee bent 90°)
    'M12 128 L26 128',                       // back foot
    'M67 128 L82 128',                       // front foot
  ],
  // 桥式 Bridge — side view, head on ground, hips lifted forming rising arch
  bridge: [
    'M14 100 a5.5 5.5 0 1 0 0.1 0',          // head (low, at ground level)
    'M20 101 L28 99',                        // neck to shoulder (on ground)
    'M28 99 Q46 72 62 61',                   // torso arch rising to hip apex
    'M62 61 L80 92',                         // thigh diagonal down from hip
    'M80 92 L80 128',                        // shin vertical to foot
    'M72 128 L88 128',                       // foot flat on ground
    'M28 100 Q40 108 55 112',                // arm alongside body on ground
    'M22 105 L34 108',                       // second arm (partial visibility)
  ],
  // 束角式 Bound Angle — front view, seated with soles together, knees splayed
  seated: [
    'M50 12 a6 6 0 1 0 0.1 0',               // head
    'M50 22 L50 66',                         // upright torso
    'M38 30 L62 30',                         // shoulder line
    'M38 30 L28 60 L30 88',                  // left arm down to knee
    'M62 30 L72 60 L70 88',                  // right arm down to knee
    'M45 66 L22 96',                         // left thigh out (forms diamond)
    'M55 66 L78 96',                         // right thigh out
    'M22 96 L46 116',                        // left shin back in
    'M78 96 L54 116',                        // right shin back in
    'M46 116 L54 116',                       // feet touching (diamond base)
  ],
}

/** Ground line at the base of every pose sketch. */
export const POSE_GROUND_PATH = 'M14 128 Q50 132 86 128'
