import type { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

export type GenericControls = {
    enabled: boolean;
};

export type Config = {
    /**
     *  If true, it also checks all descendants. Otherwise it only checks intersection with the object. Default is false.
     */
    recursive: boolean;
    useTransformControls: boolean;
    transformControls: TransformControls | null;
    controls: GenericControls | null;
    /**
     * If true, any raycast miss will result in a deselect.
     * Note that camera controls may interfere with this logic.
     */
    deselectOnRaycastMiss: boolean;
};

export const DefaultConfig: Config = Object.freeze({
    recursive: false,
    useTransformControls: true,
    transformControls: null,
    controls: null,
    deselectOnRaycastMiss: false,
});

// see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#value
export const MOUSE_BUTTON = {
    LEFT: 1,
    RIGHT: 2,
    MIDDLE: 4,
} as const;
export type MOUSE_BUTTON = typeof MOUSE_BUTTON[keyof typeof MOUSE_BUTTON];

export const ACTION = Object.freeze({
    NONE: 0,
    SELECT: 1,
    MULTI_SELECT: 2,
    DESELECT: 4,
    TOGGLE: 8,
} as const);

export type Action = number;

export type MouseButtons = {
    left: mouseButtonAction;
    middle: mouseButtonAction;
    right: mouseButtonAction;
    wheel: mouseWheelAction;
};

export type mouseButtonAction =
    | typeof ACTION.NONE
    | typeof ACTION.SELECT
    | typeof ACTION.MULTI_SELECT
    | typeof ACTION.DESELECT
    | typeof ACTION.TOGGLE;

type mouseWheelAction = typeof ACTION.NONE;

export type Touches = {
    one: singleTouchAction;
    two: multiTouchAction;
    three: multiTouchAction;
};

export type singleTouchAction =
    | typeof ACTION.NONE
    | typeof ACTION.SELECT
    | typeof ACTION.MULTI_SELECT
    | typeof ACTION.DESELECT
    | typeof ACTION.TOGGLE;

export type multiTouchAction =
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
