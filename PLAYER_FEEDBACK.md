# Test feedback and changes

These notes collect the feedback I sent while testing the game, including the early trial and later sessions. The effect column follows what happened in subsequent versions: some changes helped, some went too far, and some still need another try.

## Early tests: finding the right interaction

| Test feedback | Change | Effect |
| --- | --- | --- |
| The gestures were hard to recognise, and the game lacked sound and enough feedback. | Relaxed the finger-gun rules; added music, shot sounds, charge light and hit effects. | Shooting gained a clearer visible and audible response. Recognition remained a recurring issue. |
| Players point their fingers toward the camera, rather than showing the pose from the side. | Used three-dimensional landmarks and stopped requiring the thumb and middle finger to match a strict pose. | The intended gesture became more natural, although quick movement and occlusion still caused problems. |
| Aiming was difficult and sometimes made the arms cross. | Switched to automatic targets and removed hand-position aiming. | This removed the need to chase targets with the hands. Later feedback focused more on firing and hand identity. |
| The hands looked awkward, and their direction was unclear. The generated background looked too much like AI art. | Redrew the gloves using the supplied reference and replaced the generated garden with a layered Canvas background. | One redraw was described as a little better, but still ugly. The hand art needed several revisions rather than one successful replacement. |
| The tracking-loss overlay hid the camera preview. | Removed the background blur and kept the preview visible. | Players can see the camera while adjusting their hands. |

## Round 1 — 31 October: hand identity, rapid fire and waves

| Test feedback | Change | Effect |
| --- | --- | --- |
| Lifting the left finger sometimes fired the right gun. | Revised initial hand assignment and kept identities stable between frames. | Not solved by this first change: the next screenshot still showed mismatched colours. |
| The charge effect was hard to notice. | Added a brighter core, inward particles, rings and full-charge arcs. | Charge levels became more visible on the fingertips. |
| Fast shooting was often missed. | Reduced input delay, used the unsmoothed lift for firing and shortened the time before another shot could trigger. | The rules allow a faster rhythm, but the camera can still miss movement between frames. |
| The game needed waves and larger groups to create a rhythm. | Replaced a timed survival goal with waves, grouped spawns and short breaks. | Waves became the basis of the game. Their difficulty still needed several adjustments. |

## Round 2 — 31 October: the colours still did not match

| Test feedback | Change | Effect |
| --- | --- | --- |
| The screenshot still appeared to show reversed left/right colours. | Removed an extra label swap and made preview markers and shooting use the same tracked identity. | The preview and game used one mapping, but later testing again showed a physical right hand labelled left. This was not a complete fix. |

## Round 3 — 31 October: palms, energy and the flower boss

| Test feedback | Change | Effect |
| --- | --- | --- |
| A stop gesture should slow enemies while the other hand keeps shooting. Both hands should share energy. | Added single-palm slowing with a shared five-second energy pool. | This added a second action to combine with firing. Later versions increased the energy and changed slowing to time stop, then to pushback. |
| Two open palms should push enemies away more strongly. | Added two-palm pushback with faster energy use. | Pushback stayed in the game, but the player later wanted a stronger effect and shorter training. |
| Add a boss and more enemies in later waves. | Added the flower boss and increased wave sizes. | The following feedback found the game too hard, so enemy health was reduced. |

## Round 4 — 31 October: explaining palms on the home screen

| Test feedback | Change | Effect |
| --- | --- | --- |
| Explain the palm ability on the home screen. | Added palm drawings and short instructions. | The next feedback found the explanation too wordy. The layout was changed to three aligned picture cards. |

## Round 5 — 31 October: clearer teaching and easier combat

| Test feedback | Change | Effect |
| --- | --- | --- |
| Use fewer words and align the home-screen diagrams. | Made equal-sized cards for shooting, one palm and two palms. | The home screen became less crowded; detailed instructions moved into training. |
| The game was too difficult. | Lowered ordinary plants to 1–2 health and the flower boss to 20. | This went too far in later waves: subsequent feedback found the late game too easy. |
| Make one palm stop time, strengthen two-palm push and allow ten seconds of energy. | Changed both palm abilities and enlarged the shared energy pool. | The stronger push remained useful as a mechanic. Single-palm time stop was later reported to feel unhelpful and was replaced. |
| Add a combo reward with area-damage shots. | Added six seconds of explosive shooting at a combo milestone. | Later testing found the reward overpowered. It was eventually removed. |
| Improve the open-palm gloves and teach skills one at a time. | Redrew the hand backs and added action-based lessons. | Teaching revealed another issue: a player could arrive at the push lesson with no energy. |

## Round 6 — 31 October: a memorable threshold

| Test feedback | Change | Effect |
| --- | --- | --- |
| “Make it every 20 times; that is easy to remember.” | Set the combo reward to every 20 consecutive hits. | The 20-hit count was kept even when the reward later changed from explosive shots to a clap. |

## Round 7 — 1 November: more waves and the Thorn Queen

| Test feedback | Change | Effect |
| --- | --- | --- |
| The late game was too easy. Add five waves and gradually increase ordinary health, up to five. | Expanded the game to ten waves and increased later health. | The longer game created more pressure, but the new final encounter became too difficult. |
| Keep the small boss and add a final boss that requires palm abilities. | Kept the flower boss in wave five and added the Thorn Queen in wave ten. | The first encounter brought the queen and minions into the fight together, leaving too little room to react. |
| Both palms were raised, but nothing moved; the preview said “dual guns.” | Separated palm status from gun status and made palm lessons use unlimited energy. | The screenshot showed zero energy even though both palms were recognised. The new status explains this better, but later feedback still found the push lesson too long. |

## Round 8 — 1 November: clap attack and a slower final encounter

| Test feedback | Change | Effect |
| --- | --- | --- |
| Explosive shooting was too strong. Replace it with one full-screen clap after 20 hits. | Added a stored clap, a lower-screen icon and a glove animation. | The next real test found that clapping had no effect. The first detector was not forgiving enough. |
| Replace health pips with continuous bars and gradual health growth. | Added continuous health and charge damage, with a trailing damage bar. | The size of each hit is now shown as a change along the bar instead of a number of pips. |
| One-palm time stop felt pointless. Make it a slower push, with purple effects. | Changed one palm to gentle push and kept two palms as strong push. | Both actions now communicate the same kind of force at different strengths. |
| Put the queen farther back, let the player clear minions first, and show the orb travelling back when reflected. | Made her wait behind the minions, lengthened attack warnings and delayed reflected damage until the orb reaches her. | The fight is split into a crowd phase and a boss phase. The return animation makes the counter's result visible. |
| The two-palm lesson took too long; about two seconds would be enough. | Shortened the completion sequence and kept progress through brief tracking gaps. | The lesson now needs about two seconds of steady input rather than restarting immediately after a small interruption. |

## Round 9 — 1 November: feedback on the submission materials

| Test / review feedback | Change | Effect |
| --- | --- | --- |
| Make the materials English-first and less mechanical. Replace “verification and status” with “effect.” | Rewrote the documents around the idea, decisions and actual test feedback. Kept code checks in PROCESS instead of every table row. | The feedback record now shows where a change helped and where later testing contradicted it. |

## Round 10 — 1 November: clap recognition and hand labels again

| Test feedback | Change | Effect |
| --- | --- | --- |
| The teal marker was on the physical right hand, although operating the game seemed to feel right. | Corrected the label conversion before both preview and controls; added a ↔ button to swap the mapping if needed. | The earlier mapping still had a real mismatch. This revision gives the player a way to correct the controls, but its default needs another camera try. |
| Clapping had no effect even though it was ready. | Relaxed the open-finger check and allowed the approach to continue across slower frames and brief overlap-related missing data. | The previous version did not work reliably in this test. The new tolerances address that failure; actual improvement needs another play session. |
| Show a flashing, limited-time clap prompt only after the combo requirement is reached. | Replaced the permanent lower-screen indicator with an eight-second flashing opportunity. It disappears after use or expiry. | The screen is quieter outside the opportunity, and the prompt now tells the player when to act. |

## 中文简要对照

所有记录均来自测试中提出的问题。早期重点是识别迟钝、缺少音效反馈、难瞄准以及手套不好看；随后转向左右手对应、快速射击、波次和难度。

几次修改的效果并不理想：第一轮左右手修复后颜色仍不对；主页说明后来被认为太多；降低血量后后期又太简单；爆燃太强；加入女王后最后一关又太难；第一版拍手在真实测试中没效果。最新一轮放宽拍手识别，并将提示改为达成 20 连击后闪烁 8 秒，补充左右手交换按钮。效果是否足够好，继续根据下一轮测试反馈更新。
