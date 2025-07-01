import React from 'react';
import colors from './colors';
import { TextStyle, View, ViewStyle, StyleSheet, Text } from 'react-native';
import { SwiperControlsProps } from '..';
import { Badge } from './Badge';
import { Button } from './Button';
import { renderNode } from './renderNode';

const cellPositions = [
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
] as const;

const Dot: React.FC<any> = ({ isActive, onPress, dotProps = {}, dotActiveStyle }) => {
  const { containerStyle, badgeStyle, ...others } = dotProps || {};
  return (
    <Badge
      theme={{ colors }}
      containerStyle={StyleSheet.flatten([
        styles.dotsItemContainer,
        containerStyle,
      ])}
      badgeStyle={StyleSheet.flatten([
        styles.dotsItem({ colors }, isActive),
        badgeStyle,
        isActive && dotActiveStyle,
      ])}
      onPress={onPress}
      {...others}
    />
  );
};

const Dots: React.FC<any> = ({
  vertical,
  count,
  activeIndex,
  dotsTouchable,
  dotsWrapperStyle,
  DotComponent = Dot,
  goTo,
  dotProps,
  dotActiveStyle,
}) => {
  return (
    <View
      style={StyleSheet.flatten([
        styles.dotsWrapper(vertical),
        dotsWrapperStyle,
      ])}
    >
      {Array.from({ length: count }, (_, index) => (
        <DotComponent
          key={index}
          index={index}
          activeIndex={activeIndex}
          isActive={activeIndex === index}
          onPress={!dotsTouchable ? undefined : () => goTo(index)}
          dotProps={dotProps}
          dotActiveStyle={dotActiveStyle}
        />
      ))}
    </View>
  );
};

const Prev: React.FC<any> = ({
  goToPrev,
  isFirst,
  prevTitle,
  firstPrevElement,
  prevTitleStyle,
  PrevComponent = Button,
}) => {
  if (isFirst) return renderNode(Text, firstPrevElement);
  return (
    <PrevComponent
      theme={{ colors }}
      type="clear"
      title={prevTitle}
      titleStyle={StyleSheet.flatten([
        styles.buttonTitleStyle({ colors }, 'prev'),
        prevTitleStyle,
      ])}
      onPress={goToPrev}
    />
  );
};

const Next: React.FC<any> = ({
  goToNext,
  isLast,
  nextTitle,
  lastNextElement,
  nextTitleStyle,
  NextComponent = Button,
}) => {
  if (isLast) return renderNode(Text, lastNextElement);
  return (
    <NextComponent
      theme={{ colors }}
      type="clear"
      title={nextTitle}
      titleStyle={StyleSheet.flatten([
        styles.buttonTitleStyle({ colors }, 'next'),
        nextTitleStyle,
      ])}
      onPress={goToNext}
    />
  );
};

const Cell: React.FC<any> = ({ name, cellsStyle = {}, cellsContent = {}, dotPosition, prevPosition, nextPosition, ...props }) => {
  return (
    <View style={StyleSheet.flatten([styles.cell, cellsStyle[name]])}>
      {dotPosition === name && <Dots {...props} />}
      {prevPosition === name && <Prev {...props} />}
      {nextPosition === name && <Next {...props} />}
      {cellsContent[name] && renderNode(Text, cellsContent[name])}
    </View>
  );
};

const Row: React.FC<any> = ({ rowAlign = 'center', contentAlign, ...props }) => {
  const row = [
    `${!rowAlign ? '' : rowAlign + '-'}left`,
    rowAlign,
    `${!rowAlign ? '' : rowAlign + '-'}right`,
  ] as const;
  const alignItems = ['flex-start', 'center', 'flex-end'] as const;

  return (
    <View style={styles.row}>
      {row.map((name, index) => (
        <View key={name} style={styles.spaceHolder(alignItems[index])}>
          <Cell name={name} {...props} />
        </View>
      ))}
    </View>
  );
};

const getPos = (prop: any, horizontalDefault: string, verticalDefault: string, vertical: boolean) => {
  if (prop === false) return null;
  return prop || (vertical ? verticalDefault : horizontalDefault);
};

const DefaultControls: React.FC<SwiperControlsProps> = (props) => {
  const {
    vertical = false,
    prevTitle = 'Prev',
    nextTitle = 'Next',
  } = props;

  const dotPosition = getPos(props.dotsPos, 'bottom', 'right', vertical);
  const prevPosition = getPos(props.prevPos, 'bottom-left', 'top-right', vertical);
  const nextPosition = getPos(props.nextPos, 'bottom-right', 'top-left', vertical);

  return (
    <>
      <Row rowAlign="top" contentAlign="flex-start" {...props} dotPosition={dotPosition} prevPosition={prevPosition} nextPosition={nextPosition} />
      <Row rowAlign="center" {...props} dotPosition={dotPosition} prevPosition={prevPosition} nextPosition={nextPosition} />
      <Row rowAlign="bottom" contentAlign="flex-end" {...props} dotPosition={dotPosition} prevPosition={prevPosition} nextPosition={nextPosition} />
    </>
  );
};

type Styles = {
  row: ViewStyle;
  spaceHolder: (alignItems: 'flex-start' | 'center' | 'flex-end') => ViewStyle;
  cell: ViewStyle;
  dotsWrapper: (vertical: boolean) => ViewStyle;
  dotsItemContainer: ViewStyle;
  dotsItem: (theme: any, isActive: boolean) => ViewStyle;
  buttonTitleStyle: (theme: any, type: 'prev' | 'next') => TextStyle;
  hidden: ViewStyle;
};

const styles: Styles = {
  row: {
    flexDirection: 'row',
    height: 0,
    alignItems: 'center',
    margin: 20,
  },
  spaceHolder: alignItems => ({
    height: 0,
    flex: 1,
    alignItems,
    justifyContent: 'center',
  }),
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  dotsWrapper: vertical => ({
    flexDirection: vertical ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 1,
    minHeight: 1,
  }),
  dotsItemContainer: {
    margin: 3,
  },
  dotsItem: (theme, isActive) => ({
    backgroundColor: isActive ? theme.colors.primary : theme.colors.grey3,
    borderColor: 'transparent',
  }),
  buttonTitleStyle: (theme, type) => ({
    color: type === 'prev' ? theme.colors.grey3 : theme.colors.primary,
  }),
  hidden: {
    opacity: 0,
  },
};

export default DefaultControls;
