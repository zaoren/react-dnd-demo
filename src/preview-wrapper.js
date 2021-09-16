import { connect } from 'react-redux';
import React, { Component } from 'react';
import { DropTarget } from 'react-dnd';
import update from 'immutability-helper';
import { uuid } from '@/utils';
import './index.less';

const dropCardSource = {
 
  canDrop() {
    return true;
  },
  /**
   * @desc 当被拖拽的元素放下时执行
   * @params component drop组件本身
   */
  drop(props, monitor) {
    const { addCompnentToList, dragHoverIndex, materialDragging } = props;
    // 为了防止同时响应drag事件和hover事件，添加多个元素的情况
    if ((dragHoverIndex || dragHoverIndex === 0) && materialDragging) {
      return;
    }

    if (monitor.didDrop()) {
      return;
    }
    const item = monitor.getItem();

    // 拖拽时生成唯一的 uuid 可能出现同一个组件添加多次的情况
    item.id = `${item.type}_${item.version.replaceAll('.', '-')}_${uuid()}`;
    // 仅拖拽时需要新增组件，排序时不需要
    if (item.operatorLimit?.includes('drag')) {
      addCompnentToList(item);
    }

    return { moved: true };
  },
};

class PrevieWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  moveComponnet = (dragIndex, hoverIndex) => {
    // const { addedComponent, myDispatch } = this.props;
    const { addedComponent } = this.props;
    const dragComponent = addedComponent[dragIndex];
    const newAddedComponnet = update(addedComponent, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragComponent],
      ],
    });
    this.props.setGenerateLinkReducer({
      addedComponent: newAddedComponnet,
    });
  };

  triggerActive = (componentConfig) => {
    this.props.setGenerateLinkReducer({
      activeComInfo: componentConfig,
      paneType: 'componentConfig',
    });
  };

  getH5Componnets = (addedComponent, activeComInfo) => (
    <div className='h5-components-wrapper'>
      {addedComponent.map((componentConfig, index) => {
        <>
         组件
        </>
      })}
    </div>
  );

  render() {
    const {
      connectDropTarget,
      canDrop,
      isOver,
      addedComponent = [],
      activeComInfo = {},
    } = this.props;

    const { formRef } = this.props;
    const formValus = formRef.current?.getFieldsValue() || {};
    const { contentPic = [] } = formValus;
    let { backgroundColor } = formValus;

    backgroundColor = backgroundColor?.hex || '#fff';

    let borderColor = '#000';
    console.log('addedComponent', addedComponent);
    const h5Components = this.getH5Componnets(addedComponent, activeComInfo);
    const isActive = canDrop && isOver;
    if (isActive) {
      borderColor = '#77d96c'; // 可以被放置，且鼠标在当前区域
    } else if (canDrop) {
      borderColor = '#f6eac8'; // 可以被放置
    }
    return (
      <div className='preview-wrapper'>
        <div className='page-content'>
          <h3 className='page-title'>{formValus.pageTitle}</h3>
          {connectDropTarget(
            <div
              className='preview-wrapper-container'
              style={{
                backgroundColor,
                backgroundImage: `url(${contentPic?.[0]?.url})` || '',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                borderColor,
              }}
            >
              {addedComponent?.length === 0 ? (
                <h3>你可以往这放</h3>
              ) : (
                h5Components
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect(
  (state) => ({ ...state.rematchValues }),
  (dispatch) => ({
    ...dispatch.rematchValues,
  })
)(
  DropTarget(['box'], dropCardSource, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    addCompnentToList: connect.addCompnentToList,
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop(),
  }))(PrevieWrapper)
);
