import React, { Component } from 'react';
import { connect } from 'react-redux';
import { cloneDeep } from 'lodash';
import { DragSource, DropTarget } from 'react-dnd';
import { getUuid as uuid } from '@cfe/util';
import './index.less';

const dragCardSource = {
  canDrag() {
    return true;
  },

  isDragging(props, monitor) {
    return monitor.getItem().id === props.id;
  },

  // 在这个函数中构造被拖拽函数的数据结构
  beginDrag(props) {
    const item = {
      id: props.id,
      componentName: props.componentName,
      type: props.type,
      index: props.index,
      version: props.version,
      operatorLimit: props.operatorLimit,
    };
    return item;
  },

  endDrag(props, monitor, component) {
    console.log('endDrag', component);
    if (!monitor.didDrop()) {
    }

  },
};

const dropCardSource = {
  hover(props, monitor, component) {
    if (!component) {
      return null;
    }
    const item = monitor.getItem(); // item标识正在被做拖拽的元素
    const { dragHoverIndex } = props; // 存在 redux中的 hover的元素下标 （上一次）

    // case1: 从 materialList 拖拽进来、且放置那一刻将 item 添加
    if (!item.id && !item.index && !props.materialDragging) {
      console.log('case1');
      item.id = `${item.type}_${item.version.replaceAll('.', '-')}_${uuid()}`;
      const newAddedComponnet = cloneDeep(props.addedComponent);
      newAddedComponnet.splice(props.index, 0, item); //  在hover元素之前放置drag元素
      props.setRematchValues({
        addedComponent: newAddedComponnet,
        materialDragging: true,
        draggingId: item.id, // draggingId 是在拖放动作失败时用于回退本次操作(因为在hover的时候已经将数据插进去了)
        dragHoverIndex: props.index, // 标记一下 hovering 的 index
      });
      return;
    }

    // case2: 从 materialList 拖拽进来 并且切换顺序时
    if (props.materialDragging && ![dragHoverIndex].includes(props.index)) {
      const { draggingId } = props;
      item.id = draggingId;
      // 先将插进去的元素过滤掉， 然后在新的位置插入一个新的元素 (但draggingId不需要重新生成)
      const newAddedComponnet = cloneDeep(
        props.addedComponent.filter((item) => item.id !== draggingId)
      );
      newAddedComponnet.splice(props.index, 0, item); //  在hover元素之前放置drag元素
      props.setRematchValues({
        addedComponent: newAddedComponnet,
        draggingId: item.id,
        materialDragging: true, // 标识当前是否在拖拽
        dragHoverIndex: props.index,
      });
      monitor.getItem().index = props.index; //  由于交换了位置，需要手动设置一下monitor中的index
    }

    // case3: 拖拽排序
    const node = component;
    if (!node) {
      return null;
    }

    if (item.operatorLimit?.includes('drag')) {
      return null;
    }
    const dragIndex = item.index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    const hoverBoundingRect = node.getBoundingClientRect();

    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    const clientOffset = monitor.getClientOffset();

    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    props.moveComponnet(dragIndex, hoverIndex);

    monitor.getItem().index = hoverIndex;
  },
};

class DragableAndDropableWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {
      forwardedRef,
      child,
      key,
      connectDropTarget,
      connectDragSource,
      className,
      isDragging,
      onClick,
    } = this.props;

    const opacity = isDragging ? 0 : 1;
    return connectDropTarget(
      connectDragSource(
        <div
          ref={forwardedRef}
          key={key}
          className={`drag-drop-wrapper ${className}`}
          style={{ opacity }}
          onClick={onClick}
        >
          {child}
        </div>
      )
    );
  }
}

const RefHOC = React.forwardRef((props, ref) => (
  <DragableAndDropableWrapper {...props} forwardedRef={ref} />
));

export default connect(
  (state) => ({
    ...state.rematchValues,
  }),
  (dispatch) => ({
    ...dispatch.rematchValues,
  })
)(
  DropTarget('box', dropCardSource, (connect) => ({
    connectDropTarget: connect.dropTarget(),
  }))(
    DragSource('box', dragCardSource, (connect, monitor) => ({
      connectDragSource: connect.dragSource(),
      isDragging: monitor.isDragging(),
    }))(RefHOC)
  )
);
