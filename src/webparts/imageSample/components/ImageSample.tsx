import * as React from 'react';

import { IImageSampleProps } from './IImageSampleProps';
import { ImageManipulation } from '../../../components/ImageManipulation';
import { IImageManipulationSettings } from '../../../components/ImageManipulation';


export interface IImageSampleState {
  isEditing: boolean;
  settings: IImageManipulationSettings[];

}

export default class ImageSample extends React.Component<IImageSampleProps, IImageSampleState> {
  constructor(props: IImageSampleProps) {
    super(props);
    this.state = {
      isEditing: false,
      settings: []
      /*      focusPoint: { x: 0.5, y: 0.5 },
            flip:{flipX:false, flipY:false},
            rotate:0,
            crop:{sx:400, sy:100, height: 1163, width:1248} */
    }
  }
  public render(): React.ReactElement<IImageSampleProps> {
    const url: string = 'https://media.gettyimages.com/photos/whitewater-paddlers-descend-vertical-waterfall-in-kayak-picture-id1256321293?s=2048x2048';

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
          src={url}
        />
      </div>
    );
  }
}
