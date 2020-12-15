import { noWrap } from 'office-ui-fabric-react';
import { IPosition } from 'office-ui-fabric-react/lib-es2015/utilities/positioning';
import * as React from 'react';
import { ICrop } from '../ImageManipulation';
import styles from './ImageCrop.module.scss';

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}


export interface IImageCropProps {
  crop: ICrop;
  aspect?: number;
  sourceHeight: number;
  sourceWidth: number;
  showRuler?: boolean
  onDragStart?: (e: MouseEvent) => void;
  onComplete?: (crop: ICrop) => void;
  onChange?: (crop: ICrop) => void;
  onDragEnd: (e) => void;
}

export interface IImageCropState {
  cropIsActive: boolean;
  newCropIsBeingDrawn: boolean;
}

export enum nodePoition {
  NW,
  N,
  NE,
  E,
  SE,
  S,
  SW,
  W

}

export interface IMousePosition {
  x: number;
  y: number;
}

export interface ICropData {
  clientStartX: number;
  clientStartY: number;
  cropStartWidth: number;
  cropStartHeight: number;
  cropStartX: number;
  cropStartY: number;
  xCrossOver: boolean;
  yCrossOver: boolean;
  startXCrossOver: boolean;
  startYCrossOver: boolean;
  isResize: boolean;
  pos?: nodePoition;
  xDiff: number;
  yDiff: number;
};

// Feature detection
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners
let passiveSupported = false;

export default class ImageCrop extends React.Component<IImageCropProps, IImageCropState> {

  private controlRef: HTMLDivElement = null;

  private dragStarted: boolean = false;
  private mouseDownOnCrop: boolean = false;
  private evData: ICropData;

  constructor(props: IImageCropProps) {
    super(props);
    this.state = {
      cropIsActive: false,
      newCropIsBeingDrawn: false
    };
    this.onDocMouseTouchMove = this.onDocMouseTouchMove.bind(this);
    this.onDocMouseTouchEnd = this.onDocMouseTouchEnd.bind(this);
    this.onCropMouseTouchDown = this.onCropMouseTouchDown.bind(this);
    this.setControlRef = this.setControlRef.bind(this);
  }

  public componentDidMount(): void {
    const { crop, sourceHeight, sourceWidth } = this.props;
    console.log('componentDidMount');
    if (crop && this.isValid(crop) &&
      (crop.sx !== 0 || crop.sy !== 0 || crop.width !== 0 && crop.height !== 0)
    ) {
      console.log('componentDidMount');
      this.setState({ cropIsActive: true });
    }

  }

  public componentWillUnmount(): void {

  }




  public render(): React.ReactElement<IImageCropProps> {
    const { crop } = this.props;
    const { cropIsActive, newCropIsBeingDrawn } = this.state;
    const cropSelection = this.isValid(crop) && this.controlRef ? this.createSelectionGrid() : null;
    return (
      <div ref={this.setControlRef}
        className={styles.ImgGridShadowOverlay}
        onMouseMove={this.onDocMouseTouchMove}
        onTouchMove={this.onDocMouseTouchMove}
        onMouseUp={this.onDocMouseTouchEnd}
        onTouchCancel={this.onDocMouseTouchEnd}
        onTouchEnd={this.onDocMouseTouchEnd}
      //  onMouseDown={this.onCropMouseTouchDown}
      //  onTouchStart={this.onCropMouseTouchDown}
      >
        <div className={styles.ImgGridVisible}
          style={
            {
              left: 0,
              top: 0,
              right: 0,
              bottom: 0
            }
          }>
          {cropSelection}
        </div>
      </div>
    );
  }

  private createSelectionGrid(): JSX.Element {
    const { showRuler } = this.props;
    const style = this.getCropStyle();

    return (
      <div
        style={style}
        className={styles.CropContrainer}
        onMouseDown={this.onCropMouseTouchDown}
        onTouchStart={this.onCropMouseTouchDown}
      >


        <div className={styles.dragBar_n} data-ord={nodePoition.N} />
        <div className={styles.dragBar_e} data-ord={nodePoition.E} />
        <div className={styles.dragBar_s} data-ord={nodePoition.S} />
        <div className={styles.dragBar_w} data-ord={nodePoition.W} />

        <div className={[styles.dragHandle, styles.nw].join(' ')} data-ord={nodePoition.NW} />
        <div className={[styles.dragHandle, styles.n].join(' ')} data-ord={nodePoition.N} />
        <div className={[styles.dragHandle, styles.ne].join(' ')} data-ord={nodePoition.NE} />
        <div className={[styles.dragHandle, styles.e].join(' ')} data-ord={nodePoition.E} />
        <div className={[styles.dragHandle, styles.se].join(' ')} data-ord={nodePoition.SE} />
        <div className={[styles.dragHandle, styles.s].join(' ')} data-ord={nodePoition.S} />
        <div className={[styles.dragHandle, styles.sw].join(' ')} data-ord={nodePoition.SW} />
        <div className={[styles.dragHandle, styles.w].join(' ')} data-ord={nodePoition.W} />


        {showRuler && (
          <div>
            <div className={styles.ruleOfThirdsHZ} />
            <div className={styles.ruleOfThirdsVT} />
          </div>
        )}
      </div>
    );
  }

  private makeNewCrop(): ICrop {
    const crop: ICrop = { ...{ sx: 0, sy: 0, height: 0, width: 0 }, ...this.props.crop };
    return crop;
  }

  private getCropStyle() {
    const crop = this.makeNewCrop();
    const unit = 'px';
    return {
      top: `${crop.sy}${unit}`,
      left: `${crop.sx}${unit}`,
      width: `${crop.width}${unit}`,
      height: `${crop.height}${unit}`,
    };
  }

  private getCurrentPosition(e: MouseEvent | any): IMousePosition {
    let { pageX, pageY } = e;
    if (e.touches) {
      [{ pageX, pageY }] = e.touches;
    }

    let refpos = this.controlRef.getBoundingClientRect()
    let startx: number = pageX - refpos.left;
    let starty: number = pageY - refpos.top;
    return ({
      x: startx,
      y: starty
    });
  }

  private onDocMouseTouchMove(e: React.MouseEvent<HTMLDivElement> | any): void {
    const { crop, onChange, onDragStart } = this.props;
    // console.log(e);
    if (!this.mouseDownOnCrop) {
      return;
    }

    e.preventDefault();
    // debugger;
    if (!this.dragStarted) {
      this.dragStarted = true;
      console.log('onDragStart');
      if (onDragStart) {
        onDragStart(e as any);
      }
    }
    const pos = this.getCurrentPosition(e);




    const clientPos = this.getClientPos(e);
    /*
            if (this.evData.isResize && this.props.aspect && this.evData.cropOffset) {
              clientPos.y = this.straightenYPath(clientPos.x);
            }
            */

    this.evData.xDiff = clientPos.x - this.evData.clientStartX;
    this.evData.yDiff = clientPos.y - this.evData.clientStartY;

    let nextCrop;

    if (this.evData.isResize) {
      console.log('resize');
      nextCrop = this.resizeCrop();
    } else {
      console.log('drag');
      nextCrop = this.dragCrop();
    }

    if (nextCrop !== crop) {
      if (onChange) {
        onChange(nextCrop);
      }

    }

  }

  private dragCrop() {

    const { evData } = this;
    let nextCrop: ICrop = this.makeNewCrop();
    const width: number = this.controlRef.clientWidth;
    const height: number = this.controlRef.clientHeight
    nextCrop.sx = clamp(evData.cropStartX + evData.xDiff, 0, width - nextCrop.width);
    nextCrop.sy = clamp(evData.cropStartY + evData.yDiff, 0, height - nextCrop.height);

    return nextCrop;
  }

  private resizeCrop() {
    const { evData } = this;
    let nextCrop = this.makeNewCrop();
    const { pos } = evData;

    console.log(pos);

    // On the inverse change the diff so it's the same and
    // the same algo applies.
    if (evData.xCrossOver) {
       evData.xDiff -= evData.cropStartWidth * 2;

    }
    if (evData.yCrossOver) {
        evData.yDiff -= evData.cropStartHeight * 2;

    }

    // New size.
    const newSize = this.getNewSize();


    let newX = evData.cropStartX;
    let newY = evData.cropStartY;

    if (evData.xCrossOver) {
      newX = nextCrop.sx + (nextCrop.width - newSize.width);
    }

    if (evData.yCrossOver) {
      // This not only removes the little "shake" when inverting at a diagonal, but for some
      // reason y was way off at fast speeds moving sw->ne with fixed aspect only, I couldn't
      // figure out why.
      // if (evData.lastYCrossover === false) {
     // newY = nextCrop.sy - newSize.height;
      // } else {
       newY = nextCrop.sy + (nextCrop.height - newSize.height);
      // }
    }

    const containedCrop: ICrop = {

      sx: newX,
      sy: newY,
      width: newSize.width,
      height: newSize.height,

    }

    console.log(containedCrop.width);
    console.log(containedCrop.height);
    // nextCrop=containedCrop;
    // Apply x/y/width/height changes depending on ordinate (fixed aspect always applies both).
    debugger;
    if (this.props.aspect || (pos === nodePoition.NW || pos === nodePoition.SE || pos === nodePoition.SW || pos === nodePoition.NE)) {
      nextCrop.sx = containedCrop.sx;
      nextCrop.sy = containedCrop.sy;
      nextCrop.width = containedCrop.width;
      nextCrop.height = containedCrop.height;
    } else if (pos === nodePoition.E || pos === nodePoition.W) {
      nextCrop.sx = containedCrop.sx;
      nextCrop.width = containedCrop.width;
    } else if (pos === nodePoition.N || pos === nodePoition.S) {
      nextCrop.sy = containedCrop.sy;
      nextCrop.height = containedCrop.height;
    }
    /*evData.lastYCrossover = evData.yCrossOver;
    this.crossOverCheck();
*/
    return nextCrop;
  }


  private getNewSize(): { width: number, height: number } {
    const { crop, sourceWidth, sourceHeight, aspect } = this.props;
    const { evData } = this;

    let newWidth = evData.cropStartWidth + evData.xDiff;

    if (evData.xCrossOver) {
      newWidth = Math.abs(newWidth);
    }

    newWidth = clamp(newWidth, 0, sourceWidth);

    // New height.
    let newHeight;

    if (aspect) {
      newHeight = newWidth / aspect;
    } else {
      newHeight = evData.cropStartHeight + evData.yDiff;
    }

    if (evData.yCrossOver) {
      // Cap if polarity is inversed and the height fills the y space.
      newHeight = Math.min(Math.abs(newHeight), evData.cropStartY);
    }

    newHeight = clamp(newHeight, 0, sourceHeight);

    if (aspect) {
      newWidth = clamp(newHeight * aspect, 0, sourceWidth);
    }

    return {
      width: newWidth,
      height: newHeight,
    };
  }

  private onDocMouseTouchEnd(e: MouseEvent | any): void {
    const { crop, onDragEnd } = this.props;


    //debugger;
    let elecord = this.controlRef.getBoundingClientRect();
    console.log(elecord);

    if (this.mouseDownOnCrop) {
      this.mouseDownOnCrop = false;
      this.dragStarted = false;

      //      const { width, height } = this.mediaDimensions;

      onDragEnd(e);
      /*
      onComplete(convertToPixelCrop(crop, width, height), convertToPercentCrop(crop, width, height));

      this.setState({ cropIsActive: false, newCropIsBeingDrawn: false });
      */
    }
  }

  private onCropMouseTouchDown(e: MouseEvent | any): void {
    const { crop } = this.props;

    e.preventDefault(); // Stop drag selection.
    const mousepos = this.getClientPos(e);

    let refpos = this.controlRef.getBoundingClientRect()
    let startx: number = refpos.left - mousepos.x;
    let starty: number = refpos.top - mousepos.y;


    const { ord } = e.target.dataset;

    let xInversed: boolean = false;

    let yInversed: boolean = false;
    let pos: nodePoition = undefined;
    if (ord && !isNaN(+ord)) {
      pos = +ord;
      xInversed = pos === nodePoition.NW || pos === nodePoition.W || pos === nodePoition.SW;
      yInversed = pos === nodePoition.NW || pos === nodePoition.N || pos === nodePoition.NE;
    }


    this.evData = {
      clientStartX: mousepos.x,
      clientStartY: mousepos.y,
      cropStartWidth: crop.width,
      cropStartHeight: crop.height,
      cropStartX: xInversed ? crop.sx + crop.width : crop.sx,
      cropStartY: yInversed ? crop.sy + crop.height : crop.sy,
      xCrossOver: xInversed,
      yCrossOver: yInversed,
      startXCrossOver: xInversed,
      startYCrossOver: yInversed,
      isResize: (ord && !isNaN(ord)),
      pos: pos,
      xDiff: 0,
      yDiff: 0
    };

    this.mouseDownOnCrop = true;
    this.setState({ cropIsActive: true });

  }


  private setControlRef(element: HTMLDivElement): void {
    this.controlRef = element;

  }

  private getClientPos(e) {
    let pageX;
    let pageY;

    if (e.touches) {
      [{ pageX, pageY }] = e.touches;
    } else {
      ({ pageX, pageY } = e);
    }

    return {
      x: pageX,
      y: pageY,
    };
  }

  private isValid(crop: ICrop) {
    return crop && !isNaN(crop.width) && !isNaN(crop.height);
  }

  private makeAspectCrop(crop: ICrop) {
    if (isNaN(this.props.aspect)) {
      return crop;
    }

    const calcCrop: ICrop = crop;

    if (crop.width) {
      calcCrop.height = calcCrop.width / this.props.aspect;
    }

    if (crop.height) {
      calcCrop.width = calcCrop.height * this.props.aspect;
    }

    if (calcCrop.sy + calcCrop.height > this.props.sourceHeight) {
      calcCrop.height = this.props.sourceHeight - calcCrop.sy;
      calcCrop.width = calcCrop.height * this.props.aspect;
    }

    if (calcCrop.sx + calcCrop.width > this.props.sourceWidth) {
      calcCrop.width = this.props.sourceWidth - calcCrop.sx;
      calcCrop.height = calcCrop.width / this.props.aspect;
    }

    return calcCrop;
  }
  private resolveCrop(pixelCrop: ICrop) {
    if (this.props.aspect && (!pixelCrop.width || !pixelCrop.height)) {
      return this.makeAspectCrop(pixelCrop);
    }
    return pixelCrop;
  }


}
