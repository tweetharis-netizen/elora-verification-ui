import React, { forwardRef } from 'react';

// Basic Motion Component Polyfill
const MotionComponent = (tag) => {
    const Component = forwardRef(({ children, className, animate, initial, exit, transition, whileHover, ...props }, ref) => {
        const Tag = tag;
        return (
            <Tag ref={ref} className={className} {...props}>
                {children}
            </Tag>
        );
    });
    Component.displayName = `Motion.${tag}`;
    return Component;
};

export const motion = {
    div: MotionComponent('div'),
    span: MotionComponent('span'),
    p: MotionComponent('p'),
    h1: MotionComponent('h1'),
    h2: MotionComponent('h2'),
    h3: MotionComponent('h3'),
    button: MotionComponent('button'),
    a: MotionComponent('a'),
    ul: MotionComponent('ul'),
    li: MotionComponent('li'),
    // Add others if needed
};

// AnimatePresence Polyfill - just renders children
export const AnimatePresence = ({ children, mode }) => {
    return <>{children}</>;
};
