import { DisplayMode } from '@microsoft/sp-core-library';
import { clone } from '@microsoft/sp-lodash-subset';
import { ManifestType } from '@microsoft/sp-module-interfaces';
import { ActionButton, Checkbox, DefaultButton, findIndex, Icon, IconButton, IsFocusVisibleClassName, Panel, PanelType, Slider, TextField } from 'office-ui-fabric-react';
import { getStyles } from 'office-ui-fabric-react/lib-es2015/components/Breadcrumb/Breadcrumb.styles';
import { resultContent } from 'office-ui-fabric-react/lib-es2015/components/ExtendedPicker/PeoplePicker/ExtendedPeoplePicker.scss';
import * as React from 'react';
import ImageGrid from './components/ImageGrid';

import { GrayscaleFilter } from './Filter/GrayscaleFilter';
import { SepiaFilter } from './Filter/SepiaFilter';
import styles from './ImageManipulation.module.scss';


export enum ManipulationType {
  Crop,
  Scale,
  Rotate,
  Flip,
  Filter,
  Resize
}

export enum FilterType {
  Grayscale,
  Sepia,
  Blur,
  Emboss,
  Sepia2,
  Invert,
  Sharpen,
  RemoteWhite,
  Brightness,
  Noise,
  Pixelate,
  ColorOverLay
}

export interface IManipulationBase {
  type: ManipulationType;
}
export interface ICropSettings extends IManipulationBase {
  sx: number;
  sy: number;
  width: number;
  height: number;
}
export interface IFlipSettings extends IManipulationBase {
  flipX: boolean;
  flipY: boolean;
}
export interface IScaleSettings extends IManipulationBase {
  scale: number;
}
export interface IRotateSettings extends IManipulationBase {
  rotate: number;
}

export interface IFilterSettings extends IManipulationBase {
  filterType: FilterType;
  nvalue?: number;
  svalue?: string;
}
export interface IResizeSettings extends IManipulationBase {
  width: number;
  height: number;
}

export type IImageManipulationSettings = IFilterSettings | IRotateSettings | IScaleSettings | IFlipSettings | ICropSettings | IResizeSettings;

export interface IImageManipulationConfig {
  rotateButtons: number[];
  //rotateShowReset:boolean;


}

export interface IImageManipulationProps {
  src: string;
  settings?: IImageManipulationSettings[];
  settingschanged?: (settings: IImageManipulationSettings[]) => void;
  configsettings: IImageManipulationConfig;
  displyMode: DisplayMode;
}


export enum SettingPanelType {
  Closed = 1,
  Filter = 2,
  Flip = 3,
  Rotate = 4,
  Scale = 5,
  Crop = 6,
  Resize = 7
}

export interface IImageManipulationState {
  settingPanel: SettingPanelType;
}

export default class ImageManipulation extends React.Component<IImageManipulationProps, IImageManipulationState> {
  private img: HTMLImageElement = null;
  private bufferRef: HTMLCanvasElement = null;
  private bufferCtx: CanvasRenderingContext2D = null;
  private canvasRef: HTMLCanvasElement = null;
  private canvasCtx: CanvasRenderingContext2D = null;
  private manipulateRef: HTMLCanvasElement = null;
  private manipulateCtx: CanvasRenderingContext2D = null;



  constructor(props: IImageManipulationProps) {
    super(props);

    this.state = {
      settingPanel: SettingPanelType.Closed
    };
    this.openPanel = this.openPanel.bind(this);
    this.setRotate = this.setRotate.bind(this);
    this.calcRotate = this.calcRotate.bind(this);
    this.setCanvasRef = this.setCanvasRef.bind(this);
    this.setBufferRef = this.setBufferRef.bind(this);
    this.setManipulateRef = this.setManipulateRef.bind(this);
    this.setScale = this.setScale.bind(this);
    this.closeFilter = this.closeFilter.bind(this);

  }
  public componentDidMount(): void {
    this.imageChanged(this.props.src);
  }
  public componentDidUpdate(prevProps: IImageManipulationProps): void {
    if (prevProps.src !== this.props.src) {
      this.imageChanged(this.props.src);
    } else {
      this.applySettings();
    }
  }

  private imageChanged(url: string) {
    this.img = new Image();
    this.img.src = url;
    this.img.crossOrigin = "Anonymous";
    this.img.onload = () => {
      this.img = this.img;
      this.canvasRef.width = this.img.width;
      this.canvasRef.height = this.img.height;
      this.bufferRef.width = this.img.width;
      this.bufferRef.height = this.img.height;
      this.manipulateRef.width = this.img.width;
      this.manipulateRef.height = this.img.height;
      this.applySettings();
    };

  }
  private applySettings(): void {
    console.log('applySettings');
    this.bufferRef.width = this.img.width;
    this.bufferRef.height = this.img.height;
    this.bufferCtx.clearRect(0, 0, this.img.width, this.img.height);
    this.bufferCtx.drawImage(this.img, 0, 0);
    this.bufferCtx.save();


    this.manipulateRef.width = this.canvasRef.width = this.bufferRef.width;
    this.manipulateRef.height = this.canvasRef.height = this.bufferRef.height;

    this.props.settings.forEach(element => {
      switch (element.type) {
        case ManipulationType.Flip:
          console.log('Has Settings');
          const filp = element as IFlipSettings;
          this.manipulateCtx.clearRect(0, 0, this.manipulateRef.width, this.manipulateRef.height);
          this.manipulateCtx.save();
          if (filp.flipY) {
            this.manipulateCtx.translate(0, this.manipulateRef.height);
            this.manipulateCtx.scale(1, -1);
          }
          if (filp.flipX) {
            this.manipulateCtx.translate(this.manipulateRef.width, 0);
            this.manipulateCtx.scale(-1, 1);
          }

          this.manipulateCtx.drawImage(this.bufferRef, 0, 0);
          this.manipulateCtx.restore();
          this.bufferCtx.clearRect(0, 0, this.bufferRef.width, this.bufferRef.height);
          this.bufferCtx.drawImage(this.manipulateRef, 0, 0);
          this.bufferCtx.save();
          break;
        case ManipulationType.Rotate:
          const rotate = element as IRotateSettings;
          if (rotate.rotate) {
            this.manipulateCtx.clearRect(0, 0, this.manipulateRef.width, this.manipulateRef.height);
            this.manipulateCtx.save();

            this.manipulateCtx.translate(this.canvasRef.width / 2, this.manipulateRef.height / 2);
            this.manipulateCtx.rotate(rotate.rotate * Math.PI / 180);
            this.manipulateCtx.translate(this.canvasRef.width / 2 * -1, this.manipulateRef.height / 2 * -1);

            this.manipulateCtx.drawImage(this.bufferRef, 0, 0);
            this.manipulateCtx.restore();

            this.bufferCtx.restore();
            this.bufferCtx.clearRect(0, 0, this.bufferRef.width, this.bufferRef.height);
            this.bufferCtx.drawImage(this.manipulateRef, 0, 0);
            this.bufferCtx.save();
          }
          break;
        case ManipulationType.Scale:
          const scale = element as IScaleSettings;
          if (scale.scale) {
            this.manipulateCtx.clearRect(0, 0, this.manipulateRef.width, this.manipulateRef.height);
            this.manipulateCtx.save();

            let height = this.manipulateRef.height;
            let width = this.manipulateRef.width;
            //this.canvasctx.translate(this.canvasRef.width / 2, this.canvasRef.height / 2);
            // width = width * scale.scale;
            // height = height * scale.scale;
            this.manipulateCtx.translate(width / 2, height / 2);
            this.manipulateCtx.scale(scale.scale, scale.scale);
            this.manipulateCtx.translate(width / 2 * -1, height / 2 * -1);

            this.manipulateCtx.drawImage(this.bufferRef, 0, 0);
            this.manipulateCtx.restore();

            this.bufferCtx.restore();
            this.bufferCtx.clearRect(0, 0, this.bufferRef.width, this.bufferRef.height);
            this.bufferCtx.drawImage(this.manipulateRef, 0, 0);
            this.bufferCtx.save();
          }
          break;
        case ManipulationType.Filter:
          //skip at this time
          // We need no effect at this time
          break;
        case ManipulationType.Crop:
          this.manipulateCtx.clearRect(0, 0, this.manipulateRef.width, this.manipulateRef.height);
          this.manipulateCtx.save();
          const crop = element as ICropSettings;
          const sourceX = crop.sx;
          const sourceY = crop.sy;
          const sourceWidth = crop.width;
          const sourceHeight = crop.height;


          this.manipulateCtx.drawImage(this.bufferRef, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
          this.manipulateCtx.restore();

          this.bufferCtx.restore();
          this.bufferCtx.clearRect(0, 0, this.bufferRef.width, this.bufferRef.height);

          this.bufferRef.width = sourceWidth;
          this.bufferRef.height = sourceHeight;

          this.bufferCtx.drawImage(this.manipulateRef, 0, 0);
          this.bufferCtx.save();
          this.manipulateRef.width = sourceWidth;
          this.manipulateRef.height = sourceHeight;

          break;

        case ManipulationType.Resize:
          debugger
          const resize = element as IResizeSettings;
          this.manipulateCtx.clearRect(0, 0, this.manipulateRef.width, this.manipulateRef.height);
          this.manipulateCtx.save();

          const targetWidth = resize.width;
          const targetHeight = resize.height;


          this.manipulateCtx.drawImage(this.bufferRef, 0, 0);
          this.manipulateCtx.restore();

          this.bufferCtx.restore();
          this.bufferCtx.clearRect(0, 0, this.bufferRef.width, this.bufferRef.height);

          this.bufferRef.width = targetWidth;
          this.bufferRef.height = targetHeight;

          this.bufferCtx.drawImage(this.manipulateRef, 0, 0, targetWidth, targetHeight);
          this.bufferCtx.save();

          this.manipulateRef.width = targetWidth;
          this.manipulateRef.height = targetHeight;
          this.canvasRef.width = targetWidth;
          this.canvasRef.height = targetHeight;

      }
    });
    //  this.bufferCtx.clearRect(0, 0, this.bufferRef.width, this.bufferRef.height);
    //  this.bufferCtx.drawImage(this.img, 0, 0);
    // this.bufferCtx.restore()
    /* if (this.props.displyMode === DisplayMode.Read && this.props.settings.crop ||
       (this.state.settingPanel !== SettingPanelType.Crop && this.props.settings.crop)) {
         */

    const filters = this.props.settings.filter((x) => x.type === ManipulationType.Filter);
    filters.forEach(element => {
      const filter = element as IFilterSettings;
      var imageData = this.bufferCtx.getImageData(0, 0, this.bufferRef.width, this.bufferRef.height);
      switch (filter.filterType) {
        case FilterType.Grayscale:
          imageData = new GrayscaleFilter().process(imageData, this.bufferRef.width, this.bufferRef.height, undefined, undefined);
          break;
        case FilterType.Sepia:
          imageData = new SepiaFilter().process(imageData, this.bufferRef.width, this.bufferRef.height, undefined, undefined);
          break;
      }
      this.bufferCtx.putImageData(imageData, 0, 0);

    });

    /*this.canvasCtx.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height)
  //  this.canvasCtx.drawImage(this.bufferRef, 0, 0);
  const sourceX = 400;
  const sourceY = 200;
  const sourceWidth = 1200;
  const sourceHeight = 600;
this.canvasCtx.drawImage(this.bufferRef, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, this.canvasRef.width, this.canvasRef.height);
*/
    this.canvasCtx.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
    this.canvasRef.width = this.bufferRef.width
    this.canvasRef.height = this.bufferRef.height
    //this.canvasCtx.drawImage(this.bufferRef, 0, 0);
    this.canvasCtx.drawImage(this.bufferRef, 0, 0, this.bufferRef.width, this.bufferRef.height);

    //    let height = this.canvasRef.height;
    //    let width = this.canvasRef.width;

    //this.canvasctx.translate(this.canvasRef.width / 2 * -1, this.canvasRef.height / 2 * -1);
  }




  public render(): React.ReactElement<IImageManipulationProps> {

    return (
      <div className={styles.imageEditor} >
        <div className={styles.commandBar}>
          <IconButton
            iconProps={{ iconName: 'Picture' }}
            title='Resize'
            ariaLabel='Resize'
            onClick={() => this.openPanel(SettingPanelType.Resize)}
          />

          <IconButton
            iconProps={{ iconName: 'Crop' }}
            title='Crop'
            ariaLabel='Crop'
            onClick={() => this.openPanel(SettingPanelType.Crop)}
          />
          <IconButton
            iconProps={{ iconName: 'SwitcherStartEnd' }}
            title='Flip'
            ariaLabel='Flip'

            onClick={() => this.openPanel(SettingPanelType.Flip)}
          />
          <IconButton
            iconProps={{ iconName: 'Rotate' }}
            title='Rotate'
            ariaLabel='Rotate'
            onClick={() => this.openPanel(SettingPanelType.Rotate)}
          />
          <IconButton
            iconProps={{ iconName: 'Zoom' }}
            title='Scale'
            ariaLabel='Scale'
            onClick={() => this.openPanel(SettingPanelType.Scale)}
          />
          <IconButton
            iconProps={{ iconName: 'Filters' }}
            title='Filters'
            ariaLabel='Filters'
            onClick={() => this.openPanel(SettingPanelType.Filter)}
          />
          Undo  Redo Reset History
          <Panel
            isOpen={this.state.settingPanel != SettingPanelType.Closed}
            type={PanelType.smallFixedFar}
            onDismiss={this.closeFilter}
            headerText={this.getPanelHeader(this.state.settingPanel)}
            closeButtonAriaLabel='Close'
            isBlocking={false}
            onRenderFooterContent={this.onRenderFooterContent}
          >
            {this.renderPanelContent()}
          </Panel>
        </div>
        <div className={styles.imageplaceholder + ' '+this.getMaxWidth()}
        style={ this.canvasRef && { width: ''+this.canvasRef.width+'px'}}>

          <canvas className={this.getMaxWidth()} style={{ display: 'none' }} ref={this.setBufferRef}></canvas>
          <canvas className={this.getMaxWidth()} style={{ display: 'none' }} ref={this.setManipulateRef}></canvas>
          <canvas className={this.getMaxWidth()} ref={this.setCanvasRef}></canvas>
          {this.state.settingPanel === SettingPanelType.Crop && (this.getCropGrid())}
          {this.state.settingPanel === SettingPanelType.Resize && (this.getResizeGrid())}

        </div>
      </div>
    );
  }
  private getCropGrid(): JSX.Element {
    const lastset = this.getLastManipulation() as ICropSettings;
    if (lastset && lastset.type === ManipulationType.Crop) {
      return (<ImageGrid
        left={lastset.sx} top={lastset.sy}
        width={lastset.width} height={lastset.height} />)
    }
    return (<ImageGrid
      left={0} top={0}
      width={this.canvasRef.width} height={this.canvasRef.height} />)
  }

  private getResizeGrid(): JSX.Element {
    const lastset = this.getLastManipulation() as IResizeSettings;
    if (lastset && lastset.type === ManipulationType.Resize) {
      return (<ImageGrid
        left={0} top={0}
        width={lastset.width} height={lastset.height} />)
    }
    return (<ImageGrid
      left={0} top={0}
      width={this.canvasRef.width} height={this.canvasRef.height} />)
  }

  private getMaxWidth(): string {
    const { settingPanel } = this.state;
    if (settingPanel === SettingPanelType.Crop || settingPanel === SettingPanelType.Resize) {
      return '';
    }
    return styles.canvasmaxwidth;
  }

  private isFilterActive(type: FilterType): boolean {
    return (this.props.settings && this.props.settings.filter((f) => f.type === ManipulationType.Filter && (f as IFilterSettings).filterType === type).length > 0)
  }
  private closeFilter(): void {
    this.setState({
      settingPanel: SettingPanelType.Closed
    })
  }
  private getPanelHeader(settingPanel: SettingPanelType): string {
    switch (settingPanel) {
      case SettingPanelType.Filter:
        return "Trans_Filter";
      case SettingPanelType.Flip:
        return "Trans_Flip";
      case SettingPanelType.Rotate:
        return "Trans_Rotate";
      case SettingPanelType.Scale:
        return "Trans_scale";
      case SettingPanelType.Crop:
        return "Trans_crop";
      case SettingPanelType.Resize:
        return "Trans_resize";
    }
  }
  private onRenderFooterContent(): JSX.Element {
    return (
      <div> </div>
    );
  }
  private renderPanelContent(): JSX.Element {
    switch (this.state.settingPanel) {
      case SettingPanelType.Filter:
        return this.getFilterSettings();
      case SettingPanelType.Flip:
        return this.getFlipSettings();
      case SettingPanelType.Rotate:
        return this.getRotateSettings();
      case SettingPanelType.Scale:
        return this.getScaleSettings();
      case SettingPanelType.Crop:
        return this.getCropSettings();
      case SettingPanelType.Resize:
        return this.getResizeSettings();
    }
  }

  private openPanel(settingPanel: SettingPanelType): void {
    this.setState({
      settingPanel: settingPanel
    })
  }

  private getFilterSettings(): JSX.Element {
    return (<div>
      <Checkbox
        label='Grayscale'
        checked={this.isFilterActive(FilterType.Grayscale)}
        onChange={() => this.toggleFilter(FilterType.Grayscale)}

      />
      <Checkbox
        label='Sepia'
        checked={this.isFilterActive(FilterType.Sepia)}
        onChange={() => this.toggleFilter(FilterType.Sepia)}

      />
    </div>);
  }

  private toggleFilter(type: FilterType, nvalue: number = undefined, svalue: string = undefined): void {
    debugger;
    let tmpsettings = clone(this.props.settings);
    if (!tmpsettings) { tmpsettings = []; }
    if (tmpsettings.filter((f) => f.type === ManipulationType.Filter && (f as IFilterSettings).filterType === type).length > 0) {
      const removeindex = findIndex(tmpsettings, (f) => f.type === ManipulationType.Filter && (f as IFilterSettings).filterType === type);
      tmpsettings.splice(removeindex, 1);
    } else {
      tmpsettings.push({
        type: ManipulationType.Filter,
        filterType: type,
        nvalue: nvalue,
        svalue: svalue
      });
    }
    if (this.props.settingschanged) {
      this.props.settingschanged(tmpsettings);
    }
  }

  private getFlipSettings(): JSX.Element {
    return (<div>
      <IconButton
        iconProps={{ iconName: 'SwitcherStartEnd' }}
        title='Flip X'
        ariaLabel='Flip X'
        styles={{
          root: [
            {
              transform: 'rotate(-90deg)',

            }
          ]
        }}
        onClick={() => {
          console.log('flip x clicked');
          let last = this.getLastManipulation();
          if (last && last.type === ManipulationType.Flip) {
            (last as IFlipSettings).flipX = !(last as IFlipSettings).flipX
            if ((last as IFlipSettings).flipX === false &&
              (last as IFlipSettings).flipY === false) {
              console.log('removeflip element');
              this.removeLastManipulation();
            } else {
              console.log('Add or Update');
              this.addOrUpdateLastManipulation(last);
            }
          } else {
            console.log('Add or Update new set');
            this.addOrUpdateLastManipulation({ type: ManipulationType.Flip, flipX: true, flipY: false });
          }
        }}
      />
      <IconButton
        iconProps={{
          iconName: 'SwitcherStartEnd',

        }}

        title='Flip Y'
        ariaLabel='Flip Y'
        onClick={() => {
          let last = this.getLastManipulation();
          if (last && last.type === ManipulationType.Flip) {
            (last as IFlipSettings).flipY = !(last as IFlipSettings).flipY
            if ((last as IFlipSettings).flipX === false &&
              (last as IFlipSettings).flipY === false) {
              this.removeLastManipulation();
            } else {
              this.addOrUpdateLastManipulation(last);
            }
          } else {
            this.addOrUpdateLastManipulation({ type: ManipulationType.Flip, flipX: false, flipY: true });
          }
        }}
      />

    </div>)
  }
  private getRotateSettings(): JSX.Element {
    const lastvalue = this.getLastManipulation();
    let rotatevalue = 0;
    if (lastvalue && lastvalue.type === ManipulationType.Rotate) {
      rotatevalue = (lastvalue as IRotateSettings).rotate ? (lastvalue as IRotateSettings).rotate : 0;
    }
    return (<div>
      <div>
        {this.props.configsettings.rotateButtons.map((value: number, index: number) => {
          let icon: string = 'CompassNW';
          if (value !== 0) { icon = 'Rotate' }


          return (<DefaultButton
            key={'rotate' + index}
            onClick={() => { this.calcRotate(value) }}
            className={styles.iconbtn}
          >
            <Icon iconName={icon} style={value < 0 ? { transform: 'scaleX(-1)' } : {}} className={styles.imgicon} />
            <span className={styles.imgtext} >{'' + value}</span></DefaultButton>);
        })}


      </div>
      <Slider
        label='Rotate'
        min={-180}
        max={180}
        defaultValue={rotatevalue}
        value={rotatevalue}
        onChange={this.setRotate}
        showValue={true}
      //originFromZero
      />
      <ActionButton
        key={'resetrotate'}
        disabled={!(lastvalue && lastvalue.type === ManipulationType.Rotate)}
        iconProps={{ iconName: 'Undo' }}
        ariaLabel={'reset'}
        onClick={() => { this.removeLastManipulation() }
        }
      >{'reset'} </ActionButton>
    </div >);
  }

  private getCropSettings(): JSX.Element {
    let crop: ICropSettings = this.getCropValues();
    return (<div>

      <TextField label="SourceX" value={'' + crop.sx} onChanged={(x) => this.setCrop(parseInt(x), undefined, undefined, undefined)} />
      <TextField label="SourceY" value={'' + crop.sy} onChanged={(y) => this.setCrop(undefined, parseInt(y), undefined, undefined)} />
      <TextField label="Width" value={'' + crop.width} onChanged={(w) => this.setCrop(undefined, undefined, parseInt(w), undefined)} />
      <TextField label="Height" value={'' + crop.height} onChanged={(h) => this.setCrop(undefined, undefined, undefined, parseInt(h))} />

    </div>);
  }

  private getResizeSettings(): JSX.Element {
    let resize: IResizeSettings = this.getResizeValues();
    return (<div>
      Max Width 100% in display Mode
      Lock Aspetct Todo
      <TextField label="Width" value={'' + resize.width} onChanged={(w) => this.setResize(parseInt(w), undefined)} />
      <TextField label="Height" value={'' + resize.height} onChanged={(h) => this.setResize(undefined, parseInt(h))} />

    </div>);
  }
  private getScaleSettings(): JSX.Element {
    const lastvalue = this.getLastManipulation();
    let scalevalue = 1;
    if (lastvalue && lastvalue.type === ManipulationType.Scale) {
      scalevalue = (lastvalue as IScaleSettings).scale ? (lastvalue as IScaleSettings).scale : 1;
    }
    return (<div>

      <Slider
        label='Scale'
        min={0.1}
        max={5}
        step={0.1}
        value={scalevalue}
        onChange={this.setScale}
        showValue={true}
      />
      <IconButton
        key={'resetscale'}
        disabled={!(lastvalue && lastvalue.type === ManipulationType.Scale)}
        iconProps={{ iconName: 'Undo' }}
        title={'reset'}
        ariaLabel={'reset'}
        onClick={() => { this.setScale(1) }
        }
      />
    </div>);
  }

  private getResizeValues(): IResizeSettings {
    let state: IImageManipulationSettings = this.getLastManipulation()
    let values: IResizeSettings = {
      type: ManipulationType.Resize,
      height: this.bufferRef.height,
      width: this.bufferRef.width
    };
    if (state && state.type === ManipulationType.Resize) {
      values = state as IResizeSettings;
    }
    return values
  }

  private setResize(width: number, height: number): void {
    let values = this.getResizeValues();
    if (width) { values.width = width; }
    if (height) { values.height = height; }

    this.addOrUpdateLastManipulation(values);
  }

  private getCropValues(): ICropSettings {
    let state: IImageManipulationSettings = this.getLastManipulation()
    let values: ICropSettings = {
      type: ManipulationType.Crop,
      sx: 0,
      sy: 0,
      height: this.bufferRef.height,
      width: this.bufferRef.width
    };
    if (state && state.type === ManipulationType.Crop) {
      values = state as ICropSettings;
    }
    return values


  }

  private setCrop(sx: number, sy: number, width: number, height: number): void {
    let values = this.getCropValues();
    if (sx) { values.sx = sx; }
    if (sy) { values.sy = sy; }
    if (width) { values.width = width; }
    if (height) { values.height = height; }

    this.addOrUpdateLastManipulation(values);
  }

  private setRotate(value: number): void {
    this.addOrUpdateLastManipulation({
      type: ManipulationType.Rotate,
      rotate: value
    });

  }
  private setScale(value: number): void {
    this.addOrUpdateLastManipulation({
      type: ManipulationType.Scale,
      scale: value
    });
  }
  private calcRotate(value: number): void {
    const lastVal = this.getLastManipulation();
    let cvalue = 0;
    if (lastVal && lastVal.type === ManipulationType.Rotate) {
      cvalue = (lastVal as IRotateSettings).rotate
    }
    cvalue = cvalue + value;
    if (cvalue < -180) { cvalue = -180; }
    if (cvalue > 180) { cvalue = 180; }
    this.addOrUpdateLastManipulation({
      type: ManipulationType.Rotate,
      rotate: cvalue
    })
  }

  private setCanvasRef(element: HTMLCanvasElement): void {
    this.canvasRef = element;
    this.canvasCtx = element.getContext('2d');
  }
  private setBufferRef(element: HTMLCanvasElement): void {
    this.bufferRef = element;
    this.bufferCtx = element.getContext('2d');
  }

  private setManipulateRef(element: HTMLCanvasElement): void {
    this.manipulateRef = element;
    this.manipulateCtx = element.getContext('2d');
  }

  private getLastManipulation(): IImageManipulationSettings {
    if (this.props.settings && this.props.settings.length > 0) {
      return this.props.settings[this.props.settings.length - 1];
    }
    return undefined;
  }
  private addOrUpdateLastManipulation(changed: IImageManipulationSettings): void {
    let state = clone(this.props.settings)
    if (!state) {
      state = []
    }

    if (state.length > 0 && state[state.length - 1].type === changed.type) {
      state[state.length - 1] = changed
    } else {
      state.push(changed);
    }

    if (this.props.settingschanged) {
      this.props.settingschanged(state);
    }
  }

  private removeLastManipulation(): void {
    if (this.props.settings && this.props.settings.length > 0) {
      let state = clone(this.props.settings)
      state.splice(state.length - 1, 1);
      if (this.props.settingschanged) {
        this.props.settingschanged(clone(state));
      }
    }
  }
}
