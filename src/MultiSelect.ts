import * as THREE from 'three';
import {
    Action,
    ACTION,
    Config,
    DefaultConfig,
    MouseButtons,
    MOUSE_BUTTON,
    MultiSelectEventMap,
    PointerInput,
    Touches,
} from './types';

import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

import { EventDispatcher, Listener } from './EventDispatcher';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

type Position = {
    /**
     * The object's initial position before transforming.
     */
    _position?: THREE.Vector3;
};

/**
 * This is the base class for most objects in three.js and provides a set of properties and methods for manipulating objects in 3D space.
 */
interface Object extends THREE.Object3D, Position {}

/**
 * User's pointer stored in screen space coordinates.
 */
const _pointer = /* @__PURE__ */ new THREE.Vector2();
/**
 * Array of intersections between the pointer and objects in the scene.
 */
let _intersects: THREE.Intersection<Object>[] = /* @__PURE__ */ [];
/**
 * This object is designed to assist with raycasting.
 * Raycasting is used for mouse picking (working out what objects in the 3d space the mouse is over) amongst other things.
 */
const _raycaster = /* @__PURE__ */ new THREE.Raycaster();
_raycaster.firstHitOnly = true;

/**
 * Helper variable for calculating the new `position`.
 */
const _position = /* @__PURE__ */ new THREE.Vector3();
/**
 * Helper variable for calculating the new `rotation`.
 */
const _rotation = /* @__PURE__ */ new THREE.Euler();
/**
 * Helper variable for calculating the new `rotation`.
 */
const _quaternion = /* @__PURE__ */ new THREE.Quaternion();
/**
 * Helper variable for calculating the new `scale`.
 */
const _scale = /* @__PURE__ */ new THREE.Vector3();

/**
 * Helper variable for calculating the new `position`.
 */
const _sum = /* @__PURE__ */ new THREE.Vector3();
/**
 * Helper variable for calculating the new `position`.
 */
const _averagePoint = /* @__PURE__ */ new THREE.Vector3();
/**
 * A copy of the original Matrix4 of the selected objects.
 */
const _proxy = /* @__PURE__ */ new THREE.Object3D();
const _translateToPivot = /* @__PURE__ */ new THREE.Matrix4();
const _translateBack = /* @__PURE__ */ new THREE.Matrix4();
const _rotationMatrix = /* @__PURE__ */ new THREE.Matrix4();
const _finalMatrix = /* @__PURE__ */ new THREE.Matrix4();

// const average = (arr: number) => arr.reduce((p, c) => p + c, 0) / arr.length;
/**
 * A class for selecting objects in a scene.
 * 
 * @example
 * Here's some boilerplate to setup the `three-multi-select`.
 * ```ts
 * import { MultiSelect } from 'three-multi-select';
 * // Boilerplate code to setup a scene
 * const scene = new THREE.Scene();
 * // Everything that is selectable goes into this group.
 * const group = new THREE.Group();
 * scene.add(group);
 * 
 * // Boilerplate code to setup three
 * const camera = new THREE.PerspectiveCamera();
 * const renderer = new THREE.WebGLRenderer();
 * 
 * // We will use the OrbitControls from three.js
 * const controls = new OrbitControls(camera, renderer.domElement);
 * 
 * // Everything is now ready for the multi select.
 * const multiSelect = new MultiSelect(
 *      // First we provide a camera
 *      camera,
 *      // Then we provide a `DOMElement` that we can use to attach JavasScript event listeners to.
 *      renderer.domElement,
 *      // Then, we provide an array of objects that are selectable. In this case, our group.
 *      group.children,
 *      // Finally, we provide a configuration object.
 *      {
 *      cameraControls: controls,
 * },
 * ```
 * 
 * @example
 * Objects are now selectable. But nothing will happen.
 * We can listen to `selecrt` and `deselect` events like this:
 * 
 * ```ts
 * multiSelect.addEventListener<'select', Mesh>('select', (event) => {
 *      const { object } = event;
 * });
 * 
 * multiSelect.addEventListener<'deselect', Mesh>('deselect', (event) => {
 *      const { object } = event;
 * });
 * ```
);
 */
export default class MultiSelect extends EventDispatcher {
    /**
     * The {@link Config} used by this instance.
     * Will respect the defaults set in {@link DefaultConfig}.
     */
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

    /**
     * An array of pointers that are currently active on the canvas.
     */
    private activePointers: PointerInput[] = [];

    /**
     * The current state of the control.
     */
    private state: Action;

    /**
     * The {@link THREE.Camera} used to render the scene.
     */
    private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;

    /**
     * The {@link HTMLElement} used to listen for mouse / touch events. This must be passed in the constructor; changing it here will not set up new event listeners.
     */
    private domElement: HTMLElement;

    /**
     * Objects that can be selected.
     */
    private object: Object[];

    /**
     * A proxy object that is used by the transform controls.
     */
    private proxy: THREE.Object3D;

    /**
     * The objects that are currently selected.
     */
    private selectedObjects: Object[];

    private onContextMenuEvent: (this: HTMLElement, event: MouseEvent) => void;
    private onPointerDownEvent: (event: PointerEvent) => void;
    private onPointerUpEvent: (event: PointerEvent) => void;
    private onPointerMoveEvent: (event: PointerEvent) => void;

    /**
     * The {@link TransformControls} used to transform selected objects.
     * This is only available if `useTransformControls` is set to `true` in the constructor.
     */
    private transformControls: TransformControls | null;

    /**
     * The {@link THREE.Scene} used to render the transform controls.
     */
    public scene: THREE.Scene;

    /**s
     * This variable can be set by a third party to prevent the pointer up event from being triggered.
     * For example, the `TransformControl` has higher "access" and will set this to `true` when it is active.
     */
    private ignorePointerEvent: boolean;

    /**
     * Installs the necessary functions to the prototype of the given classes.
     */
    static install() {
        THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
        THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
        THREE.Mesh.prototype.raycast = acceleratedRaycast;
    }

    /**
     * Creates a new instance of the controls.
     * @param camera
     * @param domElement
     * @param objects
     * @param config
     */
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
        this.proxy = new THREE.Object3D();
        this.selectedObjects = [];
        this.scene = new THREE.Scene();
        this.scene.add(this.proxy);
        this.config = { ...DefaultConfig, ...config };
        this.enabled = true;
        this.ignorePointerEvent = false;

        // configs
        this.mouseButtons = {
            left: ACTION.SELECT,
            middle: ACTION.NONE,
            right: ACTION.DESELECT,
            wheel: ACTION.NONE,
        };

        this.touches = {
            one: ACTION.TOGGLE,
            two: ACTION.NONE,
            three: ACTION.NONE,
        };

        this.state = 0;

        // additional controls

        this.transformControls = this.config.useTransformControls
            ? new TransformControls(camera, domElement)
            : null;
        if (this.transformControls) {
            this.scene.add(this.transformControls);

            // Manually transform each object
            this.transformControls.addEventListener('objectChange', (_event) => {
                if (!this.transformControls) return;
                switch (this.transformControls.getMode()) {
                    // Handle translation
                    case 'translate':
                        // Get the difference between the proxy's current and original position
                        _position.copy(this.proxy.position).sub(_proxy.position);
                        for (let i = 0; i < this.selectedObjects.length; i++) {
                            const element = this.selectedObjects[i] as THREE.Object3D &
                                Required<Position>;
                            // Add the difference to the original position of the object
                            element.position.copy(element._position).add(_position);
                        }
                        break;
                    // Handle rotation
                    case 'rotate':
                        // If rotations is done as a group.
                        // we need to calculate the pivot point and rotate each object around that point
                        if (this.config.rotateAsGroup) {
                            // We hijack the transform controls to get the rotation axis and angle
                            const { rotationAxis, rotationAngle } = this.transformControls as any;
                            if (rotationAxis == null) return;
                            if (rotationAngle == null) return;
                            _quaternion.setFromAxisAngle(rotationAxis, rotationAngle);

                            // We define the new pivot point (for all objects)
                            const pivotPoint = this.proxy.position;

                            // We create the translation matrices
                            _translateToPivot.makeTranslation(
                                pivotPoint.x,
                                pivotPoint.y,
                                pivotPoint.z,
                            );

                            _translateBack.makeTranslation(
                                -pivotPoint.x,
                                -pivotPoint.y,
                                -pivotPoint.z,
                            );

                            // We create the rotation matrix
                            _rotationMatrix.makeRotationFromQuaternion(_quaternion);

                            // And, finally we combine the matrices
                            // This can probably be done with fewer steps, but it's easier to read this way.
                            _finalMatrix
                                .multiplyMatrices(_translateToPivot, _rotationMatrix)
                                .multiply(_translateBack);

                            for (let i = 0; i < this.selectedObjects.length; i++) {
                                const element = this.selectedObjects[i] as THREE.Object3D &
                                    Required<Position>;
                                // Apply the transformation matrix to the object
                                element.applyMatrix4(_finalMatrix);
                            }
                        } else {
                            // Copy the rotation of the proxy
                            _rotation.copy(this.proxy.rotation);
                            for (let i = 0; i < this.selectedObjects.length; i++) {
                                const element = this.selectedObjects[i] as THREE.Object3D &
                                    Required<Position>;
                                // I.e. all objects rotate around them self
                                element.rotation.copy(_rotation);
                            }
                        }
                    // Handle scale
                    case 'scale':
                        // Copy the scale of the proxy
                        _scale.copy(this.proxy.scale);
                        for (let i = 0; i < this.selectedObjects.length; i++) {
                            const element = this.selectedObjects[i] as THREE.Object3D &
                                Required<Position>;
                            // And apply it to all selected objects
                            element.scale.copy(_scale);
                        }
                    default:
                        break;
                }
                // Update the matrices of the objects, if necessary
                if (this.config.updateLocalMatrices || this.config.updateWorldMatrices) {
                    for (let i = 0; i < this.selectedObjects.length; i++) {
                        const element = this.selectedObjects[i] as THREE.Object3D &
                            Required<Position>;
                        if (this.config.updateLocalMatrices) {
                            element.updateMatrix();
                        }
                        if (this.config.updateWorldMatrices) {
                            element.updateMatrixWorld();
                        }
                    }
                }
            });
            if (this.config.cameraControls) {
                this.transformControls.addEventListener('dragging-changed', (event) => {
                    this.config.cameraControls!.enabled = !event.value;
                });
            }
        }
        // events

        this.onContextMenuEvent = this._onContextMenu.bind(this);
        this.onPointerDownEvent = this._onPointerDown.bind(this);
        this.onPointerUpEvent = this._onPointerUp.bind(this);
        this.onPointerMoveEvent = this._onPointerMove.bind(this);
        this.activate();
    }

    /**
     * Updates the configuration of the controls.
     * @param newConfig The new configuration.
     */
    public updateConfig(newConfig: Partial<Config>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Activates the controls.
     */
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

    protected findPointerById(pointerId: number): PointerInput | undefined {
        return this.activePointers.find((activePointer) => activePointer.pointerId === pointerId);
    }

    protected findPointerByMouseButton(mouseButton: MOUSE_BUTTON): PointerInput | undefined {
        return this.activePointers.find(
            (activePointer) => activePointer.mouseButton === mouseButton,
        );
    }

    /**
     * Set the state of the controls.
     * All actions are then handled by the `pointerUpEvent`.
     * @param event {@link PointerEvent}
     */
    private _onPointerDown(event: PointerEvent): void {
        if (this.enabled === false) return;

        // If a transform controls is active, we ignore the pointer down event.
        if (this.transformControls && this.transformControls.axis) {
            this.ignorePointerEvent = true;
            return;
        }
        // Figure out which action to trigger
        const mouseButton =
            event.pointerType !== 'mouse'
                ? null
                : (event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT
                ? MOUSE_BUTTON.LEFT
                : (event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.MIDDLE
                ? MOUSE_BUTTON.MIDDLE
                : (event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.RIGHT
                ? MOUSE_BUTTON.RIGHT
                : null;

        // Edge case for touch events
        if (mouseButton !== null) {
            const zombiePointer = this.findPointerByMouseButton(mouseButton);
            zombiePointer &&
                this.activePointers.splice(this.activePointers.indexOf(zombiePointer), 1);
        }

        // Add pointer to active pointers
        const pointer = {
            pointerId: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
            deltaX: 0,
            deltaY: 0,
            mouseButton,
        } as PointerInput;

        this.activePointers.push(pointer);

        // Set the state of the controls
        if (event.pointerType === 'touch') {
            switch (this.activePointers.length) {
                case 1:
                    this.state = this.touches.one;
                    break;

                case 2:
                    this.state = this.touches.two;
                    break;

                case 3:
                    this.state = this.touches.three;
                    break;
            }
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
    }

    /**
     * Given a state, try to perform an action.
     * @param event {@link PointerEvent}
     */
    private _onPointerUp(event: PointerEvent) {
        if (this.enabled === false) return;
        // Ignore pointer up events if a transform controls is active.
        if (this.ignorePointerEvent) {
            this.ignorePointerEvent = false;
            return;
        }

        // Check if the pointer is active
        const pointerId = event.pointerId;
        const pointer = this.findPointerById(pointerId);
        pointer && this.activePointers.splice(this.activePointers.indexOf(pointer), 1);
        if (!this.state) return;

        // Perform a raycast by first updating the pointer
        this.updatePointer(event);
        // Then setting the raycaster
        _raycaster.setFromCamera(_pointer, this.camera);
        // And finally intersecting the objects.
        _intersects = [];
        _raycaster.intersectObjects(
            [...this.object, ...this.proxy.children],
            this.config.recursive,
            _intersects,
        );

        // Raycast miss
        if (_intersects[0] == null) {
            if (this.config.deselectOnRaycastMiss) {
                this.deselectAllObjects();
            }
            return;
        }

        // Raycast hit
        const { object: intersectedObject } = _intersects[0];
        let alreadySelected = false;
        // Check if already selected.
        for (let i = 0; i < this.selectedObjects.length; i++) {
            const element = this.selectedObjects[i];
            if (element.uuid !== intersectedObject.uuid) continue;
            alreadySelected = true;
            break;
        }

        // If already selected, we check if we need to deselect or toggle.
        if (alreadySelected) {
            if (this.state === ACTION.TOGGLE || this.state === ACTION.DESELECT) {
                this.deselectObject(intersectedObject);
            }
            return;
        }
        // Return If we got a deselect event, but nothing to deselect.
        if (this.state === ACTION.DESELECT) return;
        this.selectObject(intersectedObject);
    }

    /**
     * Selects an object and attaches it to the transform control.
     * @param object
     */
    selectObject<T extends Object>(object: T): void {
        if (this.selectObject.length === 0) {
            _proxy.position.copy(this.proxy.position);
            _proxy.rotation.copy(this.proxy.rotation);
            _proxy.scale.copy(this.proxy.scale);
        }
        object._position = object.position.clone();
        this.selectedObjects.push(object);
        this.attachObjectToTransformControl();
        this.dispatchEvent({ type: 'select', object });
    }

    /**
     * De-selects an object and detaches it from the transform control.
     * @param object
     */
    deselectObject<T extends Object>(object: T): void {
        for (let i = 0; i < this.selectedObjects.length; i++) {
            const element = this.selectedObjects[i];
            if (element.uuid !== object.uuid) continue;
            element._position = undefined;
            // Swap the last element with the element to remove.
            this.selectedObjects[i] = this.selectedObjects[this.selectedObjects.length - 1];
            // Popping an array is faster than trying to splice it.
            this.selectedObjects.pop();
            break;
        }

        this.detachObjectToTransformControl();
        this.dispatchEvent({ type: 'deselect', object });
    }

    /**
     * De-selects all objects and detaches them from the transform control.
     */
    deselectAllObjects(): void {
        for (let i = 0; i < this.selectedObjects.length; i++) {
            const object = this.selectedObjects[i];
            this.dispatchEvent({ type: 'deselect', object });
        }

        this.selectedObjects = [];
        this.detachObjectToTransformControl();
    }

    /**
     * Attaches the proxy object to the transform control.
     */
    private attachObjectToTransformControl(): void {
        if (this.config.useTransformControls === false) return;
        if (this.transformControls === null) return;
        if (this.selectedObjects.length === 0) return;
        // Detach and re-compute the center.
        this.transformControls.detach();
        this.handleTransformControlsCenter();
        this.transformControls.attach(this.proxy);
    }

    /**
     * Detaches the proxy object from the transform control.
     */
    private detachObjectToTransformControl(): void {
        if (this.config.useTransformControls === false) return;
        if (this.transformControls === null) return;
        // Detach and re-compute the center, if necessary
        this.transformControls.detach();
        if (this.selectedObjects.length === 0) return;
        this.handleTransformControlsCenter();
        this.transformControls.attach(this.proxy);
    }

    /**
     * Computes the center of all selected objects and offsets them accordingly.
     */
    private handleTransformControlsCenter(): void {
        // Reset sum
        _sum.set(0, 0, 0);

        // Iterate all selected objects, find it's world position.
        for (let i = 0; i < this.selectedObjects.length; i++) {
            const object = this.selectedObjects[i];
            object.getWorldPosition(_position);

            // Find the new average
            _sum.add(_position);
        }
        // This is the center for the tranform controls.
        _averagePoint.copy(_sum.divideScalar(this.selectedObjects.length));

        // Offset all objects with the new center
        for (let i = 0; i < this.selectedObjects.length; i++) {
            const object = this.selectedObjects[i] as THREE.Object3D & Required<Position>;
            object._position = object.position.clone().sub(_averagePoint);
        }
        // Set the new center
        this.proxy.position.copy(_averagePoint);
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
        this.domElement.addEventListener('pointerup', this.onPointerUpEvent);
        this.domElement.addEventListener('pointermove', this.onPointerMoveEvent);
    }

    /**
     * Removes the event listeners of the controls.
     */
    public deactivate(): void {
        this.domElement.removeEventListener('contextmenu', this.onContextMenuEvent);
        this.domElement.removeEventListener('pointerdown', this.onPointerDownEvent);
        this.domElement.removeEventListener('pointerup', this.onPointerUpEvent);
        this.domElement.removeEventListener('pointermove', this.onPointerMoveEvent);
        this.proxy.clear();
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

    /**
     * Gets the transform controls instance.
     * @returns The transform controls instance.
     */
    public getTransformControls(): TransformControls | null {
        return this.transformControls;
    }
}
