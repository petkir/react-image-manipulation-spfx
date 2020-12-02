import * as React from 'react';
import styles from './ImageFocusPoint.module.scss';
import { DisplayMode } from '@microsoft/sp-core-library';
import { IconButton, Icon } from 'office-ui-fabric-react';
import { CSSProperties } from 'react';
import { shallowEqual } from '../../helper/shallowEqual';

export interface IFocusPoint {
  x: number;
  y: number;
}

export interface IImageFocusPointProps {
  src: string;
  height: number;
  alt?: string;
  focusPoint?: IFocusPoint;
  editEnabled?: boolean;
  editButtonClicked?: () => void;
  onFocusPointChanged?: (focusPoint: IFocusPoint) => void
}

export interface IImageFocusPointState {
  statekey: string;
  moving: boolean;
  focusPoint?: IFocusPoint;
}

export default class ImageFocusPoint extends React.Component<IImageFocusPointProps, IImageFocusPointState> {
  private img: HTMLImageElement | null;
  private container: HTMLDivElement | null;
  private navpoint: HTMLDivElement | null;
  constructor(props: IImageFocusPointProps) {
    super(props);

    this.state = {
      statekey: new Date().getTime().toString(),
      moving: false
    };
    this.reRender = this.reRender.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this)
    this.handleMove = this.handleMove.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
  }
  public componentDidMount(): void {
    if (this.props.focusPoint) {
      this.setState({ focusPoint: this.props.focusPoint });
    }
    this.reRender()
    window.addEventListener("resize", this.reRender)
  }

  public componentDidUpdate(prevProps: IImageFocusPointProps): void {
    if (this.props.focusPoint && prevProps.focusPoint) {
      if (!shallowEqual(this.props.focusPoint, prevProps.focusPoint)) {
        this.setState({ focusPoint: this.props.focusPoint });
      }
    } else if (
      (!this.props.focusPoint && prevProps.focusPoint) ||
      (this.props.focusPoint && !prevProps.focusPoint)) {
      this.setState({ focusPoint: this.props.focusPoint });
    }
  }

  public componentWillUnmount(): void {
    window.removeEventListener("resize", this.reRender)
  }

  public render(): React.ReactElement<IImageFocusPointProps> {
    const { src, alt } = this.props

    return (
      <div>
        {this.EditIconButton()}
        <div ref={el => (this.container = el)} style={{ height: this.props.height }}
          className={styles.imageContainer}
        >
          {this.props.editEnabled && (<div
            onMouseUp={this.handleDragEnd}
            onDragEnd={this.handleDragEnd}
            onDrag={this.handleMove}
            onDragStart={this.handleDragStart}
            onMouseLeave={this.handleDragEnd}
            draggable={true}
            ref={el => (this.navpoint = el)}
            className={styles.navigator}
          ><Icon iconName={'SIPMove'}
            /></div>)}
          <img
            ref={el => (this.img = el)}
            className={styles.image}
            style={this.getImageStyles()}
            src={src}
            alt={alt}
            onLoad={this.reRender}
          //draggable={false}
          />
        </div>
      </div>
    );
  }

  public EditIconButton(): JSX.Element {
    return (<IconButton
      iconProps={{ iconName: 'FocusPoint' }}
      title="LOCFocusPoint"
      ariaLabel="LOCFocusPoint"
      onClick={() => {
        if (this.props.editButtonClicked) {
          this.props.editButtonClicked();
        }
      }}
    />);
  }

  private reRender(): void {
    this.setState({ statekey: new Date().getTime().toString() })
  }

  private getImageStyles(): CSSProperties {
    console.log('getstyle');
    if (this.img && this.container) {
      const { focusPoint } = this.state
      let workingpoint = focusPoint;
      if (!workingpoint) {
        workingpoint = { x: 0.5, y: 0.5 }
      }
      const imageHeight = this.img.naturalHeight
      const imageWidth = this.img.naturalWidth
      const containerHeight = this.container.getBoundingClientRect().height
      const containerWidth = this.container.getBoundingClientRect().width

      if (!imageHeight || !imageWidth || !containerHeight || !containerWidth) {
        console.log('container or image is null');
        return {}
      }

      const style: CSSProperties = {};

      const widthRatio = imageWidth / containerWidth
      const heightRatio = imageHeight / containerHeight

      if (widthRatio > heightRatio) {

        style.left = this.calculate(
          heightRatio,
          containerWidth,
          imageWidth,
          workingpoint.x,
        )
      } else {
        style.top = this.calculate(
          widthRatio,
          containerHeight,
          imageHeight,
          workingpoint.y,
        )
      }
      return style
    }
    return {};
  }

  private calculate(
    dimensionRatio: number,
    containerSize: number,
    imageSize: number,
    focus: number,
  ): number {
    const containerCenter = containerSize / 2
    const scaledImage = imageSize / dimensionRatio
    const scaledFocus = scaledImage * focus
    if (scaledFocus > scaledImage - containerCenter) {
      return (scaledImage - containerSize) * -1
    }
    if (scaledFocus < containerCenter) {
      return 0
    }
    return (scaledFocus - containerCenter) * -1
  }

  private handleDragStart(e: any): void {
    this.setState({ moving: true })
    this.updateCoordinates(e)
  }

  private handleDragEnd(): void {
    if (this.state.moving) {
      const { onFocusPointChanged } = this.props
      this.setState({ moving: false })
      if (onFocusPointChanged) {
        onFocusPointChanged(this.state.focusPoint)
      }
    }
  }

  private handleMove(e: any): void {
    if (this.state.moving && this.container) {
      this.updateCoordinates(e)
    }
  }

  private updateCoordinates(e: any): void {
    if (this.container) {
      const containerRect = this.container.getBoundingClientRect()
      const navpointRect = this.container.getBoundingClientRect()
      console.log(`left:${containerRect.left} width:${containerRect.width}`);
      console.log(`left:${containerRect.top} width:${containerRect.height}`);
      console.log(`cX:${e.clientX} navpoint left:${navpointRect.left}`);
      console.log(`cY:${e.clientY} navpoint top:${navpointRect.top}`);
      const x =
        Math.round(
          (e.clientX )/ containerRect.width * 1000,
        ) / 1000
      const y =
        Math.round(
          (e.clientY) / containerRect.height * 1000,
        ) / 1000
      if (0 <= x && x <= 1 && 0 <= y && y <= 1) {
        const point: IFocusPoint = { x: x, y: y };
        this.setState({ focusPoint: point });
        if (this.props.onFocusPointChanged) { this.props.onFocusPointChanged(point); }
      } else {
        this.setState({ moving: false })
        this.handleDragEnd()
      }
    }
  }

}
