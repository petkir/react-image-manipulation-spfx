
import * as React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { createCSSTransform, createSVGTransform } from './domFunctions';
import { canDragX, canDragY, createDraggableData, getBoundPosition } from './positionFunctions';

import DraggableCore from './DraggableCore';
import { IControlPosition, IPositionOffsetControlPosition, IDraggableBounds, IDraggableCoreProps } from './DraggableCore';

import { clone } from '@microsoft/sp-lodash-subset';
import { DraggableEventHandler } from './types';




export interface IDraggableState {
  dragging: boolean;
  dragged: boolean;
  x: number;
  y: number;
  slackX: number;
  slackY: number;
  isElementSVG: boolean;
};

export interface IDraggableProps extends IDraggableCoreProps {
  axis: 'both' | 'x' | 'y' | 'none',
  bounds: IDraggableBounds | string | false,
  defaultClassName: string,
  defaultClassNameDragging: string,
  defaultClassNameDragged: string,
  defaultPosition: IControlPosition,
  positionOffset: IPositionOffsetControlPosition,
  position: IControlPosition,
  scale: number
};

//
// Define <Draggable>
//

export default class Draggable extends React.Component<IDraggableProps, IDraggableState> {


  static defaultProps = {
    ...DraggableCore.defaultProps,
    axis: 'both',
    bounds: false,
    defaultClassName: 'react-draggable',
    defaultClassNameDragging: 'react-draggable-dragging',
    defaultClassNameDragged: 'react-draggable-dragged',
    defaultPosition: { x: 0, y: 0 },
    position: null,
    scale: 1
  };

  constructor(props: IDraggableProps) {
    super(props);

    this.state = {
      // Whether or not we are currently dragging.
      dragging: false,

      // Whether or not we have been dragged before.
      dragged: false,

      // Current transform x and y.
      x: props.position ? props.position.x : props.defaultPosition.x,
      y: props.position ? props.position.y : props.defaultPosition.y,

      // Used for compensating for out-of-bounds drags
      slackX: 0, slackY: 0,

      // Can only determine if SVG after mounting
      isElementSVG: false
    };

    if (props.position && !(props.onDrag || props.onStop)) {
      // eslint-disable-next-line no-console
      console.warn('A `position` was applied to this <Draggable>, without drag handlers. This will make this ' +
        'component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the ' +
        '`position` of this element.');
    }
  }

  componentDidMount() {
    // Check to see if the element passed is an instanceof SVGElement
    const browserWindow = window as any;
    if (typeof browserWindow.SVGElement !== 'undefined' && ReactDOM.findDOMNode(this) instanceof browserWindow.SVGElement) {
      this.setState({ isElementSVG: true });
    }
  }

  componentWillReceiveProps(nextProps: IDraggableProps) {
    // Set x/y if position has changed
    if (nextProps.position &&
      (!this.props.position ||
        nextProps.position.x !== this.props.position.x ||
        nextProps.position.y !== this.props.position.y
      )
    ) {
      this.setState({ x: nextProps.position.x, y: nextProps.position.y });
    }
  }

  public componentWillUnmount() {
    this.setState({ dragging: false }); // prevents invariant if unmounted while dragging
  }

  public onDragStart: DraggableEventHandler = (e, coreData) => {

    // Short-circuit if user's callback killed it.
    const shouldStart = this.props.onStart(e, createDraggableData(this, coreData));
    // Kills start event on core as well, so move handlers are never bound.
    if (shouldStart === false) return false;

    this.setState({ dragging: true, dragged: true });
  }

  public onDrag: DraggableEventHandler = (e, coreData) => {
    if (!this.state.dragging) return false;
    const uiData = createDraggableData(this, coreData);

    const newState: IDraggableState = clone(this.state);
    newState.x = uiData.x;
    newState.y = uiData.y;


    // Keep within bounds.
    if (this.props.bounds) {
      // Save original x and y.
      const { x, y } = newState;

      // Add slack to the values used to calculate bound position. This will ensure that if
      // we start removing slack, the element won't react to it right away until it's been
      // completely removed.
      newState.x += this.state.slackX;
      newState.y += this.state.slackY;

      // Get bound position. This will ceil/floor the x and y within the boundaries.
      const [newStateX, newStateY] = getBoundPosition(this, newState.x, newState.y);
      newState.x = newStateX;
      newState.y = newStateY;

      // Recalculate slack by noting how much was shaved by the boundPosition handler.
      newState.slackX = this.state.slackX + (x - newState.x);
      newState.slackY = this.state.slackY + (y - newState.y);

      // Update the event we fire to reflect what really happened after bounds took effect.
      uiData.x = newState.x;
      uiData.y = newState.y;
      uiData.deltaX = newState.x - this.state.x;
      uiData.deltaY = newState.y - this.state.y;
    }

    // Short-circuit if user's callback killed it.
    const shouldUpdate = this.props.onDrag(e, uiData);
    if (shouldUpdate === false) return false;

    this.setState(newState);
  }

  public onDragStop: DraggableEventHandler = (e, coreData) => {
    if (!this.state.dragging) return false;

    // Short-circuit if user's callback killed it.
    const shouldStop = this.props.onStop(e, createDraggableData(this, coreData));
    if (shouldStop === false) return false;


    const newState: IDraggableState = {
      dragging: false,
      slackX: 0,
      slackY: 0,
      dragged: false,
      x: this.state.x,
      y: this.state.y,
      isElementSVG: this.state.isElementSVG
    };

    // If this is a controlled component, the result of this operation will be to
    // revert back to the old position. We expect a handler on `onDragStop`, at the least.
    const controlled = Boolean(this.props.position);
    if (controlled) {
      const { x, y } = this.props.position;
      newState.x = x;
      newState.y = y;
    }

    this.setState(newState);
  };

  render(): JSX.Element {
    let style = {}, svgTransform = null;

    // If this is controlled, we don't want to move it - unless it's dragging.
    const controlled = Boolean(this.props.position);
    const draggable = !controlled || this.state.dragging;

    const position = this.props.position || this.props.defaultPosition;
    const transformOpts = {
      // Set left if horizontal drag is enabled
      x: canDragX(this) && draggable ?
        this.state.x :
        position.x,

      // Set top if vertical drag is enabled
      y: canDragY(this) && draggable ?
        this.state.y :
        position.y
    };

    // If this element was SVG, we use the `transform` attribute.
    if (this.state.isElementSVG) {
      svgTransform = createSVGTransform(transformOpts, this.props.positionOffset);
    } else {
      // Add a CSS transform to move the element around. This allows us to move the element around
      // without worrying about whether or not it is relatively or absolutely positioned.
      // If the item you are dragging already has a transform set, wrap it in a <span> so <Draggable>
      // has a clean slate.
      style = createCSSTransform(transformOpts, this.props.positionOffset);
    }

    const {
      defaultClassName,
      defaultClassNameDragging,
      defaultClassNameDragged
    } = this.props;

    const children = React.Children.only(this.props.children);

    // Mark with class while dragging
    const className = classNames((children.props.className || ''), defaultClassName, {
      [defaultClassNameDragging]: this.state.dragging,
      [defaultClassNameDragged]: this.state.dragged
    });

    // Reuse the child provided
    // This makes it flexible to use whatever element is wanted (div, ul, etc)
    return (
      <DraggableCore {...this.props} onStart={this.onDragStart} onDrag={this.onDrag} onStop={this.onDragStop}>
        {React.cloneElement(children, {
          className: className,
          style: { ...children.props.style, ...style },
          transform: svgTransform
        })}
      </DraggableCore>
    );
  }
}
