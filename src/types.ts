import type { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

/**
 * The configuration object for the MultiSelect.
 */
export type GenericControls = {
    enabled: boolean;
};

/**
 * The configuration object for the MultiSelect.
 */
export type Config = {
    /**
     *  If true, it also checks all descendants. Otherwise it only checks intersection with the object. Default is false.
     */
    recursive: boolean;
    useTransformControls: boolean;
    transformControls: TransformControls | null;
    /**
     * The controls to use for the camera.
     * If `transformControls` are provided, this camera controls will be disabled during transform.
     */
    cameraControls: GenericControls | null;
    /**
     * If true, any raycast miss will result in a deselect.
     * Note that camera controls may interfere with this logic.
     */
    deselectOnRaycastMiss: boolean;
    /**
     * If true, update the selected objects local transformation matrices.
     */
    updateLocalMatrices: boolean;
    /**
     * If true, update the selected objects local transformation matrices.
     */
    updateWorldMatrices: boolean;
    /**
     * If true, the selected objects will rotate as a group around the center of the selection.
     * If false, all objects are rotated individually around themself.
     */
    rotateAsGroup: boolean;
};

/**
 * The default configuration object for the MultiSelect.
 */
export const DefaultConfig: Config = Object.freeze({
    recursive: false,
    useTransformControls: true,
    transformControls: null,
    cameraControls: null,
    deselectOnRaycastMiss: false,
    updateLocalMatrices: false,
    updateWorldMatrices: false,
    rotateAsGroup: false,
});

// see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#value
export const MOUSE_BUTTON = {
    LEFT: 1,
    RIGHT: 2,
    MIDDLE: 4,
} as const;
export type MOUSE_BUTTON = (typeof MOUSE_BUTTON)[keyof typeof MOUSE_BUTTON];

export const ACTION = Object.freeze({
    NONE: 0,
    SELECT: 1,
    MULTI_SELECT: 2,
    DESELECT: 4,
    TOGGLE: 8,
} as const);

export type Action = number;

export type MouseButtons = {
    left: MouseButtonAction;
    middle: MouseButtonAction;
    right: MouseButtonAction;
    wheel: MouseWheelAction;
};

export type MouseButtonAction =
    | typeof ACTION.NONE
    | typeof ACTION.SELECT
    | typeof ACTION.MULTI_SELECT
    | typeof ACTION.DESELECT
    | typeof ACTION.TOGGLE;

type MouseWheelAction = typeof ACTION.NONE;

export type Touches = {
    one: SingleTouchAction;
    two: MultiTouchAction;
    three: MultiTouchAction;
};

export type SingleTouchAction =
    | typeof ACTION.NONE
    | typeof ACTION.SELECT
    | typeof ACTION.MULTI_SELECT
    | typeof ACTION.DESELECT
    | typeof ACTION.TOGGLE;

export type MultiTouchAction =
    | typeof ACTION.NONE
    | typeof ACTION.SELECT
    | typeof ACTION.MULTI_SELECT
    | typeof ACTION.DESELECT
    | typeof ACTION.TOGGLE;

export type MultiSelectEventMap = {
    select: { type: 'select'; object: THREE.Object3D };
    deselect: { type: 'deselect'; object: THREE.Object3D };
};

export interface PointerInput {
    pointerId: number;
    clientX: number;
    clientY: number;
    deltaX: number;
    deltaY: number;
    mouseButton: MOUSE_BUTTON | null;
}
