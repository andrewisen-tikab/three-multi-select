import * as THREE from 'three';
import './style.css';
import MultiSelect from '../src/MultiSelect';

type Mesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material> & {
    _material: THREE.Material;
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const selectMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube1 = new THREE.Mesh(geometry, material);
cube1.position.setX(-2);
cube1.name = '1';
scene.add(cube1);
const cube2 = new THREE.Mesh(geometry, material);
scene.add(cube2);
cube2.position.setX(2);
cube2.name = '2';

camera.position.z = 5;

const multiSelect = new MultiSelect(camera, renderer.domElement, scene.children as any);
multiSelect.addEventListener<'select', Mesh>('select', (event) => {
    const { object } = event;
    object._material = object.material;
    object.material = selectMaterial;
});
multiSelect.addEventListener<'deselect', Mesh>('deselect', (event) => {
    const { object } = event;
    object.material = object._material;
});
function animate() {
    requestAnimationFrame(animate);

    cube1.rotation.x += 0.01;
    cube1.rotation.y += 0.01;
    cube2.rotation.x += 0.01;
    cube2.rotation.y += 0.01;

    renderer.render(scene, camera);
}

animate();
