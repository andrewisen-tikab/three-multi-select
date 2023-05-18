import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';

// Use "import MultiSelect from 'three-multi-select';" in your own project
import MultiSelect from '../../src/MultiSelect';
import { ACTION } from '../../src/types';

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
// @ts-ignore
const stats = new Stats();
document.body.appendChild(stats.dom);

// We will render three cubes that we can play with.
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const selectMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube1 = new THREE.Mesh(geometry, material);
cube1.position.setX(-3);
cube1.name = 'cube1';
group.add(cube1);
const cube2 = new THREE.Mesh(geometry, material);
group.add(cube2);
cube2.position.setX(0);
cube2.name = 'cube2';
const cube3 = new THREE.Mesh(geometry, material);
group.add(cube3);
cube3.position.setX(3);
cube3.name = 'cube3';
const cubes = [cube1, cube2, cube3] as const;

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

// We can also add a GUI to change the configuration.
const gui = new GUI();

enum HumanReadableMouseButtonAction {
    None = 'None',
    SELECT = 'Select',
    DESELECT = 'Deselect',
    TOGGLE = 'Toggle',
}

const convertHumanReadableMouseButtonActionToAction = (action: HumanReadableMouseButtonAction) => {
    switch (action) {
        case HumanReadableMouseButtonAction.SELECT:
            return ACTION.SELECT;
        case HumanReadableMouseButtonAction.DESELECT:
            return ACTION.DESELECT;
        case HumanReadableMouseButtonAction.TOGGLE:
            return ACTION.TOGGLE;
        default:
            return ACTION.NONE;
    }
};

enum HumanReadableTouchAction {
    None = 'None',
    SELECT = 'Select',
    DESELECT = 'Deselect',
    TOGGLE = 'Toggle',
}

const convertHumanReadableTouchActionToAction = (action: HumanReadableTouchAction) => {
    switch (action) {
        case HumanReadableTouchAction.SELECT:
            return ACTION.SELECT;
        case HumanReadableTouchAction.DESELECT:
            return ACTION.DESELECT;
        case HumanReadableTouchAction.TOGGLE:
            return ACTION.TOGGLE;
        default:
            return ACTION.NONE;
    }
};

const state = {
    enable: true,
    rotateAsGroup: false,
    mouseLeft: HumanReadableMouseButtonAction.SELECT,
    mouseMiddle: HumanReadableMouseButtonAction.None,
    mouseRight: HumanReadableMouseButtonAction.DESELECT,
    touchOne: HumanReadableTouchAction.TOGGLE,
    touchTwo: HumanReadableTouchAction.None,
    touchThree: HumanReadableTouchAction.None,
    cube1: false,
    cube2: false,
    cube3: false,
    selectAll: () => {
        multiSelect.selectObject(cube1);
        multiSelect.selectObject(cube2);
        multiSelect.selectObject(cube3);
    },
    deselectAll: () => {
        multiSelect.deselectAllObjects();
    },
    transformControlsMode: 'translate',
    transformControlsShowX: true,
    transformControlsShowY: true,
    transformControlsShowZ: true,
    transformControlsSnap: false,
} as const;

gui.add(state, 'enable')
    .name('Enable Multi Select')
    .onChange((value) => {
        multiSelect.enabled = value;
    });

gui.add(state, 'rotateAsGroup')
    .name('Rotate as Group')
    .onChange((value) => {
        multiSelect.updateConfig({ rotateAsGroup: value });
    });

const mouseActionsFolder = gui.addFolder('Mouse  Actions');

mouseActionsFolder
    .add(state, 'mouseLeft', Object.values(HumanReadableMouseButtonAction))
    .name('Left Mouse Button')
    .onChange((value) => {
        multiSelect.mouseButtons.left = convertHumanReadableMouseButtonActionToAction(value);
    });

mouseActionsFolder
    .add(state, 'mouseMiddle', Object.values(HumanReadableMouseButtonAction))
    .name('Middle Mouse Button')
    .onChange((value) => {
        multiSelect.mouseButtons.middle = convertHumanReadableMouseButtonActionToAction(value);
    });

mouseActionsFolder
    .add(state, 'mouseRight', Object.values(HumanReadableMouseButtonAction))
    .name('Right Mouse Button')
    .onChange((value) => {
        multiSelect.mouseButtons.right = convertHumanReadableMouseButtonActionToAction(value);
    });

const touchActionsFolder = gui.addFolder('Touch  Actions');

touchActionsFolder
    .add(state, 'touchOne', Object.values(HumanReadableMouseButtonAction))
    .name('One Touch')
    .onChange((value) => {
        multiSelect.touches.one = convertHumanReadableTouchActionToAction(value);
    });

touchActionsFolder
    .add(state, 'touchTwo', Object.values(HumanReadableMouseButtonAction))
    .name('Two Touches')
    .onChange((value) => {
        multiSelect.touches.two = convertHumanReadableTouchActionToAction(value);
    });

touchActionsFolder
    .add(state, 'touchThree', Object.values(HumanReadableMouseButtonAction))
    .name('Three Touches')
    .onChange((value) => {
        multiSelect.touches.three = convertHumanReadableTouchActionToAction(value);
    });

const cubesFolder = gui.addFolder('Cubes');
cubesFolder
    .add(state, 'cube1')
    .name(cube1.name)
    .listen()
    .onChange((value) => {
        value ? multiSelect.selectObject(cube1) : multiSelect.deselectObject(cube1);
    });
cubesFolder
    .add(state, 'cube2')
    .name(cube2.name)
    .listen()
    .onChange((value) => {
        value ? multiSelect.selectObject(cube2) : multiSelect.deselectObject(cube2);
    });
cubesFolder
    .add(state, 'cube3')
    .name(cube3.name)
    .listen()
    .onChange((value) => {
        value ? multiSelect.selectObject(cube3) : multiSelect.deselectObject(cube3);
    });

const selectionFolder = gui.addFolder('Selection');
selectionFolder.add(state, 'selectAll').name('Select All');
selectionFolder.add(state, 'deselectAll').name('Deselect All');

const transformControlsFolder = gui.addFolder('Transform Controls');

transformControlsFolder
    .add(state, 'transformControlsMode', ['translate', 'rotate', 'scale'])
    .name('Mode')
    .onChange((value): void => {
        const transformControls = multiSelect.getTransformControls();
        if (!transformControls) return;
        switch (value) {
            case 'translate':
                transformControls.setMode('translate');
                break;
            case 'rotate':
                transformControls.setMode('rotate');
                break;

            case 'scale':
                transformControls.setMode('scale');
                break;
            default:
                break;
        }
    });

transformControlsFolder
    .add(state, 'transformControlsShowX')
    .name('Show X')
    .onChange((value): void => {
        const transformControls = multiSelect.getTransformControls();
        if (!transformControls) return;
        transformControls.showX = value;
    });

transformControlsFolder
    .add(state, 'transformControlsShowY')
    .name('Show Y')
    .onChange((value): void => {
        const transformControls = multiSelect.getTransformControls();
        if (!transformControls) return;
        transformControls.showY = value;
    });

transformControlsFolder
    .add(state, 'transformControlsShowZ')
    .name('Show Z')
    .onChange((value): void => {
        const transformControls = multiSelect.getTransformControls();
        if (!transformControls) return;
        transformControls.showZ = value;
    });

transformControlsFolder
    .add(state, 'transformControlsSnap')
    .name('Snap to Grid')
    .onChange((value): void => {
        const transformControls = multiSelect.getTransformControls();
        if (!transformControls) return;
        if (value) {
            transformControls.setTranslationSnap(1);
            transformControls.setRotationSnap(THREE.MathUtils.degToRad(15));
            transformControls.setScaleSnap(0.25);
        } else {
            transformControls.setTranslationSnap(null);
            transformControls.setRotationSnap(null);
            transformControls.setScaleSnap(null);
        }
    });

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
    state[object.name] = true;
});

multiSelect.addEventListener<'deselect', Mesh>('deselect', (event) => {
    const { object } = event;
    // Similar, when we deselect, we can restore the original material.
    object.material = object._material;
    state[object.name] = false;
});

// With that, we can add our multi select to the scene.
// We do this so that we can render the transform controls.
scene.add(multiSelect.scene);

/**
 * This is boilerplate code to render the scene.
 */
function animate(): void {
    stats.update();
    requestAnimationFrame(animate);

    controls.update();

    renderer.render(scene, camera);
}

animate();
