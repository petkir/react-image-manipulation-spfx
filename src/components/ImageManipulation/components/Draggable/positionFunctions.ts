// @flow
import { isNum, int } from './shims';
import ReactDOM from 'react-dom';
import { getTouch, innerWidth, innerHeight, offsetXYFromParent, outerWidth, outerHeight } from './domFunctions';
import { IBounds, IControlPosition, IDraggableData, MouseTouchEvent } from './types';
import Draggable from './Draggable';
import DraggableCore, { IDraggableBounds } from './DraggableCore';


export function getBoundPosition(draggable: Draggable, x: number, y: number): [number, number] {
  // If no bounds, short-circuit and move on


  // Clone new bounds
  const { bounds } = draggable.props;
  if (!bounds) return [x, y];
  const node: HTMLElement = findDOMNode(draggable);
  let boundsObject :IDraggableBounds = undefined;
  if (typeof bounds === 'string') {
    const { ownerDocument } = node;
    const ownerWindow = ownerDocument.defaultView;
    let boundNode: Node | Element |HTMLElement;
    if (bounds === 'parent') {
      boundNode = node.parentNode;
    } else {
      boundNode = ownerDocument.querySelector(bounds);
    }
    if (!(boundNode instanceof (ownerWindow as any).HTMLElement)) {
      throw new Error('Bounds selector "' + bounds + '" could not find an element.');
    }
    const nodeStyle = ownerWindow.getComputedStyle(node as HTMLElement);
    const boundNodeStyle = ownerWindow.getComputedStyle(boundNode as Element);
    // Compute bounds. This is a pain with padding and offsets but this gets it exactly right.
     boundsObject  =
     {
      left: -node.offsetLeft + int(boundNodeStyle.paddingLeft) + int(nodeStyle.marginLeft),
      top: -node.offsetTop + int(boundNodeStyle.paddingTop) + int(nodeStyle.marginTop),
      right: innerWidth(boundNode as HTMLElement) - outerWidth(node) - node.offsetLeft +
        int(boundNodeStyle.paddingRight) - int(nodeStyle.marginRight),
      bottom: innerHeight(boundNode as HTMLElement) - outerHeight(node) - node.offsetTop +
        int(boundNodeStyle.paddingBottom) - int(nodeStyle.marginBottom)
    };
  } else  {
    boundsObject =  cloneBounds(bounds);;
  // Keep x and y below right and bottom limits...
  if (isNum(boundsObject.right)) x = Math.min(x, boundsObject.right);
  if (isNum(boundsObject.bottom)) y = Math.min(y, boundsObject.bottom);
  // But above left and top limits.
  if (isNum(boundsObject.left)) x = Math.max(x, boundsObject.left);
  if (isNum(boundsObject.top)) y = Math.max(y, boundsObject.top);

  return [x, y];
}
}

export function snapToGrid(grid: [number, number], pendingX: number, pendingY: number): [number, number] {
  const x = Math.round(pendingX / grid[0]) * grid[0];
  const y = Math.round(pendingY / grid[1]) * grid[1];
  return [x, y];
}

export function canDragX(draggable: Draggable): boolean {
  return draggable.props.axis === 'both' || draggable.props.axis === 'x';
}

export function canDragY(draggable: Draggable): boolean {
  return draggable.props.axis === 'both' || draggable.props.axis === 'y';
}

// Get {x, y} positions from event.
export function getControlPosition(e: MouseTouchEvent, touchIdentifier?: number, draggableCore?: DraggableCore): IControlPosition {
  const touchObj = typeof touchIdentifier === 'number' ? getTouch(e, touchIdentifier) : null;
  if (typeof touchIdentifier === 'number' && !touchObj) return null; // not the right touch
  const node: Element = findDOMNode(draggableCore) as HTMLElement;
  // User can provide an offsetParent if desired.

  const offsetParent = draggableCore.props.offsetParent || (node as any).offsetParent || node.ownerDocument.body;
  return offsetXYFromParent(touchObj || e, offsetParent as any);
}

// Create an data object exposed by <DraggableCore>'s events
export function createCoreData(draggable: DraggableCore, x: number, y: number): IDraggableData {
  const state = draggable.state;
  const isStart = !isNum(state.lastX);
  const node = findDOMNode(draggable);

  if (isStart) {
    // If this is our first move, use the x and y as last coords.
    return {
      node,
      deltaX: 0, deltaY: 0,
      lastX: x, lastY: y,
      x, y,
    };
  } else {
    // Otherwise calculate proper values.
    return {
      node,
      deltaX: x - state.lastX, deltaY: y - state.lastY,
      lastX: state.lastX, lastY: state.lastY,
      x, y,
    };
  }
}

// Create an data exposed by <Draggable>'s events
export function createDraggableData(draggable: Draggable, coreData: IDraggableData): IDraggableData {
  const scale = draggable.props.scale;
  return {
    node: coreData.node,
    x: draggable.state.x + (coreData.deltaX / scale),
    y: draggable.state.y + (coreData.deltaY / scale),
    deltaX: (coreData.deltaX / scale),
    deltaY: (coreData.deltaY / scale),
    lastX: draggable.state.x,
    lastY: draggable.state.y
  };
}

// A lot faster than stringify/parse
function cloneBounds(bounds: IBounds): IBounds {
  return {
    left: bounds.left,
    top: bounds.top,
    right: bounds.right,
    bottom: bounds.bottom
  };
}

function findDOMNode(draggable: Draggable | DraggableCore): HTMLElement {
  const node = ReactDOM.findDOMNode(draggable);
  if (!node) {
    throw new Error('<DraggableCore>: Unmounted during event!');
  }
  // $FlowIgnore we can't assert on HTMLElement due to tests... FIXME
  return node as HTMLElement;
}
