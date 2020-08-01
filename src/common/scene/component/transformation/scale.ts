// import { PointSceneComponent } from '../point';
// import { SceneComponentType } from 'common/scene/component';


// @SceneComponentType()
// export class ScaleSceneComponent extends PointSceneComponent {
//   id = 'scale';

//   constructor(x?: number, y?: number) {
//     super(x, y);
//     const transformed = { x: 0, y: 0 };
//     const reversed = { x: 0, y: 0 };
//     this.meta = {
//       name: 'Scale',
//       transform: {
//         apply(value: any) {
//           if (typeof value === 'number') return value * 100;
//           else if (value && typeof value === 'object') {
//             transformed.x = value.x * 100;
//             transformed.y = value.y * 100;
//             return transformed;
//           } else {
//             return value;
//           }
//         },
//         reverse(value: any) {
//           if (typeof value === 'number') return value / 100;
//           else if (value && typeof value === 'object') {
//             reversed.x = value.x / 100;
//             reversed.y = value.y / 100;
//             return reversed;
//           } else {
//             return value;
//           }
//         }
//       }
//     }
//   }
// }
