import { Overlay } from 'office-ui-fabric-react';
import * as React from 'react';
import styles from './ImageGrid.module.scss';

export interface IImageGridProps {
  left: number;
  top: number;
  width: number;
  height: number;

}

export interface IImageGridState { }

export default class ImageGrid extends React.Component<IImageGridProps, IImageGridState> {
  public render(): React.ReactElement<IImageGridProps> {
    return (
      <div className={styles.ImgGridShadowOverlay}>
        <div className={styles.ImgGridVisible}>
          <div className={styles.ImgGridTabel}>
            {[0, 1, 2].map((y) => {
              <div key={y} className={'row' + y}>
                {[0, 1, 2].map((x) => {
                  return (<div key={'' + y + x} className={'col' + y + 'row' + x}></div>);
                })}


              </div>
            })}
          </div>
        </div>
      </div>
    );
  }
}
