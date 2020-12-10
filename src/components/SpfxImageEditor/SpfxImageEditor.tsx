import * as React from 'react';

import TuiImageEditor from 'tui-image-editor';
import 'tui-image-editor/dist/tui-image-editor.css'

//import styles from './SpfxImageEditor.module.scss';

export interface ISpfxImageEditorProps {

}

export interface ISpfxImageEditorState { }

export default class SpfxImageEditor extends React.Component<ISpfxImageEditorProps, ISpfxImageEditorState> {
  imageEditorInst = null;
  private rootElRef: HTMLDivElement = null;
  constructor(props: ISpfxImageEditorProps) {
    super(props);

    this.state = {

    };
    this.setRootElRef = this.setRootElRef.bind(this);
  }

  public componentDidMount() {
    this.imageEditorInst = new TuiImageEditor(this.rootElRef, {
   cssMaxWidth: 700,
   cssMaxHeight: 500,
   selectionStyle: {
       cornerSize: 20,
       rotatingPointOffset: 70
   },
   usageStatistics: false
    });
    this.imageEditorInst.loadImageFromURL('https://media.gettyimages.com/photos/whitewater-paddlers-descend-vertical-waterfall-in-kayak-picture-id1256321293?s=2048x2048', 'SampleImage')
    .then((result) => {
      console.log(result);
      debugger;
      this.imageEditorInst.clearUndoStack();
      this.imageEditorInst.flipX();
  });
    this.bindEventHandlers(this.props);

  }

  public componentWillUnmount(): void {
    this.unbindEventHandlers();

    this.imageEditorInst.destroy();

    this.imageEditorInst = null;
  }

  shouldComponentUpdate(nextProps: ISpfxImageEditorProps): boolean {
    this.bindEventHandlers(this.props, nextProps);

    return false;
  }

  getInstance() {
    return this.imageEditorInst;
  }

  getRootElement(): HTMLDivElement {
    return this.rootElRef;
  }

  unbindEventHandlers(): void {
    Object.keys(this.props)
      .filter(this.isEventHandlerKeys)
      .forEach((key) => {
        const eventName = key[2].toLowerCase() + key.slice(3);
        this.imageEditorInst.off(eventName);
      });
  }

  bindEventHandlers(props: ISpfxImageEditorProps, prevProps?: ISpfxImageEditorProps) {
    Object.keys(props)
      .filter(this.isEventHandlerKeys)
      .forEach((key) => {
        const eventName = key[2].toLowerCase() + key.slice(3);
        // For <ImageEditor onFocus={condition ? onFocus1 : onFocus2} />
        if (prevProps && prevProps[key] !== props[key]) {
          this.imageEditorInst.off(eventName);
        }
        this.imageEditorInst.on(eventName, props[key]);
      });
  }

  isEventHandlerKeys(key: string): boolean {
    return /on[A-Z][a-zA-Z]+/.test(key);
  }

  public render(): React.ReactElement<ISpfxImageEditorProps> {

    return (
      <div ref={this.setRootElRef} />
    );
  }

  private setRootElRef(element: HTMLDivElement): void {
    this.rootElRef = element;
  }
}
