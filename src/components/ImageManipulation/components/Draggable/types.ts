
export type DraggableEventHandler = (e: MouseEvent, data: IDraggableData) => void | false;

export interface IDraggableData  {
  node: HTMLElement,
  x: number, y: number,
  deltaX: number, deltaY: number,
  lastX: number, lastY: number
};

export interface IBounds {
  left: number, top: number, right: number, bottom: number
};
export interface IControlPosition { x: number, y: number };
export interface IPositionOffsetControlPosition { x: number | string, y: number | string };
export type EventHandler<T> = (e: T) => void | false;

// Missing in Flow
export interface SVGElement extends HTMLElement {
}

// Missing targetTouches
export interface TouchEvent2 extends TouchEvent {
  changedTouches: TouchList;
  targetTouches: TouchList;
}

export type MouseTouchEvent = MouseEvent & TouchEvent2;
