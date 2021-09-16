import React, { Component } from 'react';
import { DragSource } from 'react-dnd';
import { connect } from 'react-redux';
import './index.less';

function collect(connect) {
  return {
    connectDragSource: connect.dragSource(),
  };
}

const cardSource = {
  canDrag() {
    return true;
  },

  // 在这个函数中构造被拖拽函数的数据结构
  // beginDrag(props, monitor, component) {
  beginDrag(props) {
    // Return the data describing the dragged item
    const item = {
      id: props.id,
      // text: props.text,
      componentName: props.componentName,
      type: props.type,
      index: props.index,
      version: props.version,
      operatorLimit: props.operatorLimit,
    };
    return item;
  },

  // 在endDrag中判断是否成功添加元素，但是endDrag感觉有延迟，会等待一段时间才执行
  endDrag(props, monitor) {
    // 取消dragging
    props.setRematchValues({
      materialDragging: false,
    });

    const { addedComponent, draggingId, setRematchValues } = props;

    if (!monitor.didDrop()) {
      // drop 不成功 将拖拽添加的元素退回
      setRematchValues({
        addedComponent: addedComponent.filter((item) => item.id !== draggingId),
        draggingId: '',
      });
    } else {
      // 如果 drag && drop 成功，设置默认的active compnent
      setRematchValues({
        activeComInfo: monitor.getItem(),
      });
    }
  },
};

class DragableWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { child, key, onClick } = this.props;

    return (
      <div key={key} className='dragable-wrapper' onClick={onClick}>
        {this.props.connectDragSource(child)}
      </div>
    );
  }
}

export default connect(
  (state) => ({ ...state.rematchValues }),
  (dispatch) => ({
    ...dispatch.rematchValues,
  })
)(DragSource('box', cardSource, collect)(DragableWrapper));
