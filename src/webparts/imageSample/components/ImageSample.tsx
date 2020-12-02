import * as React from 'react';
//import styles from './ImageSample.module.scss';
import { IImageSampleProps } from './IImageSampleProps';
//import { escape } from '@microsoft/sp-lodash-subset';
import ImageFocusPoint, { IFocusPoint } from '../../../components/ImageFocusPoint/ImageFocusPoint';
import ImageManipulation, { IImageManipulationSettings } from '../../../components/ImageManipulation/ImageManipulation';
import { DisplayMode } from '@microsoft/sp-core-library';

export interface IImageSampleState {
  isEditing: boolean;
  focusPoint: IFocusPoint;
  settings: IImageManipulationSettings[];

}

export default class ImageSample extends React.Component<IImageSampleProps, IImageSampleState> {
  constructor(props: IImageSampleProps) {
    super(props);
    this.state = {
      isEditing: false,
      focusPoint: { x: 0.5, y: 0.5 },
      settings: []
      /*      focusPoint: { x: 0.5, y: 0.5 },
            flip:{flipX:false, flipY:false},
            rotate:0,
            crop:{sx:400, sy:100, height: 1163, width:1248} */
    }
  }
  public render(): React.ReactElement<IImageSampleProps> {

    return (
      <div>
        <ImageManipulation
          settings={this.state.settings}
          configsettings={{
            rotateButtons: [-90, -45, -30, 0, 30, 45, 90]
          }
          }
          displyMode={this.props.displyMode}
          settingschanged={(x) => { this.setState({ settings: x }); }}
          src={'https://media.gettyimages.com/photos/whitewater-paddlers-descend-vertical-waterfall-in-kayak-picture-id1256321293?s=2048x2048'}
        />
      </div>
    )

    /*
            <ImageFocusPoint
              height={400}
              focusPoint={this.state.focusPoint}
              editButtonClicked={() => this.setState({ isEditing: !this.state.isEditing })}
              editEnabled={this.state.isEditing}
              src={'https://media.gettyimages.com/photos/whitewater-paddlers-descend-vertical-waterfall-in-kayak-picture-id1256321293?s=2048x2048'}
            />
       */
    /* return(
       <div className={styles.imageSample}>
         <div className={styles.container}>
           <div className={styles.row}>
             <div className={styles.column}>
               <span className={styles.title}>Welcome to SharePoint!</span>
               <p className={styles.subTitle}>Customize SharePoint experiences using Web Parts.</p>
               <p className={styles.description}>{escape(this.props.description)}</p>
               <a href='https://aka.ms/spfx' className={styles.button}>
                 <span className={styles.label}>Learn more</span>
               </a>
             </div>
           </div>
         </div>
       </div >
     );
     */
  }
}
