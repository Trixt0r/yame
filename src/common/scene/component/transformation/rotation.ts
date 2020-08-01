// import { SceneComponentType, SceneComponentMetaData } from 'common/scene/component';
// import { RangeSceneComponent } from '../range';
// const RAD2DEG = 180 / Math.PI;
// const DEG2RAD = Math.PI / 180;

// @SceneComponentType()
// export class RotationSceneComponent extends RangeSceneComponent {
//   id = 'rotation';

//   meta: SceneComponentMetaData = {
//     name: 'Rotation',
//     min: 0,
//     max: 360,
//     step: 1,
//     ticks: 90,
//     transform: {
//       apply(value: number): number {
//         return Math.round(value * RAD2DEG);
//       },
//       reverse(value: number): number {
//         return value * DEG2RAD;
//       }
//     }
//   };
// }
