import React, { createRef, CSSProperties, PropsWithChildren, ReactElement } from 'react';
import Draggable from './components/Draggable';
import Resizable from './components/Resizable';
import DragItem from './DragItem';
import { Layout, Size, PositionMap, Position, RequiredLayout } from './types';
import { formatLayout, convertLayoutToPositionMap, ROOT_LAYOUT_KEY } from './utils';

type Props = {
  initLayout?: Layout;
  layout?: Layout;
  className?: string;
  style?: CSSProperties;
  onDragStart?: (layout: RequiredLayout) => void; // 开始拖拽分割线
  onDrag?: (layout: RequiredLayout) => void; // 拖拽分割线
  onDragEnd?: (layout: RequiredLayout) => void; // 结束拖拽分割线
  onMoveEnd?: (layout: RequiredLayout) => void; // 拖拽标题调整布局
  onResize?: (layout: RequiredLayout) => void;
  onLayoutChange?: (layout: RequiredLayout) => void;
};

type State = {
  baseLayout: RequiredLayout;
  containerShape?: Size;
  layout: RequiredLayout;
  itemPositionMap: PositionMap;
  layoutPositionMap: PositionMap;
};

const emptyLayout: RequiredLayout = {
  key: ROOT_LAYOUT_KEY,
  type: 'layout',
  children: [],
  direction: 'horizontal',
  height: 0,
  width: 0,
};

class DragLayout extends React.Component<Props, State> {
  containerRef = createRef<HTMLDivElement>();

  containerStyle: CSSProperties = {
    height: '100%',
    width: '100%',
    position: 'relative',
  };

  state: State = {
    baseLayout: emptyLayout,
    layout: emptyLayout,
    itemPositionMap: new Map<string, Position>(),
    layoutPositionMap: new Map<string, Position>(),
  };

  static getDerivedStateFromProps(
    nextProps: PropsWithChildren<Props>,
    prevState: State
  ): Partial<State> {
    // 未初始化或非受控时不修改state
    if (!prevState.containerShape || !nextProps.layout) {
      return {};
    }
    const [layout] = formatLayout(nextProps.layout, prevState.containerShape);
    const [itemPositionMap, layoutPositionMap] = convertLayoutToPositionMap(layout);
    return {
      layout,
      itemPositionMap,
      layoutPositionMap,
    };
  }

  componentDidMount() {
    const { initLayout, layout } = this.props;
    const containerShape: Size = {
      width: this.containerRef.current!.clientWidth,
      height: this.containerRef.current!.clientHeight,
    };
    const [formattedLayout] = formatLayout(layout || initLayout || emptyLayout, containerShape);
    this.setState({
      containerShape,
      layout: formattedLayout,
      baseLayout: formattedLayout,
    });
  }

  handleBaseLayoutChange = (baseLayout: RequiredLayout) => {
    this.setState({
      baseLayout,
    });
  };

  handleLayoutChange = (layout: RequiredLayout) => {
    this.setState({
      layout,
    });
    this.props.onLayoutChange?.(layout);
  };

  createClassName() {
    return this.props.className;
  }

  createStyle() {
    return {
      ...this.containerStyle,
      ...this.props.style,
    };
  }

  processItem(child: ReactElement<any>) {
    const position = this.state.itemPositionMap.get(child.key as string);
    return (
      <DragItem key={child.key} position={position}>
        {child}
      </DragItem>
    );
  }

  processDivider(position: Position) {
    const { layout, baseLayout } = this.state;
    const { handleLayoutChange, handleBaseLayoutChange } = this;
    return (
      <Draggable
        key={position.key}
        position={position}
        layout={layout}
        baseLayout={baseLayout}
        onLayoutChange={handleLayoutChange}
        onBaseLayoutChange={handleBaseLayoutChange}
      />
    );
  }

  render() {
    const { children } = this.props;
    const { itemPositionMap, layoutPositionMap, baseLayout } = this.state;
    const { handleLayoutChange } = this;
    const positionList = [
      // @ts-ignore
      ...itemPositionMap.values(),
      // @ts-ignore
      ...layoutPositionMap.values(),
    ];

    return (
      <Resizable baseLayout={baseLayout} onLayoutChange={handleLayoutChange}>
        <div ref={this.containerRef} className={this.createClassName()} style={this.createStyle()}>
          {React.Children.map(children, (child) => this.processItem(child as any))}
          {positionList.map((position) => this.processDivider(position))}
        </div>
      </Resizable>
    );
  }
}

export default DragLayout;