import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'stats.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';

// Use "import MultiSelect from 'three-multi-select';" in your own project
import MultiSelect from '../../src/MultiSelect';

// This is boilerplate code to setup a scene
type Mesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material> & {
    _material: THREE.Material;
};
const scene = new THREE.Scene();
const group = new THREE.Group();
scene.add(group);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new THREE.Color(0x263238), 1);
document.body.appendChild(renderer.domElement);
const stats = new Stats();
document.body.appendChild(stats.dom);

// We will render three cubes that we can play with.
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const selectMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube1 = new THREE.Mesh(geometry, material);
cube1.position.setX(-3);
cube1.name = '1';
group.add(cube1);
const cube2 = new THREE.Mesh(geometry, material);
group.add(cube2);
cube2.position.setX(0);
cube2.name = '2';
const cube3 = new THREE.Mesh(geometry, material);
group.add(cube3);
cube3.position.setX(3);
cube3.name = '3';

const gridHelper = new THREE.GridHelper(10, 10, 0xffffff, 0xffffff);
const gridMaterial = gridHelper.material as THREE.Material;
gridMaterial.opacity = 0.2;
gridMaterial.transparent = true;
gridHelper.position.y = -2.75;
scene.add(gridHelper);

// Arbitrary camera position
camera.position.z = window.innerWidth > window.innerHeight ? 5 : 15;

// First, we have the camera controls.
// We will use the OrbitControls from three.js
const controls = new OrbitControls(camera, renderer.domElement);

// Everything is now ready for the multi select.
const multiSelect = new MultiSelect(
    // First we provide a camera
    camera,
    // Then we provide a `DOMElement` that we can use to attach listeners to.
    renderer.domElement,
    // Then, we provide an array of objects that are selectable.
    group.children,
    // Finally, we provide a configuration object.
    {
        cameraControls: controls,
    },
);

// The multi select will do nothing until we add event listeners.

multiSelect.addEventListener<'select', Mesh>('select', (event) => {
    const { object } = event;
    // We can use the object to do something.
    // For example, we can change the material.
    //
    // First, we store the original material.
    object._material = object.material;
    // And then we change the material.
    object.material = selectMaterial;
});

multiSelect.addEventListener<'deselect', Mesh>('deselect', (event) => {
    const { object } = event;
    // Similar, when we deselect, we can restore the original material.
    object.material = object._material;
});

multiSelect.removeAllEventListeners;

// With that, we can add our multi select to the scene.
// We do this so that we can render the transform controls.
scene.add(multiSelect.scene);

// We can also add a GUI to change the configuration.
const gui = new GUI();

const state = {
    selectAll: () => {
        multiSelect.selectObject(cube1);
        multiSelect.selectObject(cube2);
        multiSelect.selectObject(cube3);
    },
    deselectAll: () => {
        multiSelect.deselectAllObjects();
    },
} as const;

const selection = gui.addFolder('Selection');
selection.add(state, 'selectAll').name('Select All');
selection.add(state, 'deselectAll').name('Deselect All');

/**
 * This is boilerplate code to render the scene.
 */
function animate(): void {
    stats.update();
    requestAnimationFrame(animate);

    cube1.rotation.x += 0.01;
    cube1.rotation.y += 0.01;
    cube2.rotation.x += 0.01;
    cube2.rotation.y += 0.01;
    cube3.rotation.x += 0.01;
    cube3.rotation.y += 0.01;

    controls.update();

    renderer.render(scene, camera);
}

animate();
