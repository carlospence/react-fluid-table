import React, { useCallback, useContext, useLayoutEffect, useRef } from "react";
import { ColumnProps, RowProps, Generic, CacheFunction } from "../index";
import { TableContext } from "./TableContext";

//@ts-ignore TS2307
import Minus from "./svg/minus-circle.svg";

//@ts-ignore TS2307
import Plus from "./svg/plus-circle.svg";

interface TableCellProps {
  row: Generic;
  index: number;
  width?: number;
  column: ColumnProps;
  isExpanded: boolean;
  clearSizeCache: CacheFunction;
  onExpanderClick: Function;
}

type CSSFunction = (index: number) => React.CSSProperties;

const getRowStyle = (index: number, rowStyle?: React.CSSProperties | CSSFunction) => {
  if (!rowStyle) {
    return {};
  }

  return typeof rowStyle === "function" ? rowStyle(index) : rowStyle;
};

const TableCell = React.memo(
  ({ row, index, width, column, isExpanded, clearSizeCache, onExpanderClick }: TableCellProps) => {
    // variables
    const style = {
      width: width ? `${width}px` : undefined,
      minWidth: width ? `${width}px` : undefined
    };

    // functions
    const cellRenderer = () => {
      if (column.expander) {
        let Logo: any = column.expander;
        if (typeof column.expander === "boolean") {
          Logo = isExpanded ? Minus : Plus;
          return <Logo className="expander" onClick={onExpanderClick} />;
        }

        // assume the expander is a component
        return <Logo isExpanded={isExpanded} onClick={onExpanderClick} />;
      }

      if (!column.cell) {
        return row[column.key] || null;
      }

      const CustomCell = column.cell;
      return <CustomCell row={row} index={index} clearSizeCache={clearSizeCache} />;
    };

    return (
      <div className="cell" style={style}>
        {cellRenderer()}
      </div>
    );
  }
);

const Row = ({
  row,
  index,
  style,
  borders,
  rowStyle,
  rowHeight,
  useRowWidth,
  clearSizeCache,
  calculateHeight,
  generateKeyFromRow,
  subComponent: SubComponent
}: RowProps) => {
  // hooks
  const expandedCalledRef = useRef(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const tableContext = useContext(TableContext);

  // variables
  const { height } = style;
  const { dispatch } = tableContext;
  const { uuid, columns, expanded, pixelWidths } = tableContext.state;

  // key
  const key = generateKeyFromRow(row, index);
  const rowKey = `${uuid}-${key}`;

  // expanded
  const isExpanded = Boolean(expanded[key]);
  const containerHeight = !rowHeight ? undefined : isExpanded && SubComponent ? rowHeight : "100%";

  // sub component props
  const subProps = { row, index, isExpanded, clearSizeCache };

  // row styling
  const borderBottom = borders ? undefined : "none";
  const containerStyle = {
    height: containerHeight,
    ...getRowStyle(index, rowStyle)
  };

  // function(s)
  const onExpanderClick = useCallback(() => {
    dispatch({ type: "updateExpanded", key: generateKeyFromRow(row, index) });
    expandedCalledRef.current = true;
  }, [dispatch, row, index, generateKeyFromRow, expandedCalledRef]);

  const resetHeight = useCallback(() => {
    if (!rowRef.current || !pixelWidths.length) {
      return;
    }

    const computed = calculateHeight(rowRef.current, index);
    if (height !== computed) {
      clearSizeCache(index);
    }
  }, [rowRef, index, height, calculateHeight, clearSizeCache, pixelWidths]);

  // effects
  // on expansion, clear the cache
  // every time isExpanded/pixelWidth changes, check the height
  useLayoutEffect(() => {
    if (!expandedCalledRef.current) {
      resetHeight();
    } else {
      clearSizeCache(index, true);
    }

    expandedCalledRef.current = false;
  }, [isExpanded, expandedCalledRef, resetHeight, index, clearSizeCache]);

  return (
    <div
      ref={rowRef}
      className="react-fluid-table-row"
      data-index={index}
      data-row-key={rowKey}
      style={{ ...style, borderBottom, width: useRowWidth ? style.width : undefined }}
    >
      <div className="row-container" style={containerStyle}>
        {columns.map((c: ColumnProps, i: number) => (
          <TableCell
            key={`${uuid}-${c.key}-${key}`}
            row={row}
            column={c}
            index={index}
            width={pixelWidths[i]}
            isExpanded={isExpanded}
            clearSizeCache={clearSizeCache}
            onExpanderClick={onExpanderClick}
          />
        ))}
      </div>
      {!SubComponent ? null : (
        <div className={isExpanded ? undefined : "hidden"}>
          <SubComponent {...subProps} />
        </div>
      )}
    </div>
  );
};

export default Row;