import * as THREE from 'three';
import {
    Action,
    ACTION,
    Config,
    DefaultConfig,
    MouseButtons,
    MOUSE_BUTTON,
    MultiSelectEventMap,
    Touches,
} from './types';

import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

import { EventDispatcher, Listener } from './EventDispatcher';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

type Object = THREE.Object3D;
type Parent = {
    _parent: THREE.Object3D;
};
type Position = {
    _position?: THREE.Vector3;
};

const _pointer = /* @__PURE__ */ new THREE.Vector2();
let _intersects: THREE.Intersection<Object>[] = /* @__PURE__ */ [];
const _raycaster = /* @__PURE__ */ new THREE.Raycaster();
_raycaster.firstHitOnly = true;
const _worldPosition = /* @__PURE__ */ new THREE.Vector3();
const _sum = /* @__PURE__ */ new THREE.Vector3();

// const average = (arr: number) => arr.reduce((p, c) => p + c, 0) / arr.length;

export default class MultiSelect extends EventDispatcher {
    private config: Config;

    /**
     * When set to `false`, the controls will not respond to user input.
     * @default true
     */
    public enabled: boolean;

    /**
     * This object contains references to the mouse actions used by the controls.
     */
    public mouseButtons: MouseButtons;

    /**
     * This object contains references to the touch actions used by the controls.
     */
    public touches: Touches;

    private state: Action;

    private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;

    /**
     * The {@link HTMLElement} used to listen for mouse / touch events. This must be passed in the constructor; changing it here will not set up new event listeners.
     */
    private domElement: HTMLElement;
    private object: Object[];
    private selectedObjects: THREE.Object3D;

    private onContextMenuEvent: (this: HTMLElement, event: MouseEvent) => void;
    private onPointerDownEvent: (event: PointerEvent) => void;
    private onPointerMoveEvent: (event: PointerEvent) => void;

    private tranformControls: TransformControls | null;
    scene: THREE.Scene;

    static install() {
        THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
        THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
        THREE.Mesh.prototype.raycast = acceleratedRaycast;
    }

    constructor(
        camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
        domElement: HTMLElement,
        objects: Object[],
        config?: Partial<Config>,
    ) {
        super();
        this.camera = camera;
        this.domElement = domElement;
        this.object = objects;
        this.selectedObjects = new THREE.Object3D();
        this.scene = new THREE.Scene();
        this.scene.add(this.selectedObjects);
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

        // additional controls

        this.tranformControls = this.config.useTransformControls
            ? new TransformControls(camera, domElement)
            : null;
        if (this.tranformControls) {
            this.scene.add(this.tranformControls);
        }
        // events

        this.onContextMenuEvent = this._onContextMenu.bind(this);
        this.onPointerDownEvent = this._onPointerDown.bind(this);
        this.onPointerMoveEvent = this._onPointerMove.bind(this);
        this.activate();
    }

    addEventListener<
        K extends keyof MultiSelectEventMap,
        T extends MultiSelectEventMap[K]['object'],
    >(
        type: K,
        listener: (event: Omit<MultiSelectEventMap[K], 'object'> & { object: T }) => any,
    ): void {
        super.addEventListener(type, listener as Listener);
    }

    private _onContextMenu(event: MouseEvent): void {
        if (this.mouseButtons.right === ACTION.NONE) return;
        event.preventDefault();
    }

    private _onPointerDown(event: PointerEvent): void {
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
        _raycaster.intersectObjects(
            [...this.object, ...this.selectedObjects.children],
            this.config.recursive,
            _intersects,
        );

        if (_intersects[0] == null) return;
        const { object: intersectedObject } = _intersects[0];
        const object = this.selectedObjects.getObjectById(intersectedObject.id);

        if (object) {
            if (this.state === ACTION.TOGGLE || this.state === ACTION.DESELECT) {
                this.deselectObject(object);
            }
            return;
        }
        if (this.state === ACTION.DESELECT) return;
        this.selectObject(intersectedObject);
    }

    selectObject<T extends THREE.Object3D>(object: T): void {
        (object as T & Parent)._parent = object.parent as T;
        this.selectedObjects.attach(object);
        this.attachObjectToTransformControl();
        this.dispatchEvent({ type: 'select', object });
    }

    deselectObject<T extends THREE.Object3D>(object: T): void {
        this.selectedObjects.remove(object);
        (object as T & Parent)._parent.add(object);
        this.detachObjectToTransformControl(object);
        this.dispatchEvent({ type: 'deselect', object });
    }

    private attachObjectToTransformControl() {
        if (this.config.useTransformControls === false) return;
        if (this.tranformControls === null) return;
        if (this.selectedObjects.children.length === 0) return;
        // Detach and re-compute the center.
        this.tranformControls.detach();
        this.handleTransformControlsCenter();
        this.tranformControls.attach(this.selectedObjects);
    }

    private detachObjectToTransformControl(object: THREE.Object3D) {
        if (this.config.useTransformControls === false) return;
        if (this.tranformControls === null) return;
        // Detach and re-compute the center, if necessary
        this.tranformControls.detach();
        if (this.selectedObjects.children.length === 0) return;
        object.position.add(this.selectedObjects.position);
        this.handleTransformControlsCenter();
        this.tranformControls.attach(this.selectedObjects);
    }

    handleTransformControlsCenter() {
        // Reset sum
        _sum.set(0, 0, 0);

        // Iterate all selected objects, find it's world position.
        for (let i = 0; i < this.selectedObjects.children.length; i++) {
            const object = this.selectedObjects.children[i];
            object.getWorldPosition(_worldPosition);
            // Find the new average
            _sum.add(_worldPosition);
        }
        // This is the center for the tranform controls.
        const averagePoint = _sum.divideScalar(this.selectedObjects.children.length);
        // Offset all objects with the new center
        for (let i = 0; i < this.selectedObjects.children.length; i++) {
            const object = this.selectedObjects.children[i];
            object.position
                // Remove the previous center
                .add(this.selectedObjects.position)
                // Add the new center
                .sub(averagePoint);
        }
        // Set the new center
        this.selectedObjects.position.copy(averagePoint);
    }

    private _onPointerMove(event: PointerEvent): void {
        if (this.enabled === false) return;
        this.updateRaycaster(event);
    }

    private updateRaycaster(event: PointerEvent): void {
        this.updatePointer(event);
    }

    private updatePointer(event: PointerEvent): void {
        const rect = this.domElement.getBoundingClientRect();
        _pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        _pointer.y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    /**
     * Adds the event listeners of the controls.
     */
    public activate(): void {
        this.domElement.addEventListener('contextmenu', this.onContextMenuEvent);
        this.domElement.addEventListener('pointerdown', this.onPointerDownEvent);
        this.domElement.addEventListener('pointermove', this.onPointerMoveEvent);
    }

    /**
     * Removes the event listeners of the controls.
     */
    public deactivate(): void {
        this.domElement.removeEventListener('contextmenu', this.onContextMenuEvent);
        this.domElement.removeEventListener('pointerdown', this.onPointerDownEvent);
        this.domElement.removeEventListener('pointermove', this.onPointerMoveEvent);
        this.selectedObjects.clear();
    }

    /**
     * Should be called if the controls is no longer required.
     */
    public dispose(): void {
        this.deactivate();
    }

    /**
     * Returns the internal Raycaster instance that is used for intersection tests.
     */
    public getRaycaster(): THREE.Raycaster {
        return _raycaster;
    }
}
