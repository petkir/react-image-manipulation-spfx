import { noWrap } from 'office-ui-fabric-react';
import * as React from 'react';
import { ICrop } from '../ImageManipulation';
import styles from './ImageCrop.module.scss';

export interface IImageCropProps {
  crop: ICrop;
  aspect?: number;
  sourceHeight:number;
  sourceWidth:number;
  ruleOfThirds?:boolean
  onDragStart?: (e: MouseEvent) => void;
  onComplete?: (crop: ICrop) => void;
  onChange?: (e) => void;
  onDragEnd: (e) => void;
}

export interface IImageCropState {
  cropIsActive: boolean;
  newCropIsBeingDrawn:boolean;
}

export enum nodePoition{
  NW,
  N,
  NE,
  E,
  SE,
  S,
  SW,
  W

}

// Feature detection
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners
let passiveSupported = false;

export default class ImageCrop extends React.Component<IImageCropProps, IImageCropState> {

  private controlRef: HTMLDivElement = null;

  dragStarted: boolean = false;
  mouseDownOnCrop: boolean = false;

  constructor(props: IImageCropProps) {
    super(props);
    this.state = {
      cropIsActive: false
    };
    this.onDocMouseTouchMove = this.onDocMouseTouchMove.bind(this);
    this.onDocMouseTouchEnd = this.onDocMouseTouchEnd.bind(this);
    this.onCropMouseTouchDown = this.onCropMouseTouchDown.bind(this);
    this.setControlRef = this.setControlRef.bind(this);
  }

  public componentDidMount(): void {

  }

  public componentWillUnmount(): void {

  }



  public render(): React.ReactElement<IImageCropProps> {
    const {crop} = this.props;
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
          <div className={styles.ImgGridTabel}>

            <div className={styles.ImgGridRow}>
              <div className={styles.ImgLeftTop + ' ' + styles.ImgGridCell}>
                <div className={styles.bubble}
                 onMouseDown={(e) => {this.onCropMouseTouchDown(e,)}}
                 onTouchStart={(e) =>{this.onCropMouseTouchDown}}
                ></div>
              </div>
              <div className={styles.ImgCenterTop + ' ' + styles.ImgGridCell}></div>
              <div className={styles.ImgRightTop + ' ' + styles.ImgGridCell}></div>
            </div>
            <div className={styles.ImgGridRow}>
              <div className={styles.ImgLeftCenter + ' ' + styles.ImgGridCell}></div>
              <div className={styles.ImgGridCell}></div>
              <div className={styles.ImgRightCenter + ' ' + styles.ImgGridCell}></div>
            </div>
            <div className={styles.ImgGridRow}>
              <div className={styles.ImgLeftBottom + ' ' + styles.ImgGridCell}></div>
              <div className={styles.ImgCenterBottom + ' ' + styles.ImgGridCell}></div>
              <div className={styles.ImgRightBottom + ' ' + styles.ImgGridCell}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  createSelectionGrid() {
    const { ruleOfThirds, crop } = this.props;
    const style = this.getCropStyle();

    return (
      <div
        ref={r => (this.cropSelectRef = r)}
        style={style}
        className="ReactCrop__crop-selection"
        onMouseDown={this.onCropMouseTouchDown}
        onTouchStart={this.onCropMouseTouchDown}
      >
        {!disabled && !locked && (
          <div className="ReactCrop__drag-elements">
            <div className="ReactCrop__drag-bar ord-n" data-ord="n" />
            <div className="ReactCrop__drag-bar ord-e" data-ord="e" />
            <div className="ReactCrop__drag-bar ord-s" data-ord="s" />
            <div className="ReactCrop__drag-bar ord-w" data-ord="w" />

            <div className="ReactCrop__drag-handle ord-nw" data-ord="nw" />
            <div className="ReactCrop__drag-handle ord-n" data-ord="n" />
            <div className="ReactCrop__drag-handle ord-ne" data-ord="ne" />
            <div className="ReactCrop__drag-handle ord-e" data-ord="e" />
            <div className="ReactCrop__drag-handle ord-se" data-ord="se" />
            <div className="ReactCrop__drag-handle ord-s" data-ord="s" />
            <div className="ReactCrop__drag-handle ord-sw" data-ord="sw" />
            <div className="ReactCrop__drag-handle ord-w" data-ord="w" />
          </div>
        )}
        {renderSelectionAddon && isCropValid(crop) && (
          <div className="ReactCrop__selection-addon" onMouseDown={e => e.stopPropagation()}>
            {renderSelectionAddon(this.state)}
          </div>
        )}
        {ruleOfThirds && (
          <>
            <div className="ReactCrop__rule-of-thirds-hz" />
            <div className="ReactCrop__rule-of-thirds-vt" />
          </>
        )}
      </div>
    );
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
    let { pageX, pageY } = e;
    if (e.touches) {
      [{ pageX, pageY }] = e.touches;
    }

    console.log({
      x: pageX,
      y: pageY
    });
    let refpos = this.controlRef.getBoundingClientRect()
    let startx: number = refpos.left - pageX;
    let starty: number = refpos.top - pageY;

    console.log({
      x: startx,
      y: starty
    });
    /*
        const clientPos = getClientPos(e);

        if (evData.isResize && crop.aspect && evData.cropOffset) {
          clientPos.y = this.straightenYPath(clientPos.x);
        }

        evData.xDiff = clientPos.x - evData.clientStartX;
        evData.yDiff = clientPos.y - evData.clientStartY;

        let nextCrop;

        if (evData.isResize) {
          nextCrop = this.resizeCrop();
        } else {
          nextCrop = this.dragCrop();
        }

        if (nextCrop !== crop) {

          onChange();
        }
        */
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
    //  const { width, height } = this.mediaDimensions;
    // const pixelCrop = convertToPixelCrop(crop, width, height);

    e.preventDefault(); // Stop drag selection.
    const mousepos=this.getClientPos(e)
    let refpos = this.controlRef.getBoundingClientRect()
    let startx: number = refpos.left - mousepos.x;
    let starty: number = refpos.top - mousepos.y;
    console.log({
      x: startx,
      y: starty
    });
    // this.controlRef.focus({ preventScroll: true }); // All other browsers

    /*
        const { ord } = e.target.dataset;
        const xInversed = ord === 'nw' || ord === 'w' || ord === 'sw';
        const yInversed = ord === 'nw' || ord === 'n' || ord === 'ne';

        if (pixelCrop.aspect) {
          cropOffset = this.getElementOffset(this.cropSelectRef);
        }
        */
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

  private isValid(crop:ICrop) {
    return crop && !isNaN(crop.width) && !isNaN(crop.height);
  }

  private makeAspectCrop(crop:ICrop) {
    if (isNaN(this.props.aspect)) {
      return crop;
    }

  const calcCrop:ICrop = crop;

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
private resolveCrop(pixelCrop:ICrop) {
  if (this.props.aspect && (!pixelCrop.width || !pixelCrop.height)) {
    return this.makeAspectCrop(pixelCrop);
  }
  return pixelCrop;
}


}
