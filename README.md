# three-multi-select

A control for three.js, similar to THREE.OrbitControl, that supports multi select and transforming multiple objects at once.

[![Release](https://github.com/andrewisen-tikab/three-multi-select/actions/workflows/release.yml/badge.svg)](https://github.com/andrewisen-tikab/three-multi-select/actions/workflows/release.yml)

![Example](./resources/example.gif)

## Demo

Check the `examples` folder or visit one of the links below:

-   [Simple](https://andrewisen-tikab.github.io/three-multi-select/examples/simple/)
-   [Kitchen Sink](https://andrewisen-tikab.github.io/three-multi-select/examples/kitchen-sink/)

## Docs

Auto-generated docs can be found [here](https://andrewisen-tikab.github.io/three-multi-select/docs/classes/MultiSelect.html).

## Instructions

Here's some boilerplate to setup the `three-multi-select`.

```ts
import { MultiSelect } from 'three-multi-select';

// Boilerplate code to setup a scene
const scene = new THREE.Scene();
// Everything that is selectable goes into this group.
const group = new THREE.Group();
scene.add(group);

// Boilerplate code to setup three
const camera = new THREE.PerspectiveCamera();
const renderer = new THREE.WebGLRenderer();

// We will use the OrbitControls from three.js
const controls = new OrbitControls(camera, renderer.domElement);

// Everything is now ready for the multi select.
const multiSelect = new MultiSelect(
    // First we provide a camera
    camera,
    // Then we provide a `DOMElement` that we can use to attach JavasScript event listeners to.
    renderer.domElement,
    // Then, we provide an array of objects that are selectable. In this case, our group.
    group.children,
    // Finally, we provide a configuration object.
    {
        cameraControls: controls,
    },
);
```

Objects are now selectable. But nothing will happen.
We can listen to `selecrt` and `deselect` events like this:

```ts
multiSelect.addEventListener<'select', Mesh>('select', (event) => {
    const { object } = event;
});

multiSelect.addEventListener<'deselect', Mesh>('deselect', (event) => {
    const { object } = event;
});
```

## Config

| Name                  | Type                                | Default | Description                                                                                                                                                                    |
| --------------------- | ----------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| recursive             | `boolean`                           | `false` | If true, it also checks all descendants. Otherwise it only checks intersection with the object.                                                                                |
| useTransformControls  | `boolean`                           | `true`  | Whether to use THREE's `TransformControls`. If true, one can transform all selected objects as a group.                                                                        |
| transformControls     | `THREE.TransformControls` or `null` | `null`  | Provide a custom `TransformControls`. If empty, a new controller will be created.                                                                                              |
| cameraControls        | `GenericControls` or `null`         | `null`  | Provide a reference to a `camera` controller. When using `TransformControls`, it will disable the `cameraControls`. N.B; The provided objet must expose an `enabled` property. |
| deselectOnRaycastMiss | `boolean`                           | `false` | If true, any raycast miss will result in a deselect. \* Note that camera controls may interfere with this logic.                                                               |

## Events

Generic events:

```
activate
```

```
deactivate
```

```
addEventListener
```

```
removeEventListener
```

```
removeAllEventListeners
```

```
dispose
```

Object events:

```
selectObject
```

```
deselectObject
```

```
deselectAllObjects
```
