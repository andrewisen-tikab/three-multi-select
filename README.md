# three-multi-select

[![Release](https://github.com/andrewisen-tikab/three-multi-select/actions/workflows/release.yml/badge.svg)](https://github.com/andrewisen-tikab/three-multi-select/actions/workflows/release.yml)

## Instructions

```ts
import { MultiSelect } from 'three-multi-select';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const renderer = new THREE.WebGLRenderer();

const multiSelect = new MultiSelect(camera, renderer.domElement, scene.children);
```

## Demo

See the `example` folder or visit the link for a live demo.

[https://andrewisen-tikab.github.io/three-multi-select/](https://andrewisen-tikab.github.io/three-multi-select/)
