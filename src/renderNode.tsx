import React, { ComponentType, ReactElement, ReactNode } from 'react';

/**
 * Types of content that can be rendered
 */
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

/**
 * Utility function to render different types of content with a component
 *
 * @param Component - The React component to render
 * @param content - The content to render with the component
 * @param defaultProps - Default props to pass to the component
 * @returns The rendered React node
 */
export const renderNode = <P extends Record<string, any>>(
  Component: ComponentType<P>,
  content: RenderableContent,
  defaultProps?: Partial<P>
): ReactNode => {
  try {
    // Handle null or false content
    if (content == null || content === false) {
      return null;
    }

    // Handle React elements
    if (React.isValidElement(content)) {
      return content;
    }

    // Handle function content (render props)
    if (typeof content === 'function') {
      try {
        return content();
      } catch (error) {
        console.warn('Error calling render function:', error);
        return null;
      }
    }

    // Handle boolean true content
    if (content === true) {
      return <Component {...(defaultProps as P)} />;
    }

    // Handle string or number content
    if (typeof content === 'string' || typeof content === 'number') {
      return <Component {...(defaultProps as P)}>{content}</Component>;
    }

    // Handle object content as props
    if (typeof content === 'object') {
      return <Component {...(defaultProps as P)} {...(content as P)} />;
    }

    // Fallback for any other type
    console.warn(`Unsupported content type: ${typeof content}`);
    return null;
  } catch (error) {
    console.warn('Error in renderNode:', error);
    return null;
  }
};
