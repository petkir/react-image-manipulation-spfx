import * as React from 'react';
import * as ReactDom from 'react-dom';
import { DisplayMode, Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';

import * as strings from 'ImageSampleWebPartStrings';
import ImageSample from './components/ImageSample';
import { IImageSampleProps } from './components/IImageSampleProps';

export interface IImageSampleWebPartProps {
  description: string;
  displyMode :DisplayMode;
}

export default class ImageSampleWebPart extends BaseClientSideWebPart<IImageSampleWebPartProps> {

  public render(): void {

    const element: React.ReactElement<IImageSampleProps> = React.createElement(
      ImageSample,
      {
        description: this.properties.description,
        displyMode: this.displayMode
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
