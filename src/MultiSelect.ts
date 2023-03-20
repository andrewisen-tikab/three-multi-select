import * as THREE from 'three';
import {
    Action,
    ACTION,
    Config,
    DefaultConfig,
    MouseButtons,
    MOUSE_BUTTON,
    Touches,
} from './types';

import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

import { material } from './debug';

type Mesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material> & {
    _material: THREE.Material;
};

const _pointer = /* @__PURE__ */ new THREE.Vector2();
let _intersects: THREE.Intersection<Mesh>[] = /* @__PURE__ */ [];
const _raycaster = /* @__PURE__ */ new THREE.Raycaster();
_raycaster.firstHitOnly = true;

export default class MultiSelect extends THREE.EventDispatcher {
    private config: Config;

    public enabled: boolean;

    public mouseButtons: MouseButtons;

    public touches: Touches;

    private state: Action;

    private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    private domElement: HTMLElement;
    private object: Mesh[];
    private selectedObjects: Mesh[];

    private onContextMenuEvent: (this: HTMLElement, event: MouseEvent) => void;
    private onPointerDownEvent: (event: PointerEvent) => void;
    private onPointerMoveEvent: (event: PointerEvent) => void;

    static install() {
        THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
        THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
        THREE.Mesh.prototype.raycast = acceleratedRaycast;
    }

    constructor(
        camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
        domElement: HTMLElement,
        objects: Mesh[],
        config?: Partial<Config>,
    ) {
        super();
        this.camera = camera;
        this.domElement = domElement;
        this.object = objects;
        this.selectedObjects = [];
        this.config = { ...DefaultConfig, ...config };
        this.enabled = true;

        // configs
        this.mouseButtons = {
            left: ACTION.SELECT,
            middle: ACTION.NONE,
            right: ACTION.DESELECT,
            wheel: ACTION.NONE,
        };

        this.touches = {
            one: ACTION.SELECT,
            two: ACTION.SELECT,
            three: ACTION.NONE,
        };

        this.state = 0;

        this.onContextMenuEvent = this._onContextMenu.bind(this);
        this.onPointerDownEvent = this._onPointerDown.bind(this);
        this.onPointerMoveEvent = this._onPointerMove.bind(this);
        this.activate();
    }

    private _onContextMenu(event: MouseEvent) {
        if (this.mouseButtons.right === ACTION.NONE) return;
        event.preventDefault();
    }

    private _onPointerDown(event: PointerEvent) {
        if (this.enabled === false) return;

        // const mouseButton =

        //     (event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT
        //         ? MOUSE_BUTTON.LEFT
        //         : (event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.MIDDLE
        //         ? MOUSE_BUTTON.MIDDLE
        //         : (event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.RIGHT
        //         ? MOUSE_BUTTON.RIGHT
        //         : null;

        if (event.pointerType === 'touch') {
        } else {
            this.state = 0;

            if ((event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT) {
                this.state = this.state | this.mouseButtons.left;
            }
            if ((event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.MIDDLE) {
                this.state = this.state | this.mouseButtons.middle;
            }
            if ((event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.RIGHT) {
                this.state = this.state | this.mouseButtons.right;
            }
        }

        if (!this.state) return;

        this.updatePointer(event);
        _raycaster.setFromCamera(_pointer, this.camera);
        _intersects = [];
        _raycaster.intersectObjects(this.object, this.config.recursive, _intersects);

        if (_intersects[0] == null) return;
        const { object } = _intersects[0];
        let alreadySelected = false;
        for (let i = 0; i < this.selectedObjects.length; i++) {
            const element = this.selectedObjects[i];
            if (object.uuid !== element.uuid) continue;
            alreadySelected = true;
            if (this.state === ACTION.TOGGLE) {
                this.deselectObject(element, i);
            } else if (this.state === ACTION.DESELECT) {
                this.deselectObject(element, i);
            }
            break;
        }
        if (alreadySelected) return;
        if (this.state === ACTION.DESELECT) return;
        this.selectObject(object);
    }

    selectObject(object: Mesh) {
        this.selectedObjects.push(object);
        object._material = object.material;
        object.material = material;
    }

    deselectObject(object: Mesh, index: number) {
        // Fast way
        this.selectedObjects[index] = this.selectedObjects[this.selectedObjects.length - 1];
        this.selectedObjects.pop();
        object.material = object._material;
    }

    private _onPointerMove(event: PointerEvent) {
        if (this.enabled === false) return;
        this.updateRaycaster(event);
    }

    private updateRaycaster(event: PointerEvent) {
        this.updatePointer(event);
    }

    private updatePointer(event: PointerEvent) {
        const rect = this.domElement.getBoundingClientRect();
        _pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        _pointer.y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    public activate() {
        this.domElement.addEventListener('contextmenu', this.onContextMenuEvent);
        this.domElement.addEventListener('pointerdown', this.onPointerDownEvent);
        this.domElement.addEventListener('pointermove', this.onPointerMoveEvent);
    }

    public deactivate() {
        this.domElement.removeEventListener('contextmenu', this.onContextMenuEvent);
        this.domElement.removeEventListener('pointerdown', this.onPointerDownEvent);
        this.domElement.removeEventListener('pointermove', this.onPointerMoveEvent);
        this.selectedObjects = [];
    }

    public dispose() {}
}
