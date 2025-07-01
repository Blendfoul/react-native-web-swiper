import React, { ComponentType, ReactElement, ReactNode } from 'react';

type RenderableContent = 
  | null 
  | false 
  | true 
  | string 
  | number 
  | ReactElement 
  | (() => ReactElement)
  | ReactNode
  | Record<string, any>;

export const renderNode = (
  Component: ComponentType<any>,
  content: RenderableContent,
  defaultProps?: Record<string, any>
): ReactNode => {
  if (content == null || content === false) {
    return null;
  }
  if (React.isValidElement(content)) {
    return content;
  }
  if (typeof content === 'function') {
    return content();
  }
  // Just in case
  if (content === true) {
    return <Component {...(defaultProps || {})} />;
  }
  if (typeof content === 'string' || typeof content === 'number') {
    return <Component {...(defaultProps || {})}>{content}</Component>;
  }

  return <Component {...(defaultProps || {})} {...content as Record<string, any>} />;
};
