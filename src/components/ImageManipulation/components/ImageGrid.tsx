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
                <div className={styles.bubble} draggable={true}
                onMouseDown={(e) => {
                  console.log(e);
                }}

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



}
