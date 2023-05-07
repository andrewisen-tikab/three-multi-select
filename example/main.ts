import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';
import MultiSelect from '../src/MultiSelect';
import Stats from 'stats.js';

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
cube2.position.setX(3);
cube2.name = '3';

const gridHelper = new THREE.GridHelper(10, 10, 0xffffff, 0xffffff);
const gridMaterial = gridHelper.material as THREE.Material;
gridMaterial.opacity = 0.2;
gridMaterial.transparent = true;
gridHelper.position.y = -2.75;
scene.add(gridHelper);

camera.position.z = 5;
const controls = new OrbitControls(camera, renderer.domElement);

const multiSelect = new MultiSelect(camera, renderer.domElement, group.children, {
    cameraControls: controls,
});

multiSelect.addEventListener<'select', Mesh>('select', (event) => {
    const { object } = event;
    object._material = object.material;
    object.material = selectMaterial;
});
multiSelect.addEventListener<'deselect', Mesh>('deselect', (event) => {
    const { object } = event;
    object.material = object._material;
});

scene.add(multiSelect.scene);
function animate() {
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
